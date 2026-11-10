using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Validators;
using SchoolAdmission.Domain.Exceptions;
using Xunit;

namespace SchoolAdmission.UnitTests.ValidationTests;

public class ValidatorTests
{
    [Theory]
    [InlineData("20152691234567890", true)]
    [InlineData("00000000000000001", true)] // preserves leading zeros
    [InlineData("1234567890123456", false)] // 16 digits
    [InlineData("123456789012345678", false)] // 18 digits
    [InlineData("2015269123456789a", false)] // non-digit character
    [InlineData("", false)]
    [InlineData(null, false)]
    public void StudentIdValidator_IsValid_ShouldValidateCorrectly(string? studentId, bool expectedValid)
    {
        var isValid = StudentIdValidator.IsValid(studentId);
        Assert.Equal(expectedValid, isValid);
    }

    [Fact]
    public void StudentIdValidator_Validate_ShouldThrowValidationException_WhenInvalid()
    {
        Assert.Throws<ValidationException>(() => StudentIdValidator.Validate("invalid-id"));
        Assert.Throws<ValidationException>(() => StudentIdValidator.Validate(null));
    }

    [Fact]
    public async Task CreateClassRequestValidator_ShouldFail_WhenNameIsEmptyOrSeatsZero()
    {
        var validator = new CreateClassRequestValidator();

        var invalidRequest = new CreateClassRequest("", 0);
        var result = await validator.ValidateAsync(invalidRequest);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Name");
        Assert.Contains(result.Errors, e => e.PropertyName == "TotalSeats");
    }

    [Fact]
    public async Task CreateClassRequestValidator_ShouldPass_WhenValid()
    {
        var validator = new CreateClassRequestValidator();

        var validRequest = new CreateClassRequest("Class 6 - Morning Shift", 120);
        var result = await validator.ValidateAsync(validRequest);

        Assert.True(result.IsValid);
    }
}
