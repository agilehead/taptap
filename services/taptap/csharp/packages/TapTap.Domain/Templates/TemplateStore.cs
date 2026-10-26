using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.Domain.Templates;

public sealed record EmailTemplate(string Name, string Subject, string BodyHtml, string BodyText,
    string CreatedAt, string UpdatedAt);
public sealed record TemplateInput(string Name, string Subject, string BodyHtml, string BodyText);
public sealed record TemplateUpdate(string? Subject, string? BodyHtml, string? BodyText);
public sealed record TemplateStore(
    Func<string, CancellationToken, Task<Result<EmailTemplate?>>> Find,
    Func<CancellationToken, Task<Result<IReadOnlyList<EmailTemplate>>>> List,
    Func<TemplateInput, CancellationToken, Task<Result<EmailTemplate>>> Create,
    Func<string, TemplateUpdate, CancellationToken, Task<Result<EmailTemplate?>>> Update,
    Func<string, CancellationToken, Task<Result<bool>>> Delete);
