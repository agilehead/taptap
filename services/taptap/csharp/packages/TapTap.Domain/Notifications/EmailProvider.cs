using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.Domain.Notifications;

public sealed record EmailAddress(string Email, string? Name);
public sealed record EmailMessage(EmailAddress From, IReadOnlyList<EmailAddress> To, string Subject,
    string Html, string? Text, EmailAddress? ReplyTo = null);
public sealed record EmailProvider(string Name, Func<EmailMessage, CancellationToken, Task<Result<string>>> Send);
