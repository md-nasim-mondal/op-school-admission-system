using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Interfaces;

public interface IAdmissionService
{
    Task<ClassCreatedResponse> CreateClassAsync(CreateClassRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassDetailsResponse>> GetAllClassesAsync(CancellationToken cancellationToken = default);
    Task<ClassDetailsResponse> GetClassByIdAsync(string classId, CancellationToken cancellationToken = default);
    Task<HoldResponse> CreateHoldAsync(string classId, string studentId, CancellationToken cancellationToken = default);
    Task<HoldStatusResponse> GetHoldByIdAsync(string holdId, CancellationToken cancellationToken = default);
    Task<ConfirmHoldResponse> ConfirmHoldAsync(string holdId, string studentId, CancellationToken cancellationToken = default);
    Task CancelHoldAsync(string holdId, string studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentHoldResponse>> GetHoldsByStudentAsync(string studentId, CancellationToken cancellationToken = default);
    Task<int> ProcessExpiredHoldsAsync(CancellationToken cancellationToken = default);
}
