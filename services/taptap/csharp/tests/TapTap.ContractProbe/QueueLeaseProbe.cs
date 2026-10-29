using Microsoft.EntityFrameworkCore;
using TapTap.AdapterSqlite;
using TapTap.Domain.Notifications;
using TapTap.Domain.Queue;
using TapTap.Kernel;

public static class QueueLeaseProbe
{
    public static async Task Run(string path, Action<bool, string> check)
    {
        var now = DateTimeOffset.Parse("2026-10-29T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new Clock(() => now);
        var ct = CancellationToken.None;
        await using var first = Storage.Open(path);
        await using var second = Storage.Open(path);
        var a = TapTap.AdapterSqlite.Queue.Queue.Create(first, clock);
        var b = TapTap.AdapterSqlite.Queue.Queue.Create(second, clock);
        QueueInput Input(string id) => new(id, null, "u", "u@example.test", "User", "Subject", "html", "text", null, null);
        var item = (await a.Create(Input("lease-concurrent"), ct)).Value;
        var results = await Task.WhenAll(a.Claim(item, 3, ct), b.Claim(item, 3, ct));
        check(results.All(result => result.IsSuccess) && results.Count(result => result.Value is not null) == 1, "separate connections acquire exactly one owner");
        var owned = results.Single(result => result.Value is not null).Value!;
        check((await b.Pending(10, 3, ct)).Value.Count == 0, "active lease is excluded");
        check(!(await b.MarkSent(owned with { Owner = "wrong" }, ct)).IsSuccess, "wrong owner cannot complete");
        now += DeliveryLimits.LeaseLifetime;
        check(!(await a.MarkSent(owned, ct)).IsSuccess, "expired owner cannot complete");
        var expired = (await b.Pending(10, 3, ct)).Value.Single();
        check(expired.Attempts == 1, "interrupted attempt was counted before SMTP");
        var recovered = (await b.Claim(expired, 3, ct)).Value!;
        check(recovered.Owner != owned.Owner, "recovery replaces owner");
        check(!(await a.MarkFailed(owned, "late failure", 3, ct)).IsSuccess, "late worker cannot alter recovered claim");
        now += DeliveryLimits.LeaseLifetime;
        recovered = (await b.Claim((await b.Pending(10, 3, ct)).Value.Single(), 3, ct)).Value!;
        now += DeliveryLimits.LeaseLifetime;
        check((await a.Pending(10, 3, ct)).Value.Count == 0, "repeated interruptions stop at attempt limit");
        var stored = await first.EmailQueue.AsNoTracking().SingleAsync(row => row.Id == item.Id, ct);
        check(stored.Status == "failed" && stored.Attempts == 3 && stored.LeaseOwner is null, "exhausted abandoned claim is terminal");
        check(!(await b.MarkSent(recovered, ct)).IsSuccess, "old owner cannot revive terminal row");

        await a.Create(Input("lease-cancel"), ct);
        using var cancel = new CancellationTokenSource();
        try
        {
            await QueueProcessor.Run(a, new EmailProvider("cancel", (_, _) =>
            { cancel.Cancel(); throw new OperationCanceledException(cancel.Token); }), new(10, 3, "from@example.test", "From"), cancel.Token);
            check(false, "cancellation must propagate");
        }
        catch (OperationCanceledException) { check(true, "cancellation propagates with durable ownership"); }
        check((await b.Pending(10, 3, ct)).Value.Count == 0, "cancelled send remains owned until expiry");
        now += DeliveryLimits.LeaseLifetime;
        var accepted = 0;
        var provider = new EmailProvider("accepted", (_, _) => { accepted++; return Task.FromResult(Result<string>.Success("smtp-accepted")); });
        var unavailable = b with { MarkSent = (_, _) => Task.FromResult(Result<Unit>.Failed("DATABASE_ERROR", "fixture completion outage")) };
        var incomplete = await QueueProcessor.Run(unavailable, provider, new(10, 3, "from@example.test", "From"), ct);
        check(!incomplete.Outcome.IsSuccess && accepted == 1, "acknowledged send reports completion failure");
        check((await a.Pending(10, 3, ct)).Value.Count == 0, "completion failure does not immediately release claim");
        now += DeliveryLimits.LeaseLifetime;
        var retried = await QueueProcessor.Run(a, provider, new(10, 3, "from@example.test", "From"), ct);
        check(retried.Sent == 1 && accepted == 2, "ambiguous interrupted completion recovers within attempt limit");
        now += DeliveryLimits.LeaseLifetime;
        check((await b.Pending(10, 3, ct)).Value.Count == 0, "sent and failed rows stay terminal across recovery scans");
    }
}
