using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.IntegrationTests.Infrastructure;
using Xunit;

namespace SchoolAdmission.IntegrationTests.ApiTests;

[Collection("IntegrationTests")]
public class ClassApiTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ClassApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostClass_ShouldCreateClass_AndReturn201WithExactContract()
    {
        await _factory.ResetDatabaseAsync();

        var request = new CreateClassRequest("Class 6 - Morning Shift", 120);
        var response = await _client.PostAsJsonAsync("/classes", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var content = await response.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(content);
        Assert.False(string.IsNullOrWhiteSpace(content.Id));
        Assert.Equal("Class 6 - Morning Shift", content.Name);
        Assert.Equal(120, content.TotalSeats);
    }

    [Fact]
    public async Task GetClasses_ShouldReturnAllClasses_WithCalculatedSeatCounts()
    {
        await _factory.ResetDatabaseAsync();

        // Create 2 classes
        await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 6 - Morning", 50));
        await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 6 - Day", 60));

        var response = await _client.GetAsync("/classes");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var list = await response.Content.ReadFromJsonAsync<List<ClassDetailsResponse>>();
        Assert.NotNull(list);
        Assert.Equal(2, list.Count);

        var morning = list.First(c => c.Name == "Class 6 - Morning");
        Assert.Equal(50, morning.TotalSeats);
        Assert.Equal(0, morning.HeldSeats);
        Assert.Equal(0, morning.ConfirmedSeats);
        Assert.Equal(50, morning.AvailableSeats);
    }

    [Fact]
    public async Task GetClassById_ShouldReturnClassDetails_WhenExists()
    {
        await _factory.ResetDatabaseAsync();

        var createRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 7", 40));
        var created = await createRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(created);

        var response = await _client.GetAsync($"/classes/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var details = await response.Content.ReadFromJsonAsync<ClassDetailsResponse>();
        Assert.NotNull(details);
        Assert.Equal(created.Id, details.Id);
        Assert.Equal("Class 7", details.Name);
        Assert.Equal(40, details.TotalSeats);
        Assert.Equal(40, details.AvailableSeats);
    }

    [Fact]
    public async Task PostClass_ShouldReturn400_WhenInvalid()
    {
        var response = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("", 0));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetClassById_ShouldReturn404_WhenNotFound()
    {
        await _factory.ResetDatabaseAsync();
        var response = await _client.GetAsync("/classes/non-existent-id");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
