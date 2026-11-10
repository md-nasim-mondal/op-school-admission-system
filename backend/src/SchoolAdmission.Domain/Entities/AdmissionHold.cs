using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Domain.Exceptions;

namespace SchoolAdmission.Domain.Entities;

public class AdmissionHold
{
    public string Id { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public ClassEntity? Class { get; set; }

    public string StudentId { get; set; } = string.Empty;
    public HoldStatus Status { get; set; } = HoldStatus.HELD;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? ConfirmedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }

    public bool IsActive(DateTime nowUtc) =>
        Status == HoldStatus.HELD && ExpiresAtUtc > nowUtc;

    public bool IsExpired(DateTime nowUtc) =>
        Status == HoldStatus.HELD && ExpiresAtUtc <= nowUtc;

    public void Expire(DateTime nowUtc)
    {
        if (Status == HoldStatus.HELD && ExpiresAtUtc <= nowUtc)
        {
            Status = HoldStatus.EXPIRED;
        }
    }

    public void Confirm(string requestingStudentId, DateTime nowUtc)
    {
        if (!string.Equals(StudentId, requestingStudentId, StringComparison.Ordinal))
        {
            throw new ForbiddenException("Hold does not belong to the requesting student.");
        }

        if (Status == HoldStatus.CONFIRMED)
        {
            // Already confirmed - idempotent operation
            return;
        }

        if (Status != HoldStatus.HELD)
        {
            throw new ConflictException($"Cannot confirm hold in status {Status}.");
        }

        if (ExpiresAtUtc <= nowUtc)
        {
            Status = HoldStatus.EXPIRED;
            throw new ConflictException("Hold has expired and cannot be confirmed.");
        }

        Status = HoldStatus.CONFIRMED;
        ConfirmedAtUtc = nowUtc;
    }

    public void Cancel(string requestingStudentId, DateTime nowUtc)
    {
        if (!string.Equals(StudentId, requestingStudentId, StringComparison.Ordinal))
        {
            throw new ForbiddenException("Hold does not belong to the requesting student.");
        }

        if (Status == HoldStatus.CANCELLED)
        {
            // Already cancelled - idempotent
            return;
        }

        if (Status == HoldStatus.CONFIRMED)
        {
            throw new ConflictException("Confirmed admissions cannot be cancelled.");
        }

        Status = HoldStatus.CANCELLED;
        CancelledAtUtc = nowUtc;
    }
}
