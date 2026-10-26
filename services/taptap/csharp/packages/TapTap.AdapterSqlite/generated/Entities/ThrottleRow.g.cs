#nullable enable

namespace TapTap.AdapterSqlite.Entities;

public sealed class ThrottleRow
{
    public required string Id { get; set; }
    public required string Channel { get; set; }
    public required string Category { get; set; }
    public required string RecipientId { get; set; }
    public required string ContextId { get; set; }
    public required string LastSentAt { get; set; }
}
