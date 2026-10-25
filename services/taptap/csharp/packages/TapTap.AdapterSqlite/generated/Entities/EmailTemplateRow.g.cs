#nullable enable

namespace TapTap.AdapterSqlite.Entities;

public sealed class EmailTemplateRow
{
    public required string Name { get; set; }
    public required string Subject { get; set; }
    public required string BodyHtml { get; set; }
    public required string BodyText { get; set; }
    public required string CreatedAt { get; set; }
    public required string UpdatedAt { get; set; }
}
