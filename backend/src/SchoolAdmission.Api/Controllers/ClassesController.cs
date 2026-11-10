using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Application.Validators;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
public class ClassesController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public ClassesController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpPost("classes")]
    [ProducesResponseType(typeof(ClassCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request, CancellationToken cancellationToken)
    {
        var response = await _admissionService.CreateClassAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetClassById), new { classId = response.Id }, response);
    }

    [HttpGet("classes")]
    [ProducesResponseType(typeof(IReadOnlyList<ClassDetailsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllClasses(CancellationToken cancellationToken)
    {
        var response = await _admissionService.GetAllClassesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpGet("classes/{classId}")]
    [ProducesResponseType(typeof(ClassDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClassById(string classId, CancellationToken cancellationToken)
    {
        var response = await _admissionService.GetClassByIdAsync(classId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("classes/{classId}/holds")]
    [ProducesResponseType(typeof(HoldResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateHold(
        string classId,
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken cancellationToken)
    {
        StudentIdValidator.Validate(studentId);

        var response = await _admissionService.CreateHoldAsync(classId, studentId!, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }
}
