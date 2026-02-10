/**
 * taptap-test-utils - Test utilities for TapTap service
 */

// Test database utilities
export {
  type TestDatabase,
  type TestDatabaseState,
  createTestDatabase,
  setupTestDatabase,
  truncateAllTables,
  teardownTestDatabase,
  getTestDatabaseInstance,
  getExternalTestDatabaseInstance,
  clearTestDatabaseInstance,
  // Email queue helpers
  type InsertEmailQueueData,
  type EmailQueueRecord,
  insertEmailQueueItem,
  getEmailQueueItem,
  getEmailQueueCount,
} from "./test-db.js";

// Test fixtures
export { generateId, createTestEmailQueueItem } from "./test-fixtures.js";
