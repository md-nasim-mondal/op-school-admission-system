using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using Xunit;

namespace SchoolAdmission.UnitTests.DomainTests;

public class ClassEntityTests
{
    [Fact]
    public void CalculateSeatCounts_ShouldExcludeExpiredHolds()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var admissionClass = new ClassEntity
        {
            Id = "c_test1",
            Name = "Class 6 - Morning",
            TotalSeats = 100
        };

        // 1 active hold
        admissionClass.Holds.Add(new AdmissionHold
        {
            Id = "h_1",
            ClassId = "c_test1",
            StudentId = "12345678901234567",
            Status = HoldStatus.HELD,
            ExpiresAtUtc = now.AddMinutes(5)
        });

        // 1 expired hold (expired 1 minute ago)
        admissionClass.Holds.Add(new AdmissionHold
        {
            Id = "h_2",
            ClassId = "c_test1",
            StudentId = "12345678901234568",
            Status = HoldStatus.HELD,
            ExpiresAtUtc = now.AddMinutes(-1)
        });

        // 1 confirmed hold
        admissionClass.Holds.Add(new AdmissionHold
        {
            Id = "h_3",
            ClassId = "c_test1",
            StudentId = "12345678901234569",
            Status = HoldStatus.CONFIRMED,
            ExpiresAtUtc = now.AddMinutes(-10),
            ConfirmedAtUtc = now.AddMinutes(-15)
        });

        // Act
        var (held, confirmed, available) = admissionClass.CalculateSeatCounts(now);

        // Assert: only 1 active hold counted, 1 confirmed counted, expired hold released
        Assert.Equal(1, held);
        Assert.Equal(1, confirmed);
        Assert.Equal(98, available);
    }

    [Fact]
    public void CalculateSeatCounts_ShouldNeverReturnNegativeAvailableSeats()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var admissionClass = new ClassEntity
        {
            Id = "c_test2",
            Name = "Class 1",
            TotalSeats = 1
        };

        admissionClass.Holds.Add(new AdmissionHold
        {
            Id = "h_1",
            ClassId = "c_test2",
            StudentId = "11111111111111111",
            Status = HoldStatus.CONFIRMED
        });
        admissionClass.Holds.Add(new AdmissionHold
        {
            Id = "h_2",
            ClassId = "c_test2",
            StudentId = "22222222222222222",
            Status = HoldStatus.CONFIRMED
        });

        // Act
        var (held, confirmed, available) = admissionClass.CalculateSeatCounts(now);

        // Assert
        Assert.Equal(0, held);
        Assert.Equal(2, confirmed);
        Assert.Equal(0, available); // Math.Max(0, 1 - 2)
    }
}
