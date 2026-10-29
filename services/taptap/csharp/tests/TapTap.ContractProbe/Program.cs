using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TapTap.AdapterSqlite;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

if (args.Length > 0 && args[0] == "smtp") return await SmtpProbe.Run(args[1..]);

if (args.Length != 1 || !Path.GetFullPath(args[0]).Split(Path.DirectorySeparatorChar).Contains(".tests"))
    throw new ArgumentException("Provide a disposable Knex-migrated database under .tests.");
var assertions = 0;
void Check(bool value, string label)
{
    assertions++;
    if (!value) throw new InvalidOperationException("Failed: " + label);
}
var clock = new Clock(() => new DateTimeOffset(2026, 10, 25, 12, 0, 0, TimeSpan.Zero));
await using var db = Storage.Open(Path.GetFullPath(args[0]));
var templates = TapTap.AdapterSqlite.Templates.Templates.Create(db, clock);
var queue = TapTap.AdapterSqlite.Queue.Queue.Create(db, clock);
var throttles = TapTap.AdapterSqlite.Throttling.Throttling.Create(db, clock);
var ct = CancellationToken.None;
using var variables = JsonDocument.Parse("{\"name\":\"Alice\",\"app\":\"TapTap\",\"price\":\"$10.00 (USD)\"}");
using var emptyVariables = JsonDocument.Parse("{}");
Check(TemplateRendering.Render("Hello {{name}}, welcome to {{app}}!", variables.RootElement) == "Hello Alice, welcome to TapTap!", "template substitutions");
Check(TemplateRendering.Render("Hello {{name}}, order {{missing}}", variables.RootElement) == "Hello Alice, order ", "missing template variable");
Check(TemplateRendering.Render("Hello {{name}}!", emptyVariables.RootElement) == "Hello !", "empty template variables");
Check(TemplateRendering.Render("Hello world!", variables.RootElement) == "Hello world!", "template without placeholders");
Check(TemplateRendering.Render("", variables.RootElement) == "", "empty template");
Check(TemplateRendering.Render("{{name}} said hello to {{name}}", variables.RootElement) == "Alice said hello to Alice", "repeated placeholders");
Check(TemplateRendering.Render("Hello {name} and {{name}}", variables.RootElement) == "Hello {name} and Alice", "malformed placeholder remains literal");
Check(TemplateRendering.Render("Price: {{price}}", variables.RootElement) == "Price: $10.00 (USD)", "special characters in values");
var created = await templates.Create(new TemplateInput("probe-template", "Subject 東京", "<p>{{name}}</p>", "Hello"), ct);
Check(created.IsSuccess && created.Value.CreatedAt == "2026-10-25T12:00:00.000Z", "template timestamp representation");
Check(!(await templates.Create(new TemplateInput("probe-template", "duplicate", "html", "text"), ct)).IsSuccess, "unique constraint failure returns Result");
Check(db.ChangeTracker.Entries().Count() == 0, "failed write detaches all persistence rows");
Check((await templates.Create(new TemplateInput("after-failure", "success", "html", "text"), ct)).IsSuccess, "successful write after unique failure");
Check((await templates.Delete("after-failure", ct)).Value, "cleanup after failed-write regression");
var patched = await templates.Update("probe-template", new TemplateUpdate("", null, ""), ct);
Check(patched.IsSuccess && patched.Value is { Subject: "", BodyHtml: "<p>{{name}}</p>", BodyText: "" }, "empty updates and null patch retention");
var rawTemplate = await db.EmailTemplate.AsNoTracking().FirstAsync(row => row.Name == "probe-template", ct);
Check(rawTemplate.BodyHtml == "<p>{{name}}</p>" && rawTemplate.UpdatedAt == clock.IsoNow(), "stored template values");
Check((await templates.Find("missing-template", ct)).Value is null, "missing template");
Check(!(await templates.Delete("missing-template", ct)).Value, "delete missing template");
Check((await templates.List(ct)).Value.Any(value => value.Name == "probe-template"), "template list");
var first = await queue.Create(new QueueInput("probe-first", "probe-template", "user1", "user@example.test", "Name 東京",
    "Subject", "<p>html</p>", "text", "category", "{\"extra\":1}"), ct);
