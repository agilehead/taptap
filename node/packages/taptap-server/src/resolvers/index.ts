import { createLogger } from "@agilehead/taptap-logger";
import type { GQLResolvers } from "../generated/graphql.js";

const logger = createLogger("taptap-resolvers");

export const resolvers: GQLResolvers = {
  Query: {
    health: () => "ok",
  },
  Mutation: {
    sendNotification: async (_parent, { input }, context) => {
      try {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(input.data) as Record<string, unknown>;
        } catch {
          return { success: false, error: "Invalid JSON in data field" };
        }
        const result = await context.provider.send({
          type: input.type,
          recipient: {
            id: input.recipient.id,
            email: input.recipient.email,
            name: input.recipient.name,
          },
          data,
        });
        return { success: result.success, error: result.error ?? null };
      } catch (error) {
        logger.error("Failed to send notification:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
};
