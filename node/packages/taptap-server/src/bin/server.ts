#!/usr/bin/env node
/**
 * TapTap Server Entry Point
 *
 * Template-based email notification service
 */

import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { config } from "../config.js";
import { createLogger } from "@agilehead/taptap-logger";
import { createContext, type Context } from "../context/index.js";
import { resolvers } from "../resolvers/index.js";
import { initSQLiteDatabase, closeSQLiteDatabase } from "@agilehead/taptap-db";
import { createEmailQueueRepository } from "../queue/repository.js";
import { createThrottleRepository } from "../throttle/index.js";
import { createEmailTemplateRepository } from "../templates/index.js";
import {
  createConsoleEmailProvider,
  createSmtpEmailProvider,
  type EmailProvider,
} from "../providers/email/index.js";
import { createInternalRoutes } from "../routes/internal.js";

const logger = createLogger("taptap-server");
const __dirname = dirname(fileURLToPath(import.meta.url));

async function startServer(): Promise<void> {
  try {
    logger.info("Starting TapTap server", {
      nodeEnv: config.nodeEnv,
      host: config.server.host,
      port: config.server.port,
      emailProvider: config.email.provider,
    });

    logger.info("Initializing database", { dbPath: config.db.dbPath });
    const db = initSQLiteDatabase(config.db.dbPath);

    const queueRepo = createEmailQueueRepository(db);
    const throttleRepo = createThrottleRepository(db);
    const templateRepo = createEmailTemplateRepository(db);

    logger.info("Initializing email provider", {
      provider: config.email.provider,
    });
    let emailProvider: EmailProvider;
    if (config.email.provider === "smtp") {
      emailProvider = createSmtpEmailProvider({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        user: config.email.smtp.user,
        password: config.email.smtp.password,
      });
    } else {
      emailProvider = createConsoleEmailProvider();
    }
    logger.info("Email provider initialized", { name: emailProvider.name });

    const schemaPath = join(__dirname, "../schema.graphql");
    const typeDefs = readFileSync(schemaPath, "utf-8");

    const server = new ApolloServer<Context>({
      typeDefs,
      resolvers,
      introspection: !config.isProduction,
      formatError: (formattedError, error) => {
        logger.error("GraphQL Error:", {
          message: formattedError.message,
          path: formattedError.path,
          extensions: formattedError.extensions,
          originalError: error,
        });
        return formattedError;
      },
    });

    await server.start();

    const app = express();
    if (config.isProduction) {
      app.set("trust proxy", 1);
    }
    app.use(cors({ origin: config.cors.origins, credentials: false }));
    app.use(express.json({ limit: "1mb" }));

    app.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });

    // Internal cron routes (process-queue, etc.)
    app.use(
      "/internal",
      createInternalRoutes(config.cronSecret, queueRepo, emailProvider, {
        batchSize: config.queue.batchSize,
        maxAttempts: config.queue.maxAttempts,
        fromEmail: config.email.from.email,
        fromName: config.email.from.name,
      }),
    );

    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: () =>
          Promise.resolve(
            createContext(queueRepo, emailProvider, throttleRepo, templateRepo),
          ),
      }),
    );

    const { host, port } = config.server;
    app.listen(port, host, () => {
      logger.info("TapTap server started", {
        url: `http://${host}:${String(port)}`,
        graphql: `http://${host}:${String(port)}/graphql`,
      });
    });

    const shutdown = (): void => {
      logger.info("Shutting down gracefully...");
      closeSQLiteDatabase(db);
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error("Failed to start TapTap server:", error);
    process.exit(1);
  }
}

void startServer().catch((error: unknown) => {
  logger.error("Unhandled error during startup:", error);
  process.exit(1);
});
