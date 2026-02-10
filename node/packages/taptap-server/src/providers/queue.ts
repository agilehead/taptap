import { createLogger } from "@agilehead/taptap-logger";
import type {
  NotificationProvider,
  NotificationPayload,
  SendResult,
} from "./types.js";
import type { EmailQueueRepository } from "../queue/types.js";
import type { ThrottleRepository } from "../throttle/types.js";
import { formatEmailForNotificationType } from "../email/templates.js";
import {
  shouldThrottle,
  getThrottleInterval,
  getContextIdFromData,
} from "../throttle/config.js";

const logger = createLogger("taptap-queue-provider");

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp}${random}`.substring(0, 10);
}

export function createQueueProvider(
  queueRepo: EmailQueueRepository,
  throttleRepo?: ThrottleRepository,
): NotificationProvider {
  return {
    send(payload: NotificationPayload): Promise<SendResult> {
      try {
        if (throttleRepo !== undefined && shouldThrottle(payload.type)) {
          const intervalMs = getThrottleInterval(payload.type);
          const contextId = getContextIdFromData(payload.type, payload.data);
          if (intervalMs !== null) {
            const isThrottled = throttleRepo.isThrottled(
              payload.type,
              payload.recipient.id,
              contextId,
              intervalMs,
            );
            if (isThrottled) {
              logger.info(
                `Throttled ${payload.type} notification to ${payload.recipient.email} (context: ${contextId})`,
              );
              return Promise.resolve({ success: true, throttled: true });
            }
          }
        }

        const { subject, html, text } = formatEmailForNotificationType(
          payload.type,
          payload.recipient.name,
          payload.data,
        );

        queueRepo.create({
          id: generateId(),
          notificationType: payload.type,
          recipientId: payload.recipient.id,
          recipientEmail: payload.recipient.email,
          recipientName: payload.recipient.name,
          subject,
          bodyHtml: html,
          bodyText: text,
          data: JSON.stringify(payload.data),
        });

        if (throttleRepo !== undefined && shouldThrottle(payload.type)) {
          const contextId = getContextIdFromData(payload.type, payload.data);
          throttleRepo.recordSent(
            payload.type,
            payload.recipient.id,
            contextId,
          );
        }

        logger.info(
          `Queued ${payload.type} notification email to ${payload.recipient.email}`,
        );
        return Promise.resolve({ success: true });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to queue notification: ${errorMessage}`);
        return Promise.resolve({ success: false, error: errorMessage });
      }
    },
  };
}
