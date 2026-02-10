/**
 * TapTap Test Database
 *
 * Manages the taptap.db for integration testing.
 * Uses Knex migrations for schema management.
 * Follows functional style - no classes.
 */

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, rmSync } from "fs";
import Knex from "knex";
import { createLogger, type Logger } from "@agilehead/taptap-logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get project root (4 levels up from this file: src -> taptap-test-utils -> packages -> node -> taptap)
const PROJECT_ROOT = join(__dirname, "../../../..");

export type TestDatabase = {
  db: Database.Database;
  knex: Knex.Knex | null;
  dbPath: string;
  testDir: string | null;
  logger: Logger;
  isExternal: boolean;
};

export type TestDatabaseState = {
  current: TestDatabase | null;
};

// Module-level singleton state
const state: TestDatabaseState = { current: null };

export function createTestDatabase(
  logger?: Logger,
  externalDbPath?: string,
): TestDatabase {
  const log = logger ?? createLogger("taptap-test-db");
  const isExternal = externalDbPath !== undefined;

  let dbPath: string;
  let testDir: string | null;

  if (externalDbPath !== undefined) {
    // External mode: use existing database at specified path
    dbPath = externalDbPath;
    testDir = null;
    log.info(`Using external database at: ${externalDbPath}`);
  } else {
    // Local mode: create a timestamped test directory under .tests/
    const timestamp = Date.now();
    testDir = join(PROJECT_ROOT, ".tests", `test-${String(timestamp)}`, "data");
    mkdirSync(join(testDir, "db"), { recursive: true });
    dbPath = join(testDir, "db", "taptap.db");
  }

  return {
    db: null as unknown as Database.Database, // Will be set in setup
    knex: null,
    dbPath,
    testDir,
    logger: log,
    isExternal,
  };
}

export async function setupTestDatabase(testDb: TestDatabase): Promise<void> {
  testDb.logger.info("Setting up test database...");

  if (!testDb.isExternal) {
    // Setup database with Knex migrations
    testDb.knex = Knex({
      client: "better-sqlite3",
      connection: { filename: testDb.dbPath },
      useNullAsDefault: true,
      migrations: {
        directory: join(PROJECT_ROOT, "database/taptap/migrations"),
      },
    });
    await testDb.knex.migrate.latest();
  }

  // Create better-sqlite3 instance for queries
  const db = new Database(testDb.dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  (testDb as { db: Database.Database }).db = db;

  testDb.logger.info(
    testDb.isExternal
      ? "External test database connected"
      : "Test database setup complete",
  );
}

export function truncateAllTables(testDb: TestDatabase): void {
  testDb.db.pragma("foreign_keys = OFF");
  const tables = testDb.db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'knex_migrations' AND name != 'knex_migrations_lock'",
    )
    .all() as { name: string }[];

  for (const { name } of tables) {
    testDb.db.prepare(`DELETE FROM ${name}`).run();
  }
  testDb.db.pragma("foreign_keys = ON");

  testDb.logger.debug("Truncated all test tables");
}

export async function teardownTestDatabase(
  testDb: TestDatabase,
): Promise<void> {
  if (testDb.knex !== null) {
    await testDb.knex.destroy();
    testDb.knex = null;
  }
  testDb.db.close();
  (testDb as { db: Database.Database | null }).db = null;

  // Only delete test directory for local databases, not external ones
  if (!testDb.isExternal && testDb.testDir !== null) {
    try {
      const testRunDir = join(testDb.testDir, "..");
      rmSync(testRunDir, { recursive: true, force: true });
      testDb.logger.info(`Test directory deleted: ${testRunDir}`);
    } catch {
      // Ignore if directory doesn't exist
    }
  }
}

// Singleton accessors
export function getTestDatabaseInstance(logger?: Logger): TestDatabase {
  state.current ??= createTestDatabase(logger);
  return state.current;
}

export function getExternalTestDatabaseInstance(
  dbPath: string,
  logger?: Logger,
): TestDatabase {
  state.current ??= createTestDatabase(logger, dbPath);
  return state.current;
}

export function clearTestDatabaseInstance(): void {
  state.current = null;
}

// ==========================================
// Email Queue Helpers
// ==========================================

export type InsertEmailQueueData = {
  id: string;
  templateName: string | null;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category?: string | null;
  metadata?: string | null;
  status?: string;
  attempts?: number;
  lastError?: string | null;
  createdAt?: string;
  sentAt?: string | null;
};

export function insertEmailQueueItem(
  testDb: TestDatabase,
  data: InsertEmailQueueData,
): void {
  const now = new Date().toISOString();

  testDb.db
    .prepare(
      `INSERT INTO email_queue (
        id, template_name, status, recipient_id, recipient_email, recipient_name,
        subject, body_html, body_text, category, metadata, attempts, last_error,
        created_at, sent_at
      ) VALUES (
        @id, @templateName, @status, @recipientId, @recipientEmail, @recipientName,
        @subject, @bodyHtml, @bodyText, @category, @metadata, @attempts, @lastError,
        @createdAt, @sentAt
      )`,
    )
    .run({
      id: data.id,
      templateName: data.templateName,
      status: data.status ?? "pending",
      recipientId: data.recipientId,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      bodyText: data.bodyText,
      category: data.category ?? null,
      metadata: data.metadata ?? null,
      attempts: data.attempts ?? 0,
      lastError: data.lastError ?? null,
      createdAt: data.createdAt ?? now,
      sentAt: data.sentAt ?? null,
    });
}

export type EmailQueueRecord = {
  id: string;
  template_name: string | null;
  status: string;
  recipient_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  category: string | null;
  metadata: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

export function getEmailQueueItem(
  testDb: TestDatabase,
  id: string,
): EmailQueueRecord | null {
  const result = testDb.db
    .prepare("SELECT * FROM email_queue WHERE id = ?")
    .get(id) as EmailQueueRecord | undefined;

  return result ?? null;
}

export function getEmailQueueCount(testDb: TestDatabase): number {
  const result = testDb.db
    .prepare("SELECT COUNT(*) as count FROM email_queue")
    .get() as { count: number };

  return result.count;
}
