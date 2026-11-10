using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Application.Validators;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
public class StudentController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public StudentController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpGet("me/holds")]
    [ProducesResponseType(typeof(IReadOnlyList<StudentHoldResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyHolds(
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken cancellationToken)
    {
        StudentIdValidator.Validate(studentId);

        var response = await _admissionService.GetHoldsByStudentAsync(studentId!, cancellationToken);
        return Ok(response);
    }
}
