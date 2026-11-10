using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using SchoolAdmission.Domain.Exceptions;

namespace SchoolAdmission.Api.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next, 
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message, errors) = exception switch
        {
            ValidationException vex => (
                (int)HttpStatusCode.BadRequest, 
                vex.Message, 
                vex.Errors.Count > 0 ? (object)vex.Errors : null),

            NotFoundException nfe => (
                (int)HttpStatusCode.NotFound, 
                nfe.Message, 
                null),

            ConflictException ce => (
                (int)HttpStatusCode.Conflict, 
                ce.Message, 
                null),

            ForbiddenException fe => (
                (int)HttpStatusCode.Forbidden, 
                fe.Message, 
                null),

            BadHttpRequestException bhe => (
                (int)HttpStatusCode.BadRequest, 
                bhe.Message, 
                null),

            _ => (
                (int)HttpStatusCode.InternalServerError, 
                "An unexpected internal error occurred.", 
                null)
        };

        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled server error processing request {Path}", context.Request.Path);
        }
        else
        {
            _logger.LogWarning("Handled domain exception {StatusCode} for request {Path}: {Message}", 
                statusCode, context.Request.Path, exception.Message);
        }

        context.Response.StatusCode = statusCode;

        var response = new
        {
            status = statusCode,
            message,
            errors,
            details = _environment.IsDevelopment() && statusCode >= 500 ? exception.ToString() : null,
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        });

        await context.Response.WriteAsync(json);
    }
}
