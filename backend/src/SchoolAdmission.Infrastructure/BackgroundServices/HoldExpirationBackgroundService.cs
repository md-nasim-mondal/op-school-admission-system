using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Infrastructure.BackgroundServices;

public class HoldExpirationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HoldExpirationBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(5);

    public HoldExpirationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<HoldExpirationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HoldExpirationBackgroundService is starting with check interval {Interval}", _checkInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var admissionService = scope.ServiceProvider.GetRequiredService<IAdmissionService>();
                await admissionService.ProcessExpiredHoldsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing expired holds in background service.");
            }

            try
            {
                await Task.Delay(_checkInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("HoldExpirationBackgroundService has stopped.");
    }
}
