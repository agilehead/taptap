import { randomBytes } from "crypto";
import { createLogger } from "@agilehead/taptap-logger";
import { render } from "../templates/render.js";
import type { GQLResolvers } from "../generated/graphql.js";
import type { Context } from "../context/index.js";

const logger = createLogger("taptap-resolvers");

function generateId(): string {
  return randomBytes(10).toString("hex").substring(0, 16);
}

function checkThrottle(
  context: Context,
  channel: string,
  recipientId: string,
  category: string | null | undefined,
  contextId: string | null | undefined,
  throttleIntervalMs: number | null | undefined,
): boolean {
  if (
    category != null &&
    contextId != null &&
    throttleIntervalMs != null &&
    throttleIntervalMs > 0
  ) {
    return context.throttleRepo.isThrottled(
      channel,
      category,
      recipientId,
      contextId,
      throttleIntervalMs,
    );
  }
  return false;
}

function recordThrottle(
  context: Context,
  channel: string,
  recipientId: string,
  category: string | null | undefined,
  contextId: string | null | undefined,
  throttleIntervalMs: number | null | undefined,
): void {
  if (
    category != null &&
    contextId != null &&
    throttleIntervalMs != null &&
    throttleIntervalMs > 0
  ) {
    context.throttleRepo.recordSent(channel, category, recipientId, contextId);
  }
}

export const resolvers: GQLResolvers = {
  Query: {
    health: () => "ok",

    emailTemplate: (_parent, { name }, context) => {
      return context.templateRepo.findByName(name);
    },

    emailTemplates: (_parent, _args, context) => {
      return context.templateRepo.findAll();
    },
  },

  Mutation: {
    registerEmailTemplate: (_parent, { input }, context) => {
      const existing = context.templateRepo.findByName(input.name);
      if (existing !== null) {
        throw new Error(`Template "${input.name}" already exists`);
      }
      return context.templateRepo.create({
        name: input.name,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        bodyText: input.bodyText,
      });
    },

    updateEmailTemplate: (_parent, { name, input }, context) => {
      const result = context.templateRepo.update(name, {
        subject: input.subject ?? undefined,
        bodyHtml: input.bodyHtml ?? undefined,
        bodyText: input.bodyText ?? undefined,
      });
      if (result === null) {
        throw new Error(`Template "${name}" not found`);
      }
      return result;
    },

    deleteEmailTemplate: (_parent, { name }, context) => {
      return context.templateRepo.delete(name);
    },

    sendEmail: (_parent, { input }, context) => {
      try {
        const { recipient } = input;

        // Look up template
        const template = context.templateRepo.findByName(input.template);
        if (template === null) {
          return {
            success: false,
            error: `Template "${input.template}" not found`,
            throttled: false,
          };
        }

        // Check throttle
        if (
          checkThrottle(
            context,
            "email",
            recipient.id,
            input.category,
            input.contextId,
            input.throttleIntervalMs,
          )
        ) {
          logger.info(
            `Throttled email to ${recipient.email} (template: ${input.template}, category: ${input.category ?? ""})`,
          );
          return { success: true, error: null, throttled: true };
        }

        // Parse variables and render
        const variables: Record<string, string> =
          input.variables != null
            ? (JSON.parse(input.variables) as Record<string, string>)
            : {};
        const subject = render(template.subject, variables);
        const bodyHtml = render(template.bodyHtml, variables);
        const bodyText = render(template.bodyText, variables);

        // Enqueue
        context.queueRepo.create({
          id: generateId(),
          templateName: input.template,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          subject,
          bodyHtml,
          bodyText,
          category: input.category ?? null,
          metadata: input.metadata ?? null,
        });

        // Record throttle
        recordThrottle(
          context,
          "email",
          recipient.id,
          input.category,
          input.contextId,
          input.throttleIntervalMs,
        );

        logger.info(
          `Queued email to ${recipient.email} (template: ${input.template})`,
        );
        return { success: true, error: null, throttled: false };
      } catch (error) {
        logger.error("Failed to queue email:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          throttled: false,
        };
      }
    },

    sendRawEmail: (_parent, { input }, context) => {
      try {
        const { recipient } = input;

        // Check throttle
        if (
          checkThrottle(
            context,
            "email",
            recipient.id,
            input.category,
            input.contextId,
            input.throttleIntervalMs,
          )
        ) {
          logger.info(
            `Throttled raw email to ${recipient.email} (category: ${input.category ?? ""})`,
          );
          return { success: true, error: null, throttled: true };
        }

        // Enqueue
        context.queueRepo.create({
          id: generateId(),
          templateName: null,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          subject: input.subject,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText,
          category: input.category ?? null,
          metadata: input.metadata ?? null,
        });

        // Record throttle
        recordThrottle(
          context,
          "email",
          recipient.id,
          input.category,
          input.contextId,
          input.throttleIntervalMs,
        );

        logger.info(
          `Queued raw email to ${recipient.email}${input.category != null ? ` (category: ${input.category})` : ""}`,
        );
        return { success: true, error: null, throttled: false };
      } catch (error) {
        logger.error("Failed to queue raw email:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          throttled: false,
        };
      }
    },
  },
};