Check(first.IsSuccess && first.Value is { Status: "pending", Attempts: 0, LastError: null, SentAt: null }, "queue initial state");
var stored = await db.EmailQueue.AsNoTracking().FirstAsync(row => row.Id == "probe-first", ct);
Check(stored.Metadata == "{\"extra\":1}" && stored.RecipientName == "Name 東京" && stored.TemplateName == "probe-template", "queue byte representations");
Check((await queue.Pending(1, 3, ct)).Value.Count == 1, "queue limit");
var claim = (await queue.Claim(first.Value, 3, ct)).Value!;
Check(claim is not null, "atomic claim");
Check((await queue.Claim(first.Value, 3, ct)).Value is null, "another worker cannot claim sending item");
Check(!(await queue.Pending(10, 3, ct)).Value.Any(value => value.Id == "probe-first"), "sending excluded from pending");
await queue.MarkFailed(claim!, "first failure", 3, ct);
var retry = (await queue.Pending(10, 3, ct)).Value.Single(value => value.Id == "probe-first");
Check(retry is { Attempts: 1, LastError: "first failure", Status: "pending" }, "first failure retry");
Check((await queue.Claim(first.Value, 3, ct)).Value is null, "stale pending snapshot cannot retry an attempted item");
claim = (await queue.Claim(retry, 3, ct)).Value!;
await queue.MarkFailed(claim, "second failure", 3, ct);
claim = (await queue.Claim((await queue.Pending(1, 3, ct)).Value.Single(), 3, ct)).Value!;
await queue.MarkFailed(claim, "third failure", 3, ct);
stored = await db.EmailQueue.AsNoTracking().FirstAsync(row => row.Id == "probe-first", ct);
Check(stored is { Status: "failed", Attempts: 3, LastError: "third failure" }, "max attempts terminal state");
Check(!(await queue.MarkFailed(claim, "late failure", 3, ct)).IsSuccess, "completed claim cannot mutate a terminal item");
var key = new ThrottleKey("email", "category", "user", "context");
Check(!(await throttles.IsThrottled(key, 60000, ct)).Value, "new throttle");
Check((await throttles.Record(key, ct)).IsSuccess, "record throttle");
Check((await throttles.Record(key, ct)).IsSuccess, "update existing throttle");
Check((await throttles.IsThrottled(key, 60000, ct)).Value, "recent throttle");
Check(!(await throttles.IsThrottled(key, 0, ct)).Value, "expired throttle");
Check(!(await throttles.IsThrottled(key with { ContextId = "other" }, 60000, ct)).Value, "context isolation");
Check(!(await throttles.IsThrottled(key with { RecipientId = "other" }, 60000, ct)).Value, "recipient isolation");
Check(!(await throttles.IsThrottled(key with { Category = "other" }, 60000, ct)).Value, "category isolation");
Check(!(await throttles.IsThrottled(key with { Channel = "other" }, 60000, ct)).Value, "channel isolation");
Check((await db.Throttle.AsNoTracking().FirstAsync(row => row.Id == key.Id, ct)).LastSentAt == clock.IsoNow(), "throttle stored timestamp");
var unit = new UnitOfWork(db);
var rolledBack = await unit.Run<Unit>(async token =>
{
    await queue.Create(new QueueInput("probe-rollback", null, "u", "u@example.test", "u", "s", "h", "t", null, null), token);
    return Result<Unit>.Failed("TEST", "rollback");
}, ct);
Check(!rolledBack.IsSuccess && !await db.EmailQueue.AnyAsync(row => row.Id == "probe-rollback", ct), "unit of work rollback");
await queue.Create(new QueueInput("probe-process", null, "user", "user@example.test", "User", "Subject", "html", "text", null, null), ct);
var options = new ProcessorOptions(10, 3, "from@example.test", "From");
var failed = await QueueProcessor.Run(queue, new EmailProvider("failure", (_, _) => Task.FromResult(Result<string>.Failed("EMAIL_FAILED", "SMTP refused"))), options, ct);
Check(failed.Outcome.IsSuccess && failed is { Processed: 1, Sent: 0, Failed: 1 }, "provider failure accounting");
var thrown = await QueueProcessor.Run(queue, new EmailProvider("throws", (_, _) => throw new IOException("network timeout")), options, ct);
Check(thrown.Outcome.IsSuccess && thrown is { Processed: 1, Sent: 0, Failed: 1 }, "provider exception accounting");
EmailMessage? delivered = null;
var sent = await QueueProcessor.Run(queue, new EmailProvider("success", (message, _) =>
{
    delivered = message;
    return Task.FromResult(Result<string>.Success("message-id"));
}), options, ct);
Check(sent.Outcome.IsSuccess && sent is { Processed: 1, Sent: 1, Failed: 0 }, "provider success accounting");
Check(delivered is { Subject: "Subject", Html: "html", Text: "text", From.Email: "from@example.test" }
    && delivered.To.Single().Email == "user@example.test", "provider payload");
