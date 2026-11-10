namespace SchoolAdmission.Application.Common;

public class AdmissionSettings
{
    public const string SectionName = "AdmissionSettings";

    public int HoldDurationSeconds { get; set; } = 600;
}
