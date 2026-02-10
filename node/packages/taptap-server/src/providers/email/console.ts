import { createLogger } from "@agilehead/taptap-logger";
import type { EmailProvider, EmailMessage, EmailSendResult } from "./types.js";

const logger = createLogger("taptap-email-console");

export function createConsoleEmailProvider(): EmailProvider {
  return {
    name: "console",
    send(message: EmailMessage): Promise<EmailSendResult> {
      logger.info("=== EMAIL (console provider) ===");
      logger.info(`From: ${message.from.name ?? ""} <${message.from.email}>`);
      logger.info(
        `To: ${message.to.map((t) => `${t.name ?? ""} <${t.email}>`).join(", ")}`,
      );
      if (message.replyTo) {
        logger.info(
          `Reply-To: ${message.replyTo.name ?? ""} <${message.replyTo.email}>`,
        );
      }
      logger.info(`Subject: ${message.subject}`);
      logger.info("--- Body (text) ---");
      logger.info(message.text ?? "(no text version)");
      logger.info("--- Body (html) ---");
      logger.info(message.html);
      logger.info("=== END EMAIL ===");
      return Promise.resolve({
        success: true,
        messageId: `console-${String(Date.now())}`,
      });
    },
  };
}
