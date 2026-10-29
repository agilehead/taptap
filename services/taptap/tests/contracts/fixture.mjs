import { dirname } from "node:path";
export const modes = ["single", "production"];
export const secret = "";
export const internalSecret = "test-cron-secret";
export function environment(port, database, mode) {
  return {
    NODE_ENV: mode === "production" ? "production" : "test",
    TAPTAP_SERVER_HOST: "127.0.0.1",
    TAPTAP_SERVER_PORT: String(port),
    TAPTAP_DATA_DIR: dirname(database.dbPath),
    TAPTAP_CRON_SECRET: internalSecret,
    TAPTAP_CORS_ORIGINS: "http://localhost:3000",
    TAPTAP_EMAIL_PROVIDER: "console",
    TAPTAP_EMAIL_FROM_ADDRESS: "noreply@test.com",
    TAPTAP_EMAIL_FROM_NAME: "Test",
    TAPTAP_QUEUE_BATCH_SIZE: "10",
    TAPTAP_QUEUE_MAX_ATTEMPTS: "3",
    LOG_LEVEL: "error",
  };
}
