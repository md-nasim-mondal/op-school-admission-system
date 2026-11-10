using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Domain.Entities;

public class ClassEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<AdmissionHold> Holds { get; set; } = new List<AdmissionHold>();

    public (int HeldSeats, int ConfirmedSeats, int AvailableSeats) CalculateSeatCounts(DateTime nowUtc)
    {
        var heldSeats = Holds.Count(h => h.Status == HoldStatus.HELD && h.ExpiresAtUtc > nowUtc);
        var confirmedSeats = Holds.Count(h => h.Status == HoldStatus.CONFIRMED);
        var availableSeats = Math.Max(0, TotalSeats - heldSeats - confirmedSeats);

        return (heldSeats, confirmedSeats, availableSeats);
    }
}
