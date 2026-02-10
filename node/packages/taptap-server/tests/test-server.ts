/**
 * TapTap Test Server
 *
 * Starts a lightweight TapTap server instance for integration testing.
 */

import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Server } from "http";
import type { TestDatabase } from "@agilehead/taptap-test-utils";
import { createLogger } from "@agilehead/taptap-logger";
import { createContext, type Context } from "../src/context/index.js";
import { resolvers } from "../src/resolvers/index.js";
import { createEmailQueueRepository } from "../src/queue/repository.js";
import { createQueueProvider } from "../src/providers/queue.js";
import { createConsoleEmailProvider } from "../src/providers/email/console.js";
import { createInternalRoutes } from "../src/routes/internal.js";

const logger = createLogger("taptap-test-server");
const __dirname = dirname(fileURLToPath(import.meta.url));

export const TEST_CRON_SECRET = "test-cron-secret";

export async function startTestServer(
  testDb: TestDatabase,
  port: number,
): Promise<{ stop(): Promise<void> }> {
  logger.info(`Starting test server on port ${String(port)}...`);

  // Create queue repository with the test database
  const queueRepo = createEmailQueueRepository(testDb.db);

  // Create providers
  const emailProvider = createConsoleEmailProvider();
  const queueProvider = createQueueProvider(queueRepo);

  // Load GraphQL schema
  const schemaPath = join(__dirname, "../src/schema.graphql");
  const typeDefs = readFileSync(schemaPath, "utf-8");

  // Create Apollo Server
  const apolloServer = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await apolloServer.start();

  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Internal cron routes
  app.use(
    "/internal",
    createInternalRoutes(TEST_CRON_SECRET, queueRepo, emailProvider, {
      batchSize: 10,
      maxAttempts: 3,
      fromEmail: "noreply@test.com",
      fromName: "TapTap Test",
    }),
  );

  // GraphQL endpoint
  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: () => Promise.resolve(createContext(queueProvider, emailProvider, queueRepo)),
    }),
  );

  const server: Server = app.listen(port, () => {
    logger.info(`Test server ready at http://localhost:${String(port)}/graphql`);
  });

  // Wait a moment for server to be fully ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    async stop(): Promise<void> {
      logger.info("Stopping test server...");
      await apolloServer.stop();
      await new Promise<void>((resolve, reject) => {
        server.close((err: Error | undefined) => {
          if (err !== undefined) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      logger.info("Test server stopped");
    },
  };
}
