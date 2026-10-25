using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.Domain.Queue;

public sealed record QueueItem(string Id, string? TemplateName, string Status, string RecipientId,
    string RecipientEmail, string RecipientName, string Subject, string BodyHtml, string BodyText,
    string? Category, string? Metadata, long Attempts, string? LastError, string CreatedAt, string? SentAt);
public sealed record QueueInput(string Id, string? TemplateName, string RecipientId, string RecipientEmail,
    string RecipientName, string Subject, string BodyHtml, string BodyText, string? Category, string? Metadata);
public sealed record QueueStore(
    Func<QueueInput, CancellationToken, Task<Result<QueueItem>>> Create,
    Func<int, CancellationToken, Task<Result<IReadOnlyList<QueueItem>>>> Pending,
    Func<string, CancellationToken, Task<Result<Unit>>> MarkSending,
    Func<string, CancellationToken, Task<Result<Unit>>> MarkSent,
    Func<string, string, int, CancellationToken, Task<Result<Unit>>> MarkFailed);
