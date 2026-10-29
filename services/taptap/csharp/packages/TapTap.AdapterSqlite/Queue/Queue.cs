using TapTap.AdapterSqlite.Entities;
using Microsoft.EntityFrameworkCore;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.AdapterSqlite.Queue;

public static class Queue
{
    public static QueueStore Create(TapTapDbContext db, Clock clock) => new(
        (input, ct) => Storage.Guard(async () =>
        {
            var row = new EmailQueueRow { Id = input.Id, TemplateName = input.TemplateName,
                Status = "pending", RecipientId = input.RecipientId, RecipientEmail = input.RecipientEmail,
                RecipientName = input.RecipientName, Subject = input.Subject, BodyHtml = input.BodyHtml,
                BodyText = input.BodyText, Category = input.Category, Metadata = input.Metadata, CreatedAt = clock.IsoNow() };
            db.EmailQueue.Add(row);
            await Storage.Save(db, ct);
            return Map(row);
        }),
        (limit, max, ct) => Storage.Guard<IReadOnlyList<QueueItem>>(async () =>
        {
            var now = clock.UtcNow().ToUnixTimeMilliseconds();
            await db.EmailQueue.Where(row => row.Attempts >= max && (row.Status == "pending"
                || row.Status == "sending" && row.LeaseUntil <= now)).ExecuteUpdateAsync(setters => setters
                    .SetProperty(row => row.Status, "failed").SetProperty(row => row.LeaseOwner, (string?)null)
                    .SetProperty(row => row.LeaseUntil, (long?)null)
                    .SetProperty(row => row.LastError, "Delivery attempt limit reached; interrupted acceptance may be unknown"), ct);
            return (await db.EmailQueue.AsNoTracking().Where(row => row.Attempts < max && (row.Status == "pending"
                || row.Status == "sending" && row.LeaseUntil <= now))
                .OrderBy(row => row.CreatedAt).ThenBy(row => row.Id).Take(limit).ToArrayAsync(ct)).Select(Map).ToArray();
        }),
        (item, max, ct) => Storage.Guard<QueueClaim?>(async () =>
        {
            var now = clock.UtcNow().ToUnixTimeMilliseconds();
            var until = now + (long)DeliveryLimits.LeaseLifetime.TotalMilliseconds;
            var owner = Guid.NewGuid().ToString("N");
            var changed = await db.EmailQueue.Where(row => row.Id == item.Id && row.Attempts == item.Attempts
                && row.Attempts < max && (row.Status == "pending" || row.Status == "sending" && row.LeaseUntil <= now))
                .ExecuteUpdateAsync(setters => setters.SetProperty(row => row.Status, "sending")
                    .SetProperty(row => row.Attempts, row => row.Attempts + 1)
                    .SetProperty(row => row.LeaseOwner, owner).SetProperty(row => row.LeaseUntil, until), ct);
            return changed == 1 ? new QueueClaim(item, owner) : null;
        }),
        (claim, ct) => Complete(db, clock, claim, null, 0, ct),
        (claim, error, max, ct) => Complete(db, clock, claim, error, max, ct));

    private static async Task<Result<Unit>> Complete(TapTapDbContext db, Clock clock, QueueClaim claim,
        string? error, int max, CancellationToken ct)
    {
        var result = await Storage.Guard(async () =>
        {
            var now = clock.UtcNow().ToUnixTimeMilliseconds();
            var timestamp = clock.IsoNow();
            return await db.EmailQueue.Where(row => row.Id == claim.Item.Id && row.Status == "sending"
                && row.LeaseOwner == claim.Owner && row.LeaseUntil > now).ExecuteUpdateAsync(setters => setters
                    .SetProperty(row => row.Status, row => error == null ? "sent" : row.Attempts >= max ? "failed" : "pending")
                    .SetProperty(row => row.SentAt, row => error == null ? timestamp : row.SentAt)
                    .SetProperty(row => row.LastError, row => error ?? row.LastError)
                    .SetProperty(row => row.LeaseOwner, (string?)null).SetProperty(row => row.LeaseUntil, (long?)null), ct);
        });
        return !result.IsSuccess ? Result<Unit>.Failed(result.Error!) : result.Value == 1
            ? Result<Unit>.Success(new Unit()) : Result<Unit>.Failed("CLAIM_LOST", "Delivery claim is no longer owned");
    }

    public static QueueItem Map(EmailQueueRow row) => new(row.Id, row.TemplateName, row.Status,
        row.RecipientId, row.RecipientEmail, row.RecipientName, row.Subject, row.BodyHtml, row.BodyText,
        row.Category, row.Metadata, row.Attempts, row.LastError, row.CreatedAt, row.SentAt);
}
