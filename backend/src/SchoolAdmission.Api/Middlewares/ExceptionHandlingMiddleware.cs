using System.Net;
using System.Text.Json;
using SchoolAdmission.Domain.Exceptions;

namespace SchoolAdmission.Api.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
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
