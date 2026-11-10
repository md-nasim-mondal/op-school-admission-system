using System.Data;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SchoolAdmission.Application.Common;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Application.Validators;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Domain.Exceptions;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.Infrastructure.Services;

public class AdmissionService : IAdmissionService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IValidator<CreateClassRequest> _createClassValidator;
    private readonly AdmissionSettings _settings;
    private readonly ILogger<AdmissionService> _logger;

    public AdmissionService(
        ApplicationDbContext dbContext,
        IValidator<CreateClassRequest> createClassValidator,
        IOptions<AdmissionSettings> settings,
        ILogger<AdmissionService> logger)
    {
        _dbContext = dbContext;
        _createClassValidator = createClassValidator;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<ClassCreatedResponse> CreateClassAsync(
        CreateClassRequest request, 
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _createClassValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new Domain.Exceptions.ValidationException(errors);
        }

        var classId = $"c_{Guid.NewGuid():N}"[..10];
        var now = DateTime.UtcNow;

        var entity = new ClassEntity
        {
            Id = classId,
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _dbContext.Classes.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created class {ClassId} '{ClassName}' with {TotalSeats} seats", 
            entity.Id, entity.Name, entity.TotalSeats);

        return new ClassCreatedResponse(entity.Id, entity.Name, entity.TotalSeats);
    }

    public async Task<IReadOnlyList<ClassDetailsResponse>> GetAllClassesAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var classes = await _dbContext.Classes
            .AsNoTracking()
            .OrderBy(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var activeOrConfirmedHolds = await _dbContext.Holds
            .AsNoTracking()
            .Where(h => h.Status == HoldStatus.HELD || h.Status == HoldStatus.CONFIRMED)
            .ToListAsync(cancellationToken);

        var result = new List<ClassDetailsResponse>(classes.Count);
        foreach (var c in classes)
        {
            var classHolds = activeOrConfirmedHolds.Where(h => h.ClassId == c.Id);
            var heldSeats = classHolds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAtUtc > now);
            var confirmedSeats = classHolds.Count(h => h.Status == HoldStatus.CONFIRMED);
            var availableSeats = Math.Max(0, c.TotalSeats - heldSeats - confirmedSeats);

            result.Add(new ClassDetailsResponse(
                c.Id,
                c.Name,
                c.TotalSeats,
                heldSeats,
                confirmedSeats,
                availableSeats));
        }

        return result;
    }

    public async Task<ClassDetailsResponse> GetClassByIdAsync(
        string classId, 
        CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException($"Class with id '{classId}' was not found.");
        }

        var now = DateTime.UtcNow;
        var holds = await _dbContext.Holds
            .AsNoTracking()
            .Where(h => h.ClassId == classId && (h.Status == HoldStatus.HELD || h.Status == HoldStatus.CONFIRMED))
            .ToListAsync(cancellationToken);

        var heldSeats = holds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAtUtc > now);
        var confirmedSeats = holds.Count(h => h.Status == HoldStatus.CONFIRMED);
        var availableSeats = Math.Max(0, entity.TotalSeats - heldSeats - confirmedSeats);

        return new ClassDetailsResponse(
            entity.Id,
            entity.Name,
            entity.TotalSeats,
            heldSeats,
            confirmedSeats,
            availableSeats);
    }

    public async Task<HoldResponse> CreateHoldAsync(
        string classId, 
        string studentId, 
        CancellationToken cancellationToken = default)
    {
        StudentIdValidator.Validate(studentId);
        studentId = studentId.Trim();

        using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted, 
            cancellationToken);

        try
        {
            // 1. Lock class row using SELECT FOR UPDATE
            var admissionClass = await _dbContext.Classes
                .FromSqlInterpolated($"SELECT * FROM \"Classes\" WHERE \"Id\" = {classId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (admissionClass == null)
            {
                throw new NotFoundException($"Class with id '{classId}' was not found.");
            }

            var now = DateTime.UtcNow;

            // 2. Mark overdue holds for this class as EXPIRED inside this transaction
            await _dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"Holds\" SET \"Status\" = 'EXPIRED' WHERE \"ClassId\" = {classId} AND \"Status\" = 'HELD' AND \"ExpiresAtUtc\" <= {now}",
                cancellationToken);

            // 3. Validate student does not already have an active hold or confirmed admission
            var hasActiveHoldOrConfirmed = await _dbContext.Holds
                .AnyAsync(h => h.StudentId == studentId &&
                    ((h.Status == HoldStatus.HELD && h.ExpiresAtUtc > now) || h.Status == HoldStatus.CONFIRMED),
                    cancellationToken);

            if (hasActiveHoldOrConfirmed)
            {
                throw new ConflictException("Student already has an active hold or confirmed admission.");
            }

            // 4. Calculate current occupancy
            var heldCount = await _dbContext.Holds.CountAsync(
                h => h.ClassId == classId && h.Status == HoldStatus.HELD && h.ExpiresAtUtc > now,
                cancellationToken);

            var confirmedCount = await _dbContext.Holds.CountAsync(
                h => h.ClassId == classId && h.Status == HoldStatus.CONFIRMED,
                cancellationToken);

            if (heldCount + confirmedCount >= admissionClass.TotalSeats)
            {
                throw new ConflictException("No seats available for this class.");
            }

            // 5. Create new hold
            var holdId = $"h_{Guid.NewGuid():N}"[..10];
            var durationSeconds = _settings.HoldDurationSeconds > 0 ? _settings.HoldDurationSeconds : 600;
            var expiresAt = now.AddSeconds(durationSeconds);

            var newHold = new AdmissionHold
            {
                Id = holdId,
                ClassId = classId,
                StudentId = studentId,
                Status = HoldStatus.HELD,
                CreatedAtUtc = now,
                ExpiresAtUtc = expiresAt
            };

            _dbContext.Holds.Add(newHold);
            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Created hold {HoldId} for student {StudentId} in class {ClassId}. Expires at {ExpiresAt}",
                newHold.Id, newHold.StudentId, newHold.ClassId, newHold.ExpiresAtUtc);

            return new HoldResponse(
                newHold.Id,
                newHold.ClassId,
                newHold.StudentId,
                newHold.Status.ToString(),
                newHold.ExpiresAtUtc);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<HoldStatusResponse> GetHoldByIdAsync(
        string holdId, 
        CancellationToken cancellationToken = default)
    {
        var hold = await _dbContext.Holds
            .FirstOrDefaultAsync(h => h.Id == holdId, cancellationToken);

        if (hold == null)
        {
            throw new NotFoundException($"Hold with id '{holdId}' was not found.");
        }

        var now = DateTime.UtcNow;
        if (hold.Status == HoldStatus.HELD && hold.ExpiresAtUtc <= now)
        {
            hold.Status = HoldStatus.EXPIRED;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return new HoldStatusResponse(
            hold.Id,
            hold.ClassId,
            hold.Status.ToString(),
            hold.ExpiresAtUtc);
    }

    public async Task<ConfirmHoldResponse> ConfirmHoldAsync(
        string holdId, 
        string studentId, 
        CancellationToken cancellationToken = default)
    {
        StudentIdValidator.Validate(studentId);
        studentId = studentId.Trim();

        using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted, 
            cancellationToken);

        try
        {
            // Acquire row lock on hold
            var hold = await _dbContext.Holds
                .FromSqlInterpolated($"SELECT * FROM \"Holds\" WHERE \"Id\" = {holdId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (hold == null)
            {
                throw new NotFoundException($"Hold with id '{holdId}' was not found.");
            }

            var now = DateTime.UtcNow;
            hold.Confirm(studentId, now);

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Confirmed admission hold {HoldId} for student {StudentId}", hold.Id, studentId);

            return new ConfirmHoldResponse(hold.Id, hold.Status.ToString());
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task CancelHoldAsync(
        string holdId, 
        string studentId, 
        CancellationToken cancellationToken = default)
    {
        StudentIdValidator.Validate(studentId);
        studentId = studentId.Trim();

        using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted, 
            cancellationToken);

        try
        {
            var hold = await _dbContext.Holds
                .FromSqlInterpolated($"SELECT * FROM \"Holds\" WHERE \"Id\" = {holdId} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken);

            if (hold == null)
            {
                throw new NotFoundException($"Hold with id '{holdId}' was not found.");
            }

            var now = DateTime.UtcNow;
            hold.Cancel(studentId, now);

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Cancelled admission hold {HoldId} for student {StudentId}", hold.Id, studentId);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyList<StudentHoldResponse>> GetHoldsByStudentAsync(
        string studentId, 
        CancellationToken cancellationToken = default)
    {
        StudentIdValidator.Validate(studentId);
        studentId = studentId.Trim();

        var holds = await _dbContext.Holds
            .Include(h => h.Class)
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var hasChanges = false;
        foreach (var hold in holds)
        {
            if (hold.Status == HoldStatus.HELD && hold.ExpiresAtUtc <= now)
            {
                hold.Status = HoldStatus.EXPIRED;
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return holds.Select(h => new StudentHoldResponse(
            h.Id,
            h.ClassId,
            h.Class?.Name ?? string.Empty,
            h.Status.ToString(),
            h.ExpiresAtUtc)).ToList();
    }

    public async Task<int> ProcessExpiredHoldsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var expiredCount = await _dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Holds\" SET \"Status\" = 'EXPIRED' WHERE \"Status\" = 'HELD' AND \"ExpiresAtUtc\" <= {now}",
            cancellationToken);

        if (expiredCount > 0)
        {
            _logger.LogInformation("Background worker expired {Count} overdue holds at {Now}", expiredCount, now);
        }

        return expiredCount;
    }
}