stored = await db.EmailQueue.AsNoTracking().FirstAsync(row => row.Id == "probe-process", ct);
Check(stored is { Status: "sent", Attempts: 3 } && stored.SentAt == clock.IsoNow(), "sent storage and retry count");
Check((await QueueProcessor.Run(queue, new EmailProvider("unused", (_, _) => throw new InvalidOperationException()), options, ct)).Processed == 0, "empty queue");
Check((await templates.Delete("probe-template", ct)).Value, "delete template");
var unavailable = queue with { Pending = (_, _, _) => Task.FromResult(Result<IReadOnlyList<QueueItem>>.Failed("INFRASTRUCTURE", "read failed")) };
var unread = await QueueProcessor.Run(unavailable, new EmailProvider("unused", (_, _) => throw new InvalidOperationException()), options, ct);
Check(!unread.Outcome.IsSuccess && unread is { Processed: 0, Sent: 0, Failed: 0 }, "pending read failure reports zero progress and explicit failure");
var sample = new QueueItem("first", null, "pending", "user", "u@example.test", "U", "s", "h", "t", null, null, 0, null, clock.IsoNow(), null);
var interrupted = queue with
{
    Pending = (_, _, _) => Task.FromResult(Result<IReadOnlyList<QueueItem>>.Success([sample, sample with { Id = "second" }])),
    Claim = (item, _, _) => Task.FromResult(Result<QueueClaim?>.Success(new(item, "owner"))),
    MarkSent = (claim, _) => Task.FromResult(claim.Item.Id == "first" ? Result<Unit>.Success(new Unit()) : Result<Unit>.Failed("INFRASTRUCTURE", "write failed")),
    MarkFailed = (_, _, _, _) => Task.FromResult(Result<Unit>.Failed("INFRASTRUCTURE", "failure recording unavailable"))
};
var partial = await QueueProcessor.Run(interrupted, new EmailProvider("success", (_, _) => Task.FromResult(Result<string>.Success("id"))), options, ct);
Check(!partial.Outcome.IsSuccess && partial is { Processed: 2, Sent: 1, Failed: 0 }, "infrastructure failure preserves prior batch progress");
for (var index = 0; index < 5; index++)
    Check((await queue.Create(new QueueInput($"probe-limit-{index}", null, "u", "u@example.test", "u", "s", "h", "t", null, null), ct)).IsSuccess, "create pending queue item");
Check((await queue.Pending(3, 3, ct)).Value.Count == 3, "multiple pending items respect limit");
var batch = await QueueProcessor.Run(queue, new EmailProvider("batch", (_, _) => Task.FromResult(Result<string>.Success("id"))),
    new ProcessorOptions(3, 3, "from@example.test", "From"), ct);
Check(batch.Outcome.IsSuccess && batch is { Processed: 3, Sent: 3, Failed: 0 }, "process a bounded batch");
Check((await queue.Pending(10, 3, ct)).Value.Count == 2, "excess pending items remain for the next batch");
batch = await QueueProcessor.Run(queue, new EmailProvider("batch", (_, _) => Task.FromResult(Result<string>.Success("id"))), options, ct);
Check(batch.Outcome.IsSuccess && batch is { Processed: 2, Sent: 2, Failed: 0 }, "process remaining batch");
Check((await queue.Pending(10, 3, ct)).Value.Count == 0, "sent items are excluded from pending");
await QueueLeaseProbe.Run(Path.GetFullPath(args[0]), Check);
Console.WriteLine($"TapTap storage/service probe: {assertions} assertions passed");

return 0;
