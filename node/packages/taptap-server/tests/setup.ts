/**
 * TapTap Server Integration Test Setup
 *
 * Uses taptap-test-utils for database management.
 * Self-contained: starts its own server for local testing.
 */

import {
  type TestDatabase,
  getTestDatabaseInstance,
  getExternalTestDatabaseInstance,
  setupTestDatabase,
  teardownTestDatabase,
  truncateAllTables,
} from "@agilehead/taptap-test-utils";
import { createLogger } from "@agilehead/taptap-logger";
import { createEmailQueueRepository } from "../src/queue/repository.js";
import type { EmailQueueRepository } from "../src/queue/types.js";

const logger = createLogger("taptap-test");

export { logger as testLogger };

export let testDb: TestDatabase;
export let queueRepo: EmailQueueRepository;
export let graphqlUrl: string;
export let serverBaseUrl: string;
export let cronSecret: string;

let serverHandle: { stop(): Promise<void> } | null = null;

// Check if we're targeting an external server
const externalTestUrl = process.env.TEST_URL;
const externalDbPath = process.env.TEST_DB_PATH;

// Port for local testing
const TEST_PORT = 5010;

export async function setupTests(): Promise<void> {
  if (externalTestUrl !== undefined && externalTestUrl !== "") {
    // Running against an external server (e.g., docker)
    logger.info(`Running tests against external server: ${externalTestUrl}`);

    // In external mode, CRON_SECRET must be provided via env
    cronSecret = process.env.TEST_CRON_SECRET ?? "test-cron-secret";

    if (externalDbPath !== undefined && externalDbPath !== "") {
      logger.info(`Using external database at: ${externalDbPath}`);
      testDb = getExternalTestDatabaseInstance(externalDbPath, logger);
      await setupTestDatabase(testDb);
      queueRepo = createEmailQueueRepository(testDb.db);
    } else {
      logger.warn("TEST_URL is set but TEST_DB_PATH is not - tests requiring database setup will fail");
    }

    serverBaseUrl = externalTestUrl.replace(/\/graphql$/, "");
    graphqlUrl = externalTestUrl.endsWith("/graphql")
      ? externalTestUrl
      : `${externalTestUrl}/graphql`;

    logger.info("Test environment ready (external mode)");
  } else {
    // Running locally with our own server
    logger.info("Setting up local test environment...");

    // Setup database
    testDb = getTestDatabaseInstance(logger);
    await setupTestDatabase(testDb);
    queueRepo = createEmailQueueRepository(testDb.db);

    // Start server
    const { startTestServer, TEST_CRON_SECRET } = await import("./test-server.js");
    serverHandle = await startTestServer(testDb, TEST_PORT);

    cronSecret = TEST_CRON_SECRET;
    serverBaseUrl = `http://localhost:${String(TEST_PORT)}`;
    graphqlUrl = `${serverBaseUrl}/graphql`;

    logger.info("Test environment ready (local mode)");
  }
}

export async function teardownTests(): Promise<void> {
  try {
    if (serverHandle !== null) {
      logger.info("Stopping test server...");
      await serverHandle.stop();
      serverHandle = null;
    }

    // Wait for connections to close
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    // Teardown database
    if (testDb !== undefined) {
      await teardownTestDatabase(testDb);
    }

    logger.info("Cleanup complete");
  } catch (error) {
    logger.error("Error during cleanup:", error);
    process.exit(1);
  }
}

export function truncateEmailQueue(): void {
  truncateAllTables(testDb);
}

// Global hooks for when running all tests
export function setupGlobalHooks(): void {
  before(async function () {
    this.timeout(60000);
    await setupTests();
  });

  after(async function () {
    this.timeout(30000);
    await teardownTests();
  });
}
