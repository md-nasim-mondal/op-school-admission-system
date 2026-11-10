using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Domain.Exceptions;
using Xunit;

namespace SchoolAdmission.UnitTests.DomainTests;

public class AdmissionHoldTests
{
    private const string ValidStudentId = "20152691234567890";
    private const string OtherStudentId = "20152699999999999";

    [Fact]
    public void Confirm_ShouldThrowForbidden_WhenStudentIdDoesNotMatch()
    {
        // Arrange
        var hold = new AdmissionHold
        {
            Id = "h_1",
            StudentId = ValidStudentId,
            Status = HoldStatus.HELD,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10)
        };

        // Act & Assert
        Assert.Throws<ForbiddenException>(() => hold.Confirm(OtherStudentId, DateTime.UtcNow));
    }

    [Fact]
    public void Confirm_ShouldTransitionToConfirmed_WhenValid()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var hold = new AdmissionHold
        {
            Id = "h_1",
            StudentId = ValidStudentId,
            Status = HoldStatus.HELD,
            ExpiresAtUtc = now.AddMinutes(10)
        };

        // Act
        hold.Confirm(ValidStudentId, now);

        // Assert
        Assert.Equal(HoldStatus.CONFIRMED, hold.Status);
        Assert.Equal(now, hold.ConfirmedAtUtc);
    }

    [Fact]
    public void Confirm_ShouldBeIdempotent_WhenAlreadyConfirmed()
    {
        // Arrange
        var initialConfirmedTime = DateTime.UtcNow.AddMinutes(-5);
        var hold = new AdmissionHold
        {
            Id = "h_1",
            StudentId = ValidStudentId,
            Status = HoldStatus.CONFIRMED,
            ConfirmedAtUtc = initialConfirmedTime
        };

        // Act - repeated confirmation
        hold.Confirm(ValidStudentId, DateTime.UtcNow);

        // Assert - remains confirmed, timestamp unchanged
        Assert.Equal(HoldStatus.CONFIRMED, hold.Status);
        Assert.Equal(initialConfirmedTime, hold.ConfirmedAtUtc);
    }

    [Fact]
    public void Confirm_ShouldThrowConflict_WhenExpired()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var hold = new AdmissionHold
        {
            Id = "h_1",
            StudentId = ValidStudentId,
            Status = HoldStatus.HELD,
            ExpiresAtUtc = now.AddMinutes(-1) // expired
        };

        // Act & Assert
        var ex = Assert.Throws<ConflictException>(() => hold.Confirm(ValidStudentId, now));
        Assert.Contains("expired", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(HoldStatus.EXPIRED, hold.Status);
    }

    [Fact]
    public void Cancel_ShouldThrowForbidden_WhenStudentIdDoesNotMatch()
    {
        // Arrange
        var hold = new AdmissionHold
        {
            Id = "h_1",
            StudentId = ValidStudentId,
            Status = HoldStatus.HELD,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10)
        };

        // Act & Assert
        Assert.Throws<ForbiddenException>(() => hold.Cancel(OtherStudentId, DateTime.UtcNow));
    }

    [Fact]
    public void Cancel_ShouldTransitionToCancelled_WhenValid()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var hold = new AdmissionHold
        {
            Id = "h_1",
            StudentId = ValidStudentId,
            Status = HoldStatus.HELD,
            ExpiresAtUtc = now.AddMinutes(10)
        };

        // Act
        hold.Cancel(ValidStudentId, now);

        // Assert
        Assert.Equal(HoldStatus.CANCELLED, hold.Status);
        Assert.Equal(now, hold.CancelledAtUtc);
    }

    [Fact]
    public void Cancel_ShouldThrowConflict_WhenAlreadyConfirmed()
    {
        // Arrange
        var hold = new AdmissionHold
        {
            Id = "h_1",
            StudentId = ValidStudentId,
            Status = HoldStatus.CONFIRMED
        };

        // Act & Assert
        Assert.Throws<ConflictException>(() => hold.Cancel(ValidStudentId, DateTime.UtcNow));
    }
}
