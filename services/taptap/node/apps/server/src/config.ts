import { join } from "path";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    console.error(`ERROR: Required environment variable ${name} is not set`);
    process.exit(1);
  }
  return value;
}

function optional(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value !== undefined && value !== "" ? value : defaultValue;
}

function optionalInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  return value !== undefined && value !== ""
    ? parseInt(value, 10)
    : defaultValue;
}

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
const emailProvider = optional("TAPTAP_EMAIL_PROVIDER", "console") as
  | "console"
  | "smtp";

const dataDir = required("TAPTAP_DATA_DIR");

export const config = {
  isProduction,
  isTest,
  nodeEnv: optional("NODE_ENV", "development"),
  server: {
    host: required("TAPTAP_SERVER_HOST"),
    port: optionalInt("TAPTAP_SERVER_PORT", 5006),
  },
  db: {
    dataDir,
    dbPath: join(dataDir, "taptap.db"),
  },
  logging: {
    level: optional("LOG_LEVEL", "info"),
    fileDir: process.env.TAPTAP_LOG_FILE_DIR,
  },
  cronSecret: required("TAPTAP_CRON_SECRET"),
  cors: {
    origins: required("TAPTAP_CORS_ORIGINS")
      .split(",")
      .map((o) => o.trim()),
  },
  email: {
    provider: emailProvider,
    from: {
      email: required("TAPTAP_EMAIL_FROM_ADDRESS"),
      name: required("TAPTAP_EMAIL_FROM_NAME"),
    },
    smtp: {
      host: emailProvider === "smtp" ? required("TAPTAP_SMTP_HOST") : "",
      port:
        emailProvider === "smtp" ? optionalInt("TAPTAP_SMTP_PORT", 587) : 587,
      secure:
        emailProvider === "smtp"
          ? optional("TAPTAP_SMTP_SECURE", "false") === "true"
          : false,
      user: emailProvider === "smtp" ? required("TAPTAP_SMTP_USER") : "",
      password:
        emailProvider === "smtp" ? required("TAPTAP_SMTP_PASSWORD") : "",
    },
  },
  queue: {
    batchSize: optionalInt("TAPTAP_QUEUE_BATCH_SIZE", 10),
    maxAttempts: optionalInt("TAPTAP_QUEUE_MAX_ATTEMPTS", 3),
  },
};

export type Config = typeof config;
