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
        (limit, ct) => Storage.Guard<IReadOnlyList<QueueItem>>(async () => (await db.EmailQueue.AsNoTracking()
            .Where(row => row.Status == "pending").OrderBy(row => row.CreatedAt).Take(limit).ToArrayAsync(ct)).Select(Map).ToArray()),
        (id, ct) => Storage.Guard(async () =>
        {
            await db.EmailQueue.Where(row => row.Id == id).ExecuteUpdateAsync(setters => setters.SetProperty(row => row.Status, "sending"), ct);
            return new Unit();
        }),
        (id, ct) => Storage.Guard(async () =>
        {
            var now = clock.IsoNow();
            await db.EmailQueue.Where(row => row.Id == id).ExecuteUpdateAsync(setters => setters
                .SetProperty(row => row.Status, "sent").SetProperty(row => row.SentAt, now), ct);
            return new Unit();
        }),
        (id, error, max, ct) => Storage.Guard(async () =>
        {
            await db.EmailQueue.Where(row => row.Id == id).ExecuteUpdateAsync(setters => setters
                .SetProperty(row => row.Attempts, row => row.Attempts + 1)
                .SetProperty(row => row.Status, row => row.Attempts + 1 >= max ? "failed" : "pending")
                .SetProperty(row => row.LastError, error), ct);
            return new Unit();
        }));

    public static QueueItem Map(EmailQueueRow row) => new(row.Id, row.TemplateName, row.Status,
        row.RecipientId, row.RecipientEmail, row.RecipientName, row.Subject, row.BodyHtml, row.BodyText,
        row.Category, row.Metadata, row.Attempts, row.LastError, row.CreatedAt, row.SentAt);
}
