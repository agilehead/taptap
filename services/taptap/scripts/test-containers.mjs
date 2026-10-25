import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServer } from "node:net";
import {
  createTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
  truncateAllTables,
} from "../node/packages/taptap-test-utils/dist/index.js";
import { repository, run } from "./runtime-targets.mjs";
import { contracts } from "../tests/contracts/http.mjs";
import {
  environment,
  modes,
  secret,
  internalSecret,
} from "../tests/contracts/fixture.mjs";

const selection =
  process.argv[2] ?? process.env.TAPTAP_DOTNET_CONTAINER_TARGET ?? "all";
assert(
  ["all", "nativeaot", "managed", "node"].includes(selection),
  "Choose all, nativeaot, managed or node",
);
const variants = selection === "all" ? ["node", "managed", "nativeaot"] : [selection];
const migrationImage = "taptap-migrations:acceptance";
const docker = (args, env = process.env) =>
  execFileSync("docker", args, {
    cwd: repository,
    env,
    encoding: "utf8",
  }).trim();
function storedRows(database) {
  return database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all().map(({ name }) => [name,
    database.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(row => JSON.stringify(row)).sort(),
  ]);
}
async function freePort() {
  const socket = createServer();
  await new Promise((resolve, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", resolve);
  });
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}
await run([
  "docker",
  "build",
  "-f",
  "services/taptap/database/Dockerfile",
  "--target",
  "migrations",
  "-t",
  migrationImage,
  ".",
]);
let total = 0;
for (const variant of variants) {
  const image = `taptap:acceptance-${variant}`;
  await run([
    "docker",
    "build",
    "-f",
    variant === "node" ? "services/taptap/node/Dockerfile" : "services/taptap/csharp/Dockerfile",
    "--target",
    variant === "node" ? "production" : variant,
    "-t",
    image,
    ".",
  ]);
  let passed = 0;
  for (const mode of modes) {
    const database = createTestDatabase();
    const port = await freePort(),
      url = `http://127.0.0.1:${port}`;
    const fixture = environment(port, database, mode);
    const logs = join(database.testDir, "logs");
    mkdirSync(logs);
    const envFile = join(database.testDir, "container.env");
    writeFileSync(
      envFile,
      Object.entries(fixture)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n") + "\n",
    );
    const env = {
      ...process.env,
      NODE_ENV: fixture.NODE_ENV,
      TAPTAP_IMAGE: image,
      TAPTAP_MIGRATIONS_IMAGE: migrationImage,
      TAPTAP_TEST_PORT: String(port),
      TAPTAP_DATA_HOST_DIR: dirname(database.dbPath),
      TAPTAP_LOG_HOST_DIR: logs,
      ENV_FILE: envFile,
    };
    const compose = [
      "compose",
      "-p",
      `taptap-acceptance-${process.pid}-${variant}-${mode}`,
      "-f",
      "services/taptap/docker/development/docker-compose.yml",
    ];
    if (variant === "node") {
      const override = join(database.testDir, "node-health.json");
      writeFileSync(override, JSON.stringify({ services: { taptap: { healthcheck: { test: ["CMD", "node", "-e", "require('http').get('http://localhost:5006/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"] } } } }));
      compose.push("-f", override);
    }
    let initialized = false;
    try {
      await run(["docker", ...compose, "run", "--rm", "taptap-migrations"], {
        env,
      });
      const migrated = new Database(database.dbPath, { readonly: true, fileMustExist: true });
      try {
        assert.deepEqual(migrated.prepare("SELECT name FROM knex_migrations ORDER BY name").all().map(row => row.name),
          readdirSync(join(repository, "services/taptap/database/taptap/sqlite/migrations")).filter(name => name.endsWith(".js")).sort(),
          "The migration image creates the schema in the actual mounted application database");
      } finally { migrated.close(); }
      await setupTestDatabase(database);
      initialized = true;
      await database.knex.destroy();
      database.knex = null;
      const schema = database.db
        .prepare(
          "SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY name",
        )
        .all();
      database.db.pragma("journal_mode = DELETE");
      await run(
        [
          "docker",
          ...compose,
          "up",
          "-d",
          "--wait",
          "--wait-timeout",
          "90",
          "taptap",
        ],
        { env },
      );
      const container = docker([...compose, "ps", "-q", "taptap"], env);
      assert(container);
      assert.equal(
        docker(["inspect", "--format", "{{.State.Health.Status}}", container]),
        "healthy",
      );
      if (variant !== "node") {
      docker(["exec", container, "/app/taptap", "health"]);
      docker([
        "exec",
        container,
        "/bin/sh",
        "-c",
        "if command -v node; then exit 1; fi",
      ]);
      }
      if (variant === "nativeaot") {
        docker([
          "exec",
          container,
          "/bin/sh",
          "-c",
          "if command -v dotnet; then exit 1; fi",
        ]);
        assert.equal(
          docker([
            "exec",
            container,
            "od",
            "-An",
            "-tx1",
            "-N4",
            "/app/taptap",
          ]).replaceAll(/\s/g, ""),
          "7f454c46",
        );
      }
      const inspect = new Database(database.dbPath, { readonly: true });
      try {
        assert.equal(
          inspect.pragma("journal_mode", { simple: true }),
          "wal",
          "A new connection observes runtime-owned WAL initialization",
        );
      } finally {
        inspect.close();
      }
      if (mode === modes[0]) {
        await run(
          ["npm", "run", "test", "--workspace", "@agilehead/taptap-server"],
          {
            env: {
              ...process.env,
              ...fixture,
              TEST_URL: url,
              TEST_DB_PATH: database.dbPath,
              TEST_CRON_SECRET: internalSecret,
            },
          },
        );
        truncateAllTables(database);
      }
      passed += await contracts({
        url,
        database,
        mode,
        secret,
        internalSecret,
      });
      assert.deepEqual(
        database.db
          .prepare(
            "SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY name",
          )
          .all(),
        schema,
        "Container startup and operations must preserve the Knex schema",
      );
      await run(["docker", ...compose, "stop", "-t", "15", "taptap"], { env });
      assert.equal(
        docker(["inspect", "--format", "{{.State.ExitCode}}", container]),
        "0",
        "Container shuts down cleanly",
      );
      const persisted = storedRows(database.db);
      await run(["docker", ...compose, "run", "--rm", "taptap-migrations"], { env });
      assert.deepEqual(storedRows(database.db), persisted, "Re-running the migration image preserves every existing row and migration record");
      assert.deepEqual(database.db.prepare("SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY name").all(), schema,
        "Re-running the migration image preserves the complete schema");
    } catch (error) {
      await run(["docker", ...compose, "logs", "--tail", "100"], { env });
      throw error;
    } finally {
      await run(["docker", ...compose, "down", "--remove-orphans"], { env });
      if (initialized) await teardownTestDatabase(database);
    }
  }
  await run([
    process.execPath,
    "services/taptap/scripts/test-smtp.mjs",
    "container-" + variant,
  ]);
  total += passed;
  console.info(
    `taptap Docker ${variant}: ${passed} shared HTTP contract cases passed; healthy and clean shutdown; ${variant === "node" ? "explicit Node comparison image" : "no Node in the application image"}`,
  );
}
console.info(`taptap Docker: ${total} shared HTTP contract cases passed`);
