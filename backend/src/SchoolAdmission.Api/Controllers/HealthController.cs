using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    public HealthController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("health")]
    public async Task<IActionResult> CheckHealth(CancellationToken cancellationToken)
    {
        try
        {
            await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
            return Ok(new
            {
                status = "Healthy",
                database = "Connected",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "Unhealthy",
                database = "Disconnected",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
