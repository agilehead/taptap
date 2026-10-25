import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Knex changes cwd to this file. Both the selected application and migrations
// read workspace configuration and resolve relative data paths from that root.
const workspace = resolve(__dirname, "../..");
const environment = join(workspace, ".env");
if (existsSync(environment)) loadEnvFile(environment);
const dataDir = resolve(workspace, process.env.TAPTAP_DATA_DIR || "./data");

export default {
  client: "better-sqlite3",
  connection: {
    filename: join(dataDir, "taptap.db"),
  },
  useNullAsDefault: true,
  migrations: {
    directory: join(__dirname, "database", "taptap", "sqlite", "migrations"),
    extension: "js",
  },
  pool: {
    afterCreate: (conn, cb) => {
      conn.pragma("journal_mode = WAL");
      conn.pragma("foreign_keys = ON");
      cb();
    },
  },
};
