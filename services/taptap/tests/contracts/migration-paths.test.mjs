import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import knex from "knex";

const repository = fileURLToPath(new URL("../../../..", import.meta.url));
const configuration = new URL("../../knexfile.taptap.mjs", import.meta.url)
  .href;
const anchor = repository;
for (const [name, setting, directory] of [
  ["default", "", resolve(anchor, "data")],
  ["relative", "local-fixture", resolve(anchor, "local-fixture")],
  [
    "absolute",
    resolve(tmpdir(), "taptap-path-fixture"),
    resolve(tmpdir(), "taptap-path-fixture"),
  ],
])
  test(`Knex ${name} data path matches the application workspace`, () => {
    const actual = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `const { default: exported } = await import(${JSON.stringify(configuration)}); const config = exported.test ?? exported; process.stdout.write(JSON.stringify({ database: config.connection.filename, migrations: config.migrations.directory }));`,
        ],
        {
          cwd: resolve(repository, "services/taptap"),
          env: { ...process.env, TAPTAP_DATA_DIR: setting },
          encoding: "utf8",
        },
      ),
    );
    assert.equal(actual.database, resolve(directory, "taptap.db"));
    assert.equal(
      actual.migrations,
      resolve(repository, "services/taptap/database/taptap/sqlite/migrations"),
    );
  });

test("delivery leases preserve the populated queue and account for interrupted sends", async () => {
  const database = knex({
    client: "better-sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
    migrations: {
      directory: resolve(
        repository,
        "services/taptap/database/taptap/sqlite/migrations",
      ),
    },
  });
  try {
    await database.migrate.up({ name: "20260210000001_initial_schema.js" });
    const original = ["pending", "sending", "sent", "failed"].map((status) => ({
      id: status,
      status,
      template_name: null,
      recipient_id: "recipient",
      recipient_email: "recipient@example.test",
      recipient_name: "Recipient 東京",
      subject: "Preserved",
      body_html: "<p>Preserved</p>",
      body_text: "Preserved",
      category: "fixture",
      metadata: '{"keep":true}',
      attempts: 2,
      last_error: status === "failed" ? "Original error" : null,
      created_at: "2026-10-29T00:00:00.000Z",
      sent_at: status === "sent" ? "2026-10-29T01:00:00.000Z" : null,
    }));
    await database("email_queue").insert(original);
    await database.migrate.latest();
    const rows = await database("email_queue").orderBy("id");
    for (const row of rows) {
      const before = original.find((item) => item.id === row.id);
      assert.deepEqual(row, {
        ...before,
        lease_owner: null,
        lease_until: row.status === "sending" ? 0 : null,
        ...(row.status === "sending"
          ? {
              attempts: 3,
              last_error:
                "Delivery interrupted before lease migration; acceptance unknown",
            }
          : {}),
      });
    }
    assert.equal(rows.length, original.length);
    assert.deepEqual((await database.migrate.latest())[1], []);
    assert.deepEqual(await database("email_queue").orderBy("id"), rows);
  } finally {
    await database.destroy();
  }
});
