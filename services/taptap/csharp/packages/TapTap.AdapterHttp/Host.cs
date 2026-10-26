using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TapTap.AdapterGraphql;
using TapTap.AdapterNotifications;
using TapTap.AdapterRuntime;
using TapTap.AdapterSqlite;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.AdapterHttp;

public static class Host
{
    public static async Task<int> Run(string[] arguments)
    {
        if (arguments.SequenceEqual(["health"]))
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
            try { return (await client.GetAsync("http://127.0.0.1:" + Settings.Number("TAPTAP_SERVER_PORT", 5006, 65535) + "/health")).IsSuccessStatusCode ? 0 : 1; }
            catch (HttpRequestException) { return 1; }
        }
        var settings = Settings.Read();
        Storage.Initialize(settings.DatabasePath);
        var builder = WebApplication.CreateSlimBuilder(arguments);
        builder.Logging.SetMinimumLevel(Logging.Minimum(Environment.GetEnvironmentVariable("LOG_LEVEL")));
        builder.WebHost.UseUrls($"http://{settings.Host}:{settings.Port}");
        builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(settings.CorsOrigins).AllowAnyHeader().AllowAnyMethod()));
        var app = builder.Build();
        var clock = new Clock(() => DateTimeOffset.UtcNow);
        var provider = settings.EmailProvider == "smtp" ? Email.Smtp(new SmtpOptions(settings.SmtpHost,
            settings.SmtpPort, settings.SmtpSecure, settings.SmtpUser, settings.SmtpPassword), app.Logger) : Email.Console(app.Logger);
        var schema = Schema.Create();
        app.UseCors();
        app.Use(async (context, next) =>
        {
            GraphqlEndpoint.Limit(context, 1024 * 1024);
            try { await next(context); }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested) { }
            catch (BadHttpRequestException error)
            {
                if (!context.Response.HasStarted) await GraphqlEndpoint.Error(context, error.StatusCode, "Invalid request body", "BAD_REQUEST");
            }
            catch (Exception error)
            {
                app.Logger.LogError(error, "TapTap request failed");
                context.Response.StatusCode = 500;
                await GraphqlEndpoint.Json(context, new JsonObject { ["error"] = "Internal server error" });
            }
        });
        app.MapGet("/health", context => GraphqlEndpoint.Json(context, new JsonObject { ["status"] = "ok" }));
        app.Map("/graphql", async context =>
        {
            var request = await GraphqlEndpoint.Read(context);
            if (request is null) return;
            await using var db = Storage.Open(settings.DatabasePath);
            var session = new RequestSession(AdapterSqlite.Templates.Templates.Create(db, clock),
                AdapterSqlite.Queue.Queue.Create(db, clock), AdapterSqlite.Throttling.Throttling.Create(db, clock), new UnitOfWork(db));
            await GraphqlEndpoint.Execute(context, schema, request, session, int.MaxValue, !settings.Production);
        });
        app.Map("/internal/{**path}", async context =>
        {
            if (context.Request.Headers.Authorization != "Bearer " + settings.CronSecret)
            {
                context.Response.StatusCode = 401;
                await GraphqlEndpoint.Json(context, new JsonObject { ["error"] = "Unauthorized" });
                return;
            }
            if (!HttpMethods.IsPost(context.Request.Method) || context.Request.Path.Value?.TrimEnd('/') != "/internal/cron/process-queue")
            { context.Response.StatusCode = 404; return; }
            await using var db = Storage.Open(settings.DatabasePath);
            var result = await QueueProcessor.Run(AdapterSqlite.Queue.Queue.Create(db, clock), provider,
                // Once started, the cron batch belongs to the worker, independent of
                // the HTTP caller disconnecting, as in the existing server.
                new ProcessorOptions(settings.BatchSize, settings.MaxAttempts, settings.FromAddress, settings.FromName), CancellationToken.None);
            if (!result.Outcome.IsSuccess) app.Logger.LogError("Queue processing failed: {Error}", result.Outcome.Error!.Message);
            var value = result;
            await GraphqlEndpoint.Json(context, new JsonObject { ["processed"] = value.Processed, ["sent"] = value.Sent, ["failed"] = value.Failed });
        });
        await app.RunAsync();
        return 0;
    }
}
