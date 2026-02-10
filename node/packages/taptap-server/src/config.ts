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
const emailProvider = optional("EMAIL_PROVIDER", "console") as
  | "console"
  | "smtp";

export const config = {
  isProduction,
  nodeEnv: optional("NODE_ENV", "development"),
  server: {
    host: required("TAPTAP_SERVER_HOST"),
    port: optionalInt("TAPTAP_SERVER_PORT", 5006),
  },
  data: { dir: required("TAPTAP_DATA_DIR") },
  logging: {
    level: optional("LOG_LEVEL", "info"),
    fileDir: process.env.TAPTAP_LOG_FILE_DIR,
  },
  cronSecret: required("CRON_SECRET"),
  cors: { origins: required("TAPTAP_CORS_ORIGINS").split(",") },
  email: {
    provider: emailProvider,
    from: {
      email: required("EMAIL_FROM_ADDRESS"),
      name: required("EMAIL_FROM_NAME"),
    },
    smtp: {
      host: emailProvider === "smtp" ? required("SMTP_HOST") : "",
      port: emailProvider === "smtp" ? optionalInt("SMTP_PORT", 587) : 587,
      secure:
        emailProvider === "smtp"
          ? optional("SMTP_SECURE", "false") === "true"
          : false,
      user: emailProvider === "smtp" ? required("SMTP_USER") : "",
      password: emailProvider === "smtp" ? required("SMTP_PASSWORD") : "",
    },
  },
  queue: {
    batchSize: optionalInt("QUEUE_BATCH_SIZE", 10),
    maxAttempts: optionalInt("QUEUE_MAX_ATTEMPTS", 3),
  },
};

export type Config = typeof config;
