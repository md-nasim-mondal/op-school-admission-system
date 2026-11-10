using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Application.Common;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Infrastructure.BackgroundServices;
using SchoolAdmission.Infrastructure.Data;
using SchoolAdmission.Infrastructure.Services;

namespace SchoolAdmission.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? configuration["DATABASE_URL"]
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=school_admission_db;Username=postgres;Password=postgres";

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        // Admission Settings
        services.Configure<AdmissionSettings>(options =>
        {
            if (int.TryParse(configuration["HOLD_DURATION_SECONDS"] ?? Environment.GetEnvironmentVariable("HOLD_DURATION_SECONDS"), out var seconds) && seconds > 0)
            {
                options.HoldDurationSeconds = seconds;
            }
            else
            {
                options.HoldDurationSeconds = 600;
            }
        });

        services.AddScoped<IAdmissionService, AdmissionService>();
        services.AddHostedService<HoldExpirationBackgroundService>();

        return services;
    }
}
