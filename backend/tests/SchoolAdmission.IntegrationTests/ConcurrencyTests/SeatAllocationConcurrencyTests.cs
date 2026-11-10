using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Data;
using SchoolAdmission.IntegrationTests.Infrastructure;
using Xunit;

namespace SchoolAdmission.IntegrationTests.ConcurrencyTests;

[Collection("IntegrationTests")]
public class SeatAllocationConcurrencyTests
{
    private readonly CustomWebApplicationFactory _factory;

    public SeatAllocationConcurrencyTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ConcurrentHoldRequests_ShouldNeverOverAllocateSeats()
    {
        await _factory.ResetDatabaseAsync();

        // Arrange
        const int totalSeats = 10;
        const int totalApplicants = 100;

        var setupClient = _factory.CreateClient();
        var classRes = await setupClient.PostAsJsonAsync("/classes", 
            new CreateClassRequest("Class 6 - Morning Shift (High Demand)", totalSeats));
        
        Assert.Equal(HttpStatusCode.Created, classRes.StatusCode);
        var createdClass = await classRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(createdClass);

        var classId = createdClass.Id;
        var responses = new ConcurrentBag<(HttpStatusCode StatusCode, string Body)>();

        // Generate 100 unique 17-digit student IDs
        var studentIds = Enumerable.Range(1, totalApplicants)
            .Select(i => (10000000000000000L + i).ToString())
            .ToList();

        // Non-blocking async trigger to release all requests simultaneously
        var trigger = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);

        var tasks = studentIds.Select(async studentId =>
        {
            var client = _factory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            request.Headers.Add("X-Student-Id", studentId);

            // Wait for release trigger
            await trigger.Task;

            var response = await client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            responses.Add((response.StatusCode, body));
        }).ToList();

        // Release all requests at once
        trigger.SetResult(true);

        await Task.WhenAll(tasks);

        // Assert HTTP responses
        var successfulHolds = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictHolds = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(totalSeats, successfulHolds);
        Assert.Equal(totalApplicants - totalSeats, conflictHolds);

        // Assert database final state directly
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var dbClass = await db.Classes.FindAsync(classId);
        Assert.NotNull(dbClass);

        var now = DateTime.UtcNow;
        var activeHeldInDb = await db.Holds.CountAsync(h => 
            h.ClassId == classId && h.Status == HoldStatus.HELD && h.ExpiresAtUtc > now);
        var confirmedInDb = await db.Holds.CountAsync(h => 
            h.ClassId == classId && h.Status == HoldStatus.CONFIRMED);

        Assert.Equal(totalSeats, activeHeldInDb);
        Assert.Equal(0, confirmedInDb);

        // INVARIANT MUST HOLD: heldSeats + confirmedSeats <= totalSeats
        Assert.True(activeHeldInDb + confirmedInDb <= totalSeats, 
            $"CRITICAL INVARIANT VIOLATED! Total holds {activeHeldInDb} exceeded seat capacity {totalSeats}");

        // Assert API seat calculation
        var classStatus = await setupClient.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{classId}");
        Assert.NotNull(classStatus);
        Assert.Equal(totalSeats, classStatus.HeldSeats);
        Assert.Equal(0, classStatus.ConfirmedSeats);
        Assert.Equal(0, classStatus.AvailableSeats);
    }

    [Fact]
    public async Task TwoConcurrentClients_RacingForLastSeat_ExactlyOneWins()
    {
        await _factory.ResetDatabaseAsync();

        // 1. Class with only 1 total seat
        var client = _factory.CreateClient();
        var classRes = await client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 10 - Limited", 1));
        var admissionClass = await classRes.Content.ReadFromJsonAsync<ClassCreatedResponse>();
        Assert.NotNull(admissionClass);

        var classId = admissionClass.Id;
        var studentA = "20152690000000001";
        var studentB = "20152690000000002";

        var trigger = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        HttpStatusCode? codeA = null;
        HttpStatusCode? codeB = null;

        var taskA = Task.Run(async () =>
        {
            var clientA = _factory.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            req.Headers.Add("X-Student-Id", studentA);
            await trigger.Task;
            var res = await clientA.SendAsync(req);
            codeA = res.StatusCode;
        });

        var taskB = Task.Run(async () =>
        {
            var clientB = _factory.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            req.Headers.Add("X-Student-Id", studentB);
            await trigger.Task;
            var res = await clientB.SendAsync(req);
            codeB = res.StatusCode;
        });

        trigger.SetResult(true);
        await Task.WhenAll(taskA, taskB);

        // Exactly one client must get 201 Created and the other must get 409 Conflict
        var codes = new[] { codeA, codeB };
        Assert.Contains(HttpStatusCode.Created, codes);
        Assert.Contains(HttpStatusCode.Conflict, codes);

        // Verify available seats = 0
        var classCheck = await client.GetFromJsonAsync<ClassDetailsResponse>($"/classes/{classId}");
        Assert.NotNull(classCheck);
        Assert.Equal(1, classCheck.HeldSeats);
        Assert.Equal(0, classCheck.AvailableSeats);
    }
}
