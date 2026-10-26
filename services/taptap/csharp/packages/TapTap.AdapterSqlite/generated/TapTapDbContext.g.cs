#nullable enable

using System.Diagnostics.CodeAnalysis;
using Microsoft.EntityFrameworkCore;
using TapTap.AdapterSqlite.Entities;

namespace TapTap.AdapterSqlite;

public sealed partial class TapTapDbContext : DbContext
{
    [UnconditionalSuppressMessage("Trimming", "IL2026", Justification = "Native publishing generates the EF compiled model and query interceptors; the native contract suite exercises them.")]
    [UnconditionalSuppressMessage("AOT", "IL3050", Justification = "Native publishing generates the EF compiled model and query interceptors; the native contract suite exercises them.")]
    public TapTapDbContext(DbContextOptions<TapTapDbContext> options) : base(options) { }

    public DbSet<EmailTemplateRow> EmailTemplate => Set<EmailTemplateRow>();
    public DbSet<EmailQueueRow> EmailQueue => Set<EmailQueueRow>();
    public DbSet<ThrottleRow> Throttle => Set<ThrottleRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EmailTemplateRow>(entity =>
        {
            entity.ToTable("email_template");
            entity.HasKey(row => new { row.Name });
            entity.Property(row => row.Name).HasColumnName("name");
            entity.Property(row => row.Subject).HasColumnName("subject");
            entity.Property(row => row.BodyHtml).HasColumnName("body_html");
            entity.Property(row => row.BodyText).HasColumnName("body_text");
            entity.Property(row => row.CreatedAt).HasColumnName("created_at");
            entity.Property(row => row.UpdatedAt).HasColumnName("updated_at");
        });
        modelBuilder.Entity<EmailQueueRow>(entity =>
        {
            entity.ToTable("email_queue");
            entity.HasKey(row => new { row.Id });
            entity.Property(row => row.Id).HasColumnName("id");
            entity.Property(row => row.TemplateName).HasColumnName("template_name");
            entity.Property(row => row.Status).HasColumnName("status");
            entity.Property(row => row.RecipientId).HasColumnName("recipient_id");
            entity.Property(row => row.RecipientEmail).HasColumnName("recipient_email");
            entity.Property(row => row.RecipientName).HasColumnName("recipient_name");
            entity.Property(row => row.Subject).HasColumnName("subject");
            entity.Property(row => row.BodyHtml).HasColumnName("body_html");
            entity.Property(row => row.BodyText).HasColumnName("body_text");
            entity.Property(row => row.Category).HasColumnName("category");
            entity.Property(row => row.Metadata).HasColumnName("metadata");
            entity.Property(row => row.Attempts).HasColumnName("attempts");
            entity.Property(row => row.LastError).HasColumnName("last_error");
            entity.Property(row => row.CreatedAt).HasColumnName("created_at");
            entity.Property(row => row.SentAt).HasColumnName("sent_at");
        });
        modelBuilder.Entity<ThrottleRow>(entity =>
        {
            entity.ToTable("throttle");
            entity.HasKey(row => new { row.Id });
            entity.Property(row => row.Id).HasColumnName("id");
            entity.Property(row => row.Channel).HasColumnName("channel");
            entity.Property(row => row.Category).HasColumnName("category");
            entity.Property(row => row.RecipientId).HasColumnName("recipient_id");
            entity.Property(row => row.ContextId).HasColumnName("context_id");
            entity.Property(row => row.LastSentAt).HasColumnName("last_sent_at");
        });
    }
}
