using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.IntegrationTests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly object SyncLock = new();
    private static bool _initialized = false;

    public static readonly string DefaultTestConnectionString = 
        Environment.GetEnvironmentVariable("TEST_DATABASE_URL")
        ?? "Host=localhost;Port=5434;Database=school_admission_test_db;Username=postgres;Password=postgres;Maximum Pool Size=50;Include Error Detail=true;";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            var inMemorySettings = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = DefaultTestConnectionString,
                ["HOLD_DURATION_SECONDS"] = "600"
            };
            config.AddInMemoryCollection(inMemorySettings);
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing ApplicationDbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Register PostgreSQL with test connection string
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(DefaultTestConnectionString);
            });
        });
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        lock (SyncLock)
        {
            if (!_initialized)
            {
                db.Database.Migrate();
                _initialized = true;
            }
        }

        await db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Holds\", \"Classes\" RESTART IDENTITY CASCADE;");
    }
}
