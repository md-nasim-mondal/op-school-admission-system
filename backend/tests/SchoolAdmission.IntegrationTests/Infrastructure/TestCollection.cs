using Xunit;

namespace SchoolAdmission.IntegrationTests.Infrastructure;

[CollectionDefinition("IntegrationTests", DisableParallelization = true)]
public class TestCollection : ICollectionFixture<CustomWebApplicationFactory>
{
}
