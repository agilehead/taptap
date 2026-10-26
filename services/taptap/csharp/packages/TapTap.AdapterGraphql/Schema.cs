using System.Security.Cryptography;
using System.Text.Json;
using GraphQL;
using GraphQL.Types;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.AdapterGraphql;

public sealed record RequestSession(TemplateStore Templates, QueueStore Queue, ThrottleStore Throttles, IUnitOfWork UnitOfWork);

public static class Schema
{
    public static ISchema Create() => SchemaDefinitions.Build("Public", Resolve);

    private static async ValueTask<object?> Resolve(IResolveFieldContext context)
    {
        if (context.Source is IDictionary<string, object?> source)
            return source.TryGetValue(context.FieldDefinition.Name, out var value) ? value : null;
        var session = (RequestSession)context.UserContext["session"]!;
        var ct = context.CancellationToken;
        var field = context.FieldDefinition.Name;
        var name = context.HasArgument("name") ? context.GetArgument<string>("name") : "";
        switch (field)
        {
            case "health": return "ok";
            case "emailTemplate": return Template(Wire.Unwrap(await session.Templates.Find(name, ct)));
            case "emailTemplates": return Wire.Unwrap(await session.Templates.List(ct)).Select(Template).ToArray();
            case "registerEmailTemplate":
            {
                var input = Input(context);
                return Wire.Unwrap(await session.UnitOfWork.Run<object?>(async token =>
                {
                    var existing = await session.Templates.Find(Text(input, "name")!, token);
                    if (!existing.IsSuccess) return Result<object?>.Failed(existing.Error!);
                    if (existing.Value is not null) return Result<object?>.Failed("ALREADY_EXISTS", $"Template \"{Text(input, "name")}\" already exists");
                    var created = await session.Templates.Create(new TemplateInput(Text(input, "name")!,
                        Text(input, "subject")!, Text(input, "bodyHtml")!, Text(input, "bodyText")!), token);
                    return created.IsSuccess ? Result<object?>.Success(Template(created.Value)) : Result<object?>.Failed(created.Error!);
                }, ct));
            }
            case "updateEmailTemplate":
            {
                var input = Input(context);
                var updated = Wire.Unwrap(await session.Templates.Update(name,
                    new TemplateUpdate(Text(input, "subject"), Text(input, "bodyHtml"), Text(input, "bodyText")), ct));
                return updated is null ? throw Wire.Error($"Template \"{name}\" not found", "INTERNAL_SERVER_ERROR") : Template(updated);
            }
            case "deleteEmailTemplate": return Wire.Unwrap(await session.Templates.Delete(name, ct));
            case "sendEmail": case "sendRawEmail": return await Send(session, Input(context), field == "sendEmail", ct);
            default: throw new InvalidOperationException("Unknown TapTap field: " + field);
        }
    }

    private static async Task<object> Send(RequestSession session, IDictionary<string, object?> input,
        bool templated, CancellationToken ct)
    {
        var result = await session.UnitOfWork.Run(async token =>
        {
            var recipient = (IDictionary<string, object?>)input["recipient"]!;
            var templateName = templated ? Text(input, "template") : null;
            EmailTemplate? template = null;
            if (templateName is not null)
            {
                var found = await session.Templates.Find(templateName, token);
                if (!found.IsSuccess) return Result<object>.Failed(found.Error!);
                if (found.Value is null) return Result<object>.Failed("NOT_FOUND", $"Template \"{templateName}\" not found");
                template = found.Value;
            }
            var category = Text(input, "category"); var contextId = Text(input, "contextId");
            var interval = input.TryGetValue("throttleIntervalMs", out var milliseconds) && milliseconds is int value ? value : 0;
            var key = category is not null && contextId is not null && interval > 0
                ? new ThrottleKey("email", category, Text(recipient, "id")!, contextId) : null;
            if (key is not null)
            {
                var throttled = await session.Throttles.IsThrottled(key, interval, token);
                if (!throttled.IsSuccess) return Result<object>.Failed(throttled.Error!);
                if (throttled.Value) return Result<object>.Success(Sent(true, null, true));
            }
            string subject, html, text;
            if (template is not null)
            {
                try
                {
                    using var variables = JsonDocument.Parse(Text(input, "variables") ?? "{}");
                    subject = TemplateRendering.Render(template.Subject, variables.RootElement);
                    html = TemplateRendering.Render(template.BodyHtml, variables.RootElement);
                    text = TemplateRendering.Render(template.BodyText, variables.RootElement);
                }
                catch (JsonException error) { return Result<object>.Failed("INVALID_INPUT", error.Message); }
            }
            else { subject = Text(input, "subject")!; html = Text(input, "bodyHtml")!; text = Text(input, "bodyText")!; }
            var item = await session.Queue.Create(new QueueInput(Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(8)),
                templateName, Text(recipient, "id")!, Text(recipient, "email")!, Text(recipient, "name")!,
                subject, html, text, category, Text(input, "metadata")), token);
            if (!item.IsSuccess) return Result<object>.Failed(item.Error!);
            if (key is not null)
            {
                var recorded = await session.Throttles.Record(key, token);
                if (!recorded.IsSuccess) return Result<object>.Failed(recorded.Error!);
            }
            return Result<object>.Success(Sent(true, null, false));
        }, ct);
        return result.IsSuccess ? result.Value : Sent(false, result.Error!.Message, false);
    }

    private static IDictionary<string, object?> Input(IResolveFieldContext context) => context.GetArgument<Dictionary<string, object?>>("input");
    private static string? Text(IDictionary<string, object?> input, string key) => input.TryGetValue(key, out var value) ? value as string : null;
    private static object Sent(bool success, string? error, bool throttled) => new Dictionary<string, object?>
        { ["success"] = success, ["error"] = error, ["throttled"] = throttled };
    private static object? Template(EmailTemplate? template) => template is null ? null : new Dictionary<string, object?>
    {
        ["name"] = template.Name, ["subject"] = template.Subject, ["bodyHtml"] = template.BodyHtml,
        ["bodyText"] = template.BodyText, ["createdAt"] = template.CreatedAt, ["updatedAt"] = template.UpdatedAt
    };
}
