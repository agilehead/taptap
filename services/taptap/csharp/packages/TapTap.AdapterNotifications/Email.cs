using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.AdapterNotifications;

public sealed record SmtpOptions(string Host, int Port, bool Secure, string User, string Password);

public static class Email
{
    public static EmailProvider Console(ILogger logger) => new("console", (message, cancellation) =>
    {
        cancellation.ThrowIfCancellationRequested();
        logger.LogInformation("Console email from {From} to {To}: {Subject}\n{Text}\n{Html}",
            message.From.Email, string.Join(", ", message.To.Select(value => value.Email)),
            message.Subject, message.Text, message.Html);
        return Task.FromResult(Result<string>.Success("console-" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()));
    });

    public static EmailProvider Smtp(SmtpOptions options, ILogger logger) => new("smtp", async (message, cancellation) =>
    {
        try
        {
            using var mime = new MimeMessage();
            mime.From.Add(new MailboxAddress(message.From.Name ?? "", message.From.Email));
            foreach (var address in message.To) mime.To.Add(new MailboxAddress(address.Name ?? "", address.Email));
            if (message.ReplyTo is { } reply) mime.ReplyTo.Add(new MailboxAddress(reply.Name ?? "", reply.Email));
            mime.Subject = message.Subject;
            mime.Body = new BodyBuilder { HtmlBody = message.Html, TextBody = message.Text }.ToMessageBody();
            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(options.Host, options.Port,
                options.Secure ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable, cancellation);
            await smtp.AuthenticateAsync(options.User, options.Password, cancellation);
            var response = await smtp.SendAsync(mime, cancellation);
            try { await smtp.DisconnectAsync(true, cancellation); }
            catch (Exception error) when (error is IOException or SmtpProtocolException or SmtpCommandException or OperationCanceledException)
            {
                // SendAsync completed after SMTP acceptance. Closing the session
                // cannot turn an accepted message into a retryable delivery.
                logger.LogWarning(error, "SMTP accepted the message but session shutdown failed");
            }
            return Result<string>.Success(response);
        }
        catch (Exception error) when (error is not OperationCanceledException)
        {
            logger.LogError(error, "SMTP delivery failed");
            return Result<string>.Failed("EMAIL_FAILED", error.Message);
        }
    });
}
