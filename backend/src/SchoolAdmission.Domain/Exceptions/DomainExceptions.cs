namespace SchoolAdmission.Domain.Exceptions;

public abstract class BaseDomainException : Exception
{
    protected BaseDomainException(string message) : base(message) { }
}

public class NotFoundException : BaseDomainException
{
    public NotFoundException(string message) : base(message) { }
}

public class ConflictException : BaseDomainException
{
    public ConflictException(string message) : base(message) { }
}

public class ForbiddenException : BaseDomainException
{
    public ForbiddenException(string message) : base(message) { }
}

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
