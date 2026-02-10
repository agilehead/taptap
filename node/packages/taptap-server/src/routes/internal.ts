/**
 * Internal Routes
 * Authenticated endpoints for cron jobs and system operations.
 * Protected by CRON_SECRET bearer token.
 */

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createLogger } from "@agilehead/taptap-logger";
import { processQueue, type ProcessorConfig } from "../queue/processor.js";
import type { EmailQueueRepository } from "../queue/types.js";
import type { EmailProvider } from "../providers/email/types.js";

const logger = createLogger("taptap-internal");

export function createInternalRoutes(
  cronSecret: string,
  queueRepo: EmailQueueRepository,
  emailProvider: EmailProvider,
  processorConfig: ProcessorConfig,
): Router {
  const router = Router();

  // Authenticate all internal routes with CRON_SECRET
  router.use((req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });

  router.post("/cron/process-queue", (_req: Request, res: Response) => {
    void (async () => {
      try {
        const result = await processQueue(
          queueRepo,
          emailProvider,
          processorConfig,
        );
        res.json(result);
      } catch (err: unknown) {
        logger.error("Cron process-queue failed:", err);
        res.status(500).json({
          error: "Internal server error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  });

  return router;
}
