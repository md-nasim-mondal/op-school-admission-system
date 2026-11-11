namespace SchoolAdmission.Domain.Exceptions;

public abstract class BaseDomainException(string message) : Exception(message);

public class NotFoundException(string message) : BaseDomainException(message);

public class ConflictException(string message) : BaseDomainException(message);

public class ForbiddenException(string message) : BaseDomainException(message);

public class ValidationException : BaseDomainException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(string message) : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IDictionary<string, string[]> errors) 
        : base("One or more validation failures have occurred.")
    {
        Errors = errors;
    }
}
