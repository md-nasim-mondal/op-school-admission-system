using System.Text.RegularExpressions;
using FluentValidation;
using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Validators;

public class CreateClassRequestValidator : AbstractValidator<CreateClassRequest>
{
    public CreateClassRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Class name is required.")
            .MaximumLength(200).WithMessage("Class name must not exceed 200 characters.");

        RuleFor(x => x.TotalSeats)
            .GreaterThan(0).WithMessage("Total seats must be greater than zero.");
    }
}

public static class StudentIdValidator
{
    private static readonly Regex BirthRegistrationRegex = new(@"^\d{17}$", RegexOptions.Compiled);

    public static bool IsValid(string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
            return false;

        return BirthRegistrationRegex.IsMatch(studentId.Trim());
    }

    public static void Validate(string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            throw new Domain.Exceptions.ValidationException("Missing required X-Student-Id header.");
        }

        var trimmed = studentId.Trim();
        if (!BirthRegistrationRegex.IsMatch(trimmed))
        {
            throw new Domain.Exceptions.ValidationException(
                "X-Student-Id must be a valid 17-digit Birth Registration Number.");
        }
    }
}
