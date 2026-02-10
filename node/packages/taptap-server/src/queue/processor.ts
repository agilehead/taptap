import { createLogger } from "@agilehead/taptap-logger";
import type { EmailProvider } from "../providers/email/types.js";
import type { EmailQueueRepository } from "./types.js";

const logger = createLogger("taptap-queue-processor");

export type ProcessorConfig = {
  batchSize: number;
  maxAttempts: number;
  fromEmail: string;
  fromName: string;
};

export type ProcessQueueResult = {
  processed: number;
  sent: number;
  failed: number;
};

export async function processQueue(
  queueRepo: EmailQueueRepository,
  emailProvider: EmailProvider,
  config: ProcessorConfig,
): Promise<ProcessQueueResult> {
  const result: ProcessQueueResult = { processed: 0, sent: 0, failed: 0 };

  try {
    const pending = queueRepo.findPending(config.batchSize);
    if (pending.length === 0) return result;

    logger.info(`Processing ${String(pending.length)} pending email(s)`);

    for (const item of pending) {
      result.processed++;
      try {
        queueRepo.markSending(item.id);
        const sendResult = await emailProvider.send({
          from: { email: config.fromEmail, name: config.fromName },
          to: [{ email: item.recipientEmail, name: item.recipientName }],
          subject: item.subject,
          html: item.bodyHtml,
          text: item.bodyText,
        });
        if (sendResult.success) {
          queueRepo.markSent(item.id);
          result.sent++;
          logger.info(`Sent email to ${item.recipientEmail} (${item.id})`);
        } else {
          queueRepo.markFailed(
            item.id,
            sendResult.error ?? "Unknown error",
            config.maxAttempts,
          );
          result.failed++;
          logger.error(
            `Failed to send email ${item.id}: ${sendResult.error ?? "Unknown error"}`,
          );
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        queueRepo.markFailed(item.id, errorMessage, config.maxAttempts);
        result.failed++;
        logger.error(`Error processing email ${item.id}: ${errorMessage}`);
      }
    }
  } catch (err: unknown) {
    logger.error(
      `Queue processor error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return result;
}
