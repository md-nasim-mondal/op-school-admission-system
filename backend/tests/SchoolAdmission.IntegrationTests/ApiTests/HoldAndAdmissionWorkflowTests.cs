using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Data;
using SchoolAdmission.IntegrationTests.Infrastructure;
using Xunit;

namespace SchoolAdmission.IntegrationTests.ApiTests;

[Collection("IntegrationTests")]
public class HoldAndAdmissionWorkflowTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    private const string Student1 = "20152691234567890";
    private const string Student2 = "20152699999999999";

    public HoldAndAdmissionWorkflowTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CompleteAdmissionWorkflow_ShouldSucceed()
    {
        await _factory.ResetDatabaseAsync();

        // 1. Admin creates class with 2 seats
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 6 - Morning Shift", 2));
        Assert.Equal(HttpStatusCode.Created, classRes.StatusCode);
        var admissionClass = await classRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(admissionClass);

        // 2. Student 1 holds a seat
        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{admissionClass.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", Student1);
        var holdRes = await _client.SendAsync(holdReq);

        Assert.Equal(HttpStatusCode.Created, holdRes.StatusCode);
        var hold = await holdRes.Content.ReadFromJsonAsync<HoldResponse>();
        Assert.NotNull(hold);
        Assert.Equal(admissionClass.Id, hold.ClassId);
        Assert.Equal(Student1, hold.StudentId);
        Assert.Equal("HELD", hold.Status);
        Assert.True(hold.ExpiresAt > DateTime.UtcNow);

        // 3. Class seat check: 1 held, 0 confirmed, 1 available
        var classCheck = await _client.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{admissionClass.Id}");
        Assert.NotNull(classCheck);
        Assert.Equal(1, classCheck.HeldSeats);
        Assert.Equal(0, classCheck.ConfirmedSeats);
        Assert.Equal(1, classCheck.AvailableSeats);

        // 4. Student 1 queries hold details
        var getHoldRes = await _client.GetFromJsonAsync<HoldStatusResponse>($"/holds/{hold.HoldId}");
        Assert.NotNull(getHoldRes);
        Assert.Equal("HELD", getHoldRes.Status);
        Assert.Equal(admissionClass.Id, getHoldRes.ClassId);

        // 5. Student 1 queries /me/holds
        using var myHoldsReq = new HttpRequestMessage(HttpMethod.Get, "/me/holds");
        myHoldsReq.Headers.Add("X-Student-Id", Student1);
        var myHoldsRes = await _client.SendAsync(myHoldsReq);
        Assert.Equal(HttpStatusCode.OK, myHoldsRes.StatusCode);
        var myHolds = await myHoldsRes.Content.ReadFromJsonAsync<List<StudentHoldResponse>>();
        Assert.NotNull(myHolds);
        Assert.Single(myHolds);
        Assert.Equal(hold.HoldId, myHolds[0].HoldId);
        Assert.Equal("Class 6 - Morning Shift", myHolds[0].ClassName);
        Assert.Equal("HELD", myHolds[0].Status);

        // 6. Student 1 confirms admission (pays admission fee)
        using var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", Student1);
        var confirmRes = await _client.SendAsync(confirmReq);
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);
        var confirmData = await confirmRes.Content.ReadFromJsonAsync<ConfirmHoldResponse>();
        Assert.NotNull(confirmData);
        Assert.Equal(hold.HoldId, confirmData.HoldId);
        Assert.Equal("CONFIRMED", confirmData.Status);

        // 7. Verify seat counts: 0 held, 1 confirmed, 1 available
        classCheck = await _client.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{admissionClass.Id}");
        Assert.NotNull(classCheck);
        Assert.Equal(0, classCheck.HeldSeats);
        Assert.Equal(1, classCheck.ConfirmedSeats);
        Assert.Equal(1, classCheck.AvailableSeats);

        // 8. Idempotent confirmation test: Calling confirm again succeeds without duplicate counting
        using var duplicateConfirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        duplicateConfirmReq.Headers.Add("X-Student-Id", Student1);
        var dupConfirmRes = await _client.SendAsync(duplicateConfirmReq);
        Assert.Equal(HttpStatusCode.OK, dupConfirmRes.StatusCode);

        classCheck = await _client.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{admissionClass.Id}");
        Assert.NotNull(classCheck);
        Assert.Equal(0, classCheck.HeldSeats);
        Assert.Equal(1, classCheck.ConfirmedSeats); // Still 1!
        Assert.Equal(1, classCheck.AvailableSeats);
    }

    [Fact]
    public async Task CreateHold_ShouldReturn409_WhenStudentAlreadyHasActiveHold()
    {
        await _factory.ResetDatabaseAsync();

        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 1", 10));
        var admissionClass = await classRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(admissionClass);

        // Hold 1
        using var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{admissionClass.Id}/holds");
        req1.Headers.Add("X-Student-Id", Student1);
        var res1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // Hold 2 with same student
        using var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{admissionClass.Id}/holds");
        req2.Headers.Add("X-Student-Id", Student1);
        var res2 = await _client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.Conflict, res2.StatusCode);
    }

    [Fact]
    public async Task ConfirmHold_ShouldReturn403_WhenStudentIdDoesNotMatch()
    {
        await _factory.ResetDatabaseAsync();

        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 1", 10));
        var admissionClass = await classRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(admissionClass);

        // Hold created by Student 1
        using var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{admissionClass.Id}/holds");
        req1.Headers.Add("X-Student-Id", Student1);
        var res1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);
        var hold = await res1.Content.ReadFromJsonAsync<HoldResponse>();
        Assert.NotNull(hold);

        // Student 2 tries to confirm Student 1's hold
        using var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", Student2);
        var confirmRes = await _client.SendAsync(confirmReq);

        Assert.Equal(HttpStatusCode.Forbidden, confirmRes.StatusCode);
    }

    [Fact]
    public async Task CancelHold_ShouldReleaseSeat_AndReturn204()
    {
        await _factory.ResetDatabaseAsync();

        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 1", 1));
        var admissionClass = await classRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(admissionClass);

        // Student 1 takes the 1 available seat
        using var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{admissionClass.Id}/holds");
        req1.Headers.Add("X-Student-Id", Student1);
        var res1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);
        var hold = await res1.Content.ReadFromJsonAsync<HoldResponse>();
        Assert.NotNull(hold);

        // Verify available seats = 0
        var classCheck = await _client.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{admissionClass.Id}");
        Assert.NotNull(classCheck);
        Assert.Equal(0, classCheck.AvailableSeats);

        // Student 1 cancels the hold
        using var cancelReq = new HttpRequestMessage(HttpMethod.Delete, $"/holds/{hold.HoldId}");
        cancelReq.Headers.Add("X-Student-Id", Student1);
        var cancelRes = await _client.SendAsync(cancelReq);
        Assert.Equal(HttpStatusCode.NoContent, cancelRes.StatusCode);

        // Seat is now released! Available seats = 1
        classCheck = await _client.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{admissionClass.Id}");
        Assert.NotNull(classCheck);
        Assert.Equal(1, classCheck.AvailableSeats);
        Assert.Equal(0, classCheck.HeldSeats);

        // Student 2 can now hold the seat
        using var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{admissionClass.Id}/holds");
        req2.Headers.Add("X-Student-Id", Student2);
        var res2 = await _client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.Created, res2.StatusCode);
    }

    [Fact]
    public async Task ExpiredHold_ShouldAutomaticallyReleaseSeat()
    {
        await _factory.ResetDatabaseAsync();

        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 1", 1));
        var admissionClass = await classRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(admissionClass);

        // Directly insert an expired hold into the DB
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var expiredHold = new AdmissionHold
            {
                Id = "h_expired",
                ClassId = admissionClass.Id,
                StudentId = Student1,
                Status = HoldStatus.HELD,
                CreatedAtUtc = DateTime.UtcNow.AddMinutes(-20),
                ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-10) // expired 10 minutes ago
            };
            db.Holds.Add(expiredHold);
            await db.SaveChangesAsync();
        }

        // When Student 2 requests a hold, the expired hold does not block them!
        using var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{admissionClass.Id}/holds");
        req2.Headers.Add("X-Student-Id", Student2);
        var res2 = await _client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.Created, res2.StatusCode);

        // Class has 1 held seat (by Student 2) and 0 available
        var classCheck = await _client.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{admissionClass.Id}");
        Assert.NotNull(classCheck);
        Assert.Equal(1, classCheck.HeldSeats);
        Assert.Equal(0, classCheck.AvailableSeats);
    }
}
