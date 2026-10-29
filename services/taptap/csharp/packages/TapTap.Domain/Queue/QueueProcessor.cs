using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using TapTap.Kernel;

namespace TapTap.Domain.Queue;

public sealed record ProcessorOptions(int BatchSize, int MaxAttempts, string FromEmail, string FromName);
public sealed record ProcessedQueue(int Processed, int Sent, int Failed, Result<Unit> Outcome);

public static class QueueProcessor
{
    public static async Task<ProcessedQueue> Run(QueueStore queue, EmailProvider provider, ProcessorOptions options, CancellationToken ct)
    {
        var pending = await queue.Pending(options.BatchSize, options.MaxAttempts, ct);
        if (!pending.IsSuccess) return new ProcessedQueue(0, 0, 0, Result<Unit>.Failed(pending.Error!));
        var processed = 0; var sent = 0; var failed = 0;
        foreach (var item in pending.Value)
        {
            var claimed = await queue.Claim(item, options.MaxAttempts, ct);
            if (!claimed.IsSuccess) return new ProcessedQueue(processed, sent, failed, Result<Unit>.Failed(claimed.Error!));
            if (claimed.Value is not { } claim) continue;
            processed++;
            Result<string> delivered;
            using (var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct))
            {
                timeout.CancelAfter(DeliveryLimits.SendTimeout);
                try
                {
                    delivered = await provider.Send(new EmailMessage(new EmailAddress(options.FromEmail, options.FromName),
                        [new EmailAddress(item.RecipientEmail, item.RecipientName)], item.Subject, item.BodyHtml, item.BodyText), timeout.Token);
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                { delivered = Result<string>.Failed("EMAIL_TIMEOUT", "Delivery timed out; provider acceptance may be unknown"); }
                catch (Exception error) when (error is not OperationCanceledException)
                { delivered = Result<string>.Failed("EMAIL_FAILED", error.Message); }
            }
            if (delivered.IsSuccess)
            {
                var marked = await queue.MarkSent(claim, ct);
                if (marked.IsSuccess) { sent++; continue; }
                // An acknowledged send must not be immediately reset to pending.
                // Leave the durable claim for bounded recovery if recording fails.
                return new ProcessedQueue(processed, sent, failed, Result<Unit>.Failed(marked.Error!));
            }
            var failure = await queue.MarkFailed(claim, delivered.Error!.Message, options.MaxAttempts, ct);
            if (!failure.IsSuccess) return new ProcessedQueue(processed, sent, failed, Result<Unit>.Failed(failure.Error!));
            failed++;
        }
        return new ProcessedQueue(processed, sent, failed, Result<Unit>.Success(new Unit()));
    }
}
