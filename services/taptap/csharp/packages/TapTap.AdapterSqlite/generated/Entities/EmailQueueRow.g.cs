#nullable enable

namespace TapTap.AdapterSqlite.Entities;

public sealed class EmailQueueRow
{
    public required string Id { get; set; }
    public string? TemplateName { get; set; }
    public required string Status { get; set; }
    public required string RecipientId { get; set; }
    public required string RecipientEmail { get; set; }
    public required string RecipientName { get; set; }
    public required string Subject { get; set; }
    public required string BodyHtml { get; set; }
    public required string BodyText { get; set; }
    public string? Category { get; set; }
    public string? Metadata { get; set; }
    public long Attempts { get; set; }
    public string? LastError { get; set; }
    public required string CreatedAt { get; set; }
    public string? SentAt { get; set; }
}
