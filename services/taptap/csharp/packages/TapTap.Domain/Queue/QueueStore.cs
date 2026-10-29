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
public sealed record QueueClaim(QueueItem Item, string Owner);

public static class DeliveryLimits
{
    public static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(60);
    public static readonly TimeSpan LeaseLifetime = TimeSpan.FromMinutes(2);
}

public sealed record QueueStore(
    Func<QueueInput, CancellationToken, Task<Result<QueueItem>>> Create,
    Func<int, int, CancellationToken, Task<Result<IReadOnlyList<QueueItem>>>> Pending,
    Func<QueueItem, int, CancellationToken, Task<Result<QueueClaim?>>> Claim,
    Func<QueueClaim, CancellationToken, Task<Result<Unit>>> MarkSent,
    Func<QueueClaim, string, int, CancellationToken, Task<Result<Unit>>> MarkFailed);
