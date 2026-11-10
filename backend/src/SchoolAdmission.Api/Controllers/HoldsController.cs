using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Application.Validators;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
public class HoldsController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public HoldsController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpGet("holds/{holdId}")]
    [ProducesResponseType(typeof(HoldStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHoldById(string holdId, CancellationToken cancellationToken)
    {
        var response = await _admissionService.GetHoldByIdAsync(holdId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("holds/{holdId}/confirm")]
    [ProducesResponseType(typeof(ConfirmHoldResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ConfirmHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken cancellationToken)
    {
        StudentIdValidator.Validate(studentId);

        var response = await _admissionService.ConfirmHoldAsync(holdId, studentId!, cancellationToken);
        return Ok(response);
    }

    [HttpDelete("holds/{holdId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelHold(
        string holdId,
        [FromHeader(Name = "X-Student-Id")] string? studentId,
        CancellationToken cancellationToken)
    {
        StudentIdValidator.Validate(studentId);

        await _admissionService.CancelHoldAsync(holdId, studentId!, cancellationToken);
        return NoContent();
    }
}
