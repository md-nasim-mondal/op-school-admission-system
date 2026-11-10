using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Application.Validators;

namespace SchoolAdmission.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<CreateClassRequestValidator>();
        return services;
    }
}
