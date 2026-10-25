import { createTransport } from "nodemailer";
import { createLogger } from "@agilehead/taptap-logger";
import type { EmailProvider, EmailMessage, EmailSendResult } from "./types.js";

const logger = createLogger("taptap-email-smtp");

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};
type SmtpSendResult = {
  messageId: string;
  envelope: { from: string; to: string[] };
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
};

export function createSmtpEmailProvider(config: SmtpConfig): EmailProvider {
  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });

  return {
    name: "smtp",
    async send(message: EmailMessage): Promise<EmailSendResult> {
      const formatAddress = (addr: {
        email: string;
        name?: string;
      }): string => {
        return addr.name !== undefined && addr.name !== ""
          ? `${addr.name} <${addr.email}>`
          : addr.email;
      };
      try {
        const info = (await transporter.sendMail({
          from: formatAddress(message.from),
          to: message.to.map((t) => formatAddress(t)).join(", "),
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo ? formatAddress(message.replyTo) : undefined,
        })) as SmtpSendResult;
        logger.info(`Email sent via SMTP: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error("Failed to send email via SMTP:", error);
        return { success: false, error: errorMessage };
      }
    },
  };
}
