using TapTap.AdapterSqlite.Entities;
using Microsoft.EntityFrameworkCore;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.AdapterSqlite.Templates;

public static class Templates
{
    public static TemplateStore Create(TapTapDbContext db, Clock clock) => new(
        (name, ct) => Storage.Guard(async () => Optional(await db.EmailTemplate.AsNoTracking().FirstOrDefaultAsync(row => row.Name == name, ct))),
        ct => Storage.Guard<IReadOnlyList<EmailTemplate>>(async () =>
            (await db.EmailTemplate.AsNoTracking().OrderBy(row => row.Name).ToArrayAsync(ct)).Select(Map).ToArray()),
        (input, ct) => Storage.Guard(async () =>
        {
            var row = new EmailTemplateRow { Name = input.Name, Subject = input.Subject,
                BodyHtml = input.BodyHtml, BodyText = input.BodyText, CreatedAt = clock.IsoNow(), UpdatedAt = clock.IsoNow() };
            db.EmailTemplate.Add(row);
            await Storage.Save(db, ct);
            return Map(row);
        }),
        (name, input, ct) => Storage.Guard(async () =>
        {
            var now = clock.IsoNow();
            var subject = input.Subject; var html = input.BodyHtml; var text = input.BodyText;
            await db.EmailTemplate.Where(row => row.Name == name).ExecuteUpdateAsync(setters => setters
                .SetProperty(row => row.Subject, row => subject ?? row.Subject)
                .SetProperty(row => row.BodyHtml, row => html ?? row.BodyHtml)
                .SetProperty(row => row.BodyText, row => text ?? row.BodyText)
                .SetProperty(row => row.UpdatedAt, now), ct);
            return Optional(await db.EmailTemplate.AsNoTracking().FirstOrDefaultAsync(row => row.Name == name, ct));
        }),
        (name, ct) => Storage.Guard(async () => await db.EmailTemplate.Where(row => row.Name == name).ExecuteDeleteAsync(ct) > 0));

    public static EmailTemplate Map(EmailTemplateRow row) => new(row.Name, row.Subject, row.BodyHtml,
        row.BodyText, row.CreatedAt, row.UpdatedAt);
    private static EmailTemplate? Optional(EmailTemplateRow? row) => row is null ? null : Map(row);
}
