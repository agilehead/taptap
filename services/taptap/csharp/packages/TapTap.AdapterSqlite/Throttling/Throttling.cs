using TapTap.AdapterSqlite.Entities;
using Microsoft.EntityFrameworkCore;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.AdapterSqlite.Throttling;

public static class Throttling
{
    public static ThrottleStore Create(TapTapDbContext db, Clock clock) => new(
        (key, interval, ct) => Storage.Guard(async () =>
        {
            var id = key.Id;
            var row = await db.Throttle.AsNoTracking().FirstOrDefaultAsync(row => row.Id == id, ct);
            return row is not null && DateTimeOffset.TryParse(row.LastSentAt,
                System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.AssumeUniversal, out var time)
                && (clock.UtcNow() - time).TotalMilliseconds < interval;
        }),
        (key, ct) => Storage.Guard(async () =>
        {
            var id = key.Id;
            var now = clock.IsoNow();
            var changed = await db.Throttle.Where(row => row.Id == id).ExecuteUpdateAsync(
                setters => setters.SetProperty(row => row.LastSentAt, now), ct);
            if (changed == 0)
            {
                db.Throttle.Add(new ThrottleRow { Id = id, Channel = key.Channel, Category = key.Category,
                    RecipientId = key.RecipientId, ContextId = key.ContextId, LastSentAt = now });
                await Storage.Save(db, ct);
            }
            return new Unit();
        }));
}
