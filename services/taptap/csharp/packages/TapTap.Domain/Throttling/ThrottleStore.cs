using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.Domain.Throttling;

public sealed record ThrottleKey(string Channel, string Category, string RecipientId, string ContextId)
{
    public string Id => $"{Channel}:{Category}:{RecipientId}:{ContextId}";
}
public sealed record ThrottleStore(
    Func<ThrottleKey, int, CancellationToken, Task<Result<bool>>> IsThrottled,
    Func<ThrottleKey, CancellationToken, Task<Result<Unit>>> Record);
