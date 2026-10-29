import assert from "node:assert/strict";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { networkInterfaces } from "node:os";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import {
  createTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "../node/packages/taptap-test-utils/dist/index.js";
import { command, ready, repository, run, stop } from "./runtime-targets.mjs";
import { environment } from "../tests/contracts/fixture.mjs";
import { smtpFixture } from "../tests/contracts/smtp-fixture.mjs";

const selected = process.argv[2] ?? "all";
assert(
  [
    "all",
    "csharp",
    "nativeaot",
    "container-managed",
    "container-nativeaot",
  ].includes(selected),
);
const targets = selected === "all" ? ["csharp", "nativeaot"] : [selected];
function mime(raw) {
  const result = spawnSync(
    "python3",
    [
      "-c",
      `import sys,json,email.policy,email.parser
m=email.parser.BytesParser(policy=email.policy.default).parsebytes(sys.stdin.buffer.read())
print(json.dumps(dict(subject=str(m['Subject']),from_address=str(m['From']),to=str(m['To']),reply_to=str(m['Reply-To']),html=m.get_body(preferencelist=('html',)).get_content(),text=m.get_body(preferencelist=('plain',)).get_content())))`,
    ],
    { input: raw, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
async function freePort() {
  const socket = createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}
let cases = 0;
for (const target of targets)
  for (const mode of ["plain", "starttls", "tls"]) {
    const containerVariant = target.startsWith("container-")
      ? target.slice("container-".length)
      : null;
    const implementation =
      containerVariant === null
        ? target
        : containerVariant === "managed"
          ? "csharp"
          : "nativeaot";
    const smtpHost =
      containerVariant === null
        ? "127.0.0.1"
        : Object.values(networkInterfaces())
            .flat()
            .find((value) => value?.family === "IPv4" && !value.internal)
            ?.address;
    assert(
      smtpHost,
      "Container SMTP acceptance needs a reachable host IPv4 address",
    );
    const database = createTestDatabase();
    await setupTestDatabase(database);
    const certPath = join(database.testDir, "smtp.crt"),
      keyPath = join(database.testDir, "smtp.key");
    await run([
      "openssl",
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-days",
      "1",
      "-subj",
      "/CN=localhost",
      "-addext",
      `subjectAltName=DNS:localhost,IP:127.0.0.1,IP:${smtpHost}`,
      "-keyout",
      keyPath,
      "-out",
      certPath,
    ]);
    const fixture = await smtpFixture({
      mode,
      host: containerVariant === null ? "127.0.0.1" : "0.0.0.0",
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    });
    let server, container;
    try {
      const port = await freePort(),
        url = `http://127.0.0.1:${port}`;
      const env = {
        ...process.env,
        ...environment(port, database, "single"),
        NODE_EXTRA_CA_CERTS: certPath,
        SSL_CERT_FILE: certPath,
        TAPTAP_EMAIL_PROVIDER: "smtp",
        TAPTAP_SMTP_HOST: smtpHost,
        TAPTAP_SMTP_PORT: String(fixture.port),
        TAPTAP_SMTP_SECURE: String(mode === "tls"),
        TAPTAP_SMTP_USER: "test-user",
        TAPTAP_SMTP_PASSWORD: "test-password",
      };
      if (containerVariant !== null) {
        const image = `taptap:acceptance-${containerVariant}`;
        const containerEnv = {
          ...environment(5006, database, "single"),
          TAPTAP_SERVER_HOST: "0.0.0.0",
          TAPTAP_DATA_DIR: "/fixtures/db",
          TAPTAP_EMAIL_PROVIDER: "smtp",
          TAPTAP_SMTP_HOST: smtpHost,
          TAPTAP_SMTP_PORT: String(fixture.port),
          TAPTAP_SMTP_SECURE: String(mode === "tls"),
          TAPTAP_SMTP_USER: "test-user",
          TAPTAP_SMTP_PASSWORD: "test-password",
          SSL_CERT_FILE: "/fixtures/smtp.crt",
          NODE_EXTRA_CA_CERTS: "/fixtures/smtp.crt",
        };
        container = `taptap-smtp-${process.pid}-${containerVariant}-${mode}`;
        execFileSync(
          "docker",
          [
            "run",
            "--rm",
            "-d",
            "--name",
            container,
            "--memory",
            "2g",
            "--memory-swap",
            "2g",
            "--cpus",
            "2",
            "--pids-limit",
            "256",
            "-p",
            `127.0.0.1:${port}:5006`,
            "-v",
            `${database.testDir}:/fixtures`,
            ...Object.entries(containerEnv).flatMap(([key, value]) => [
              "-e",
              `${key}=${value}`,
            ]),
            image,
          ],
          { stdio: "pipe" },
        );
        await ready(null, url);
      } else {
        const command_ = command(target);
        server = spawn(command_[0], command_.slice(1), {
          cwd: repository,
          env,
          stdio: "inherit",
        });
        await ready(server, url);
      }
      const response = await fetch(url + "/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query:
            "mutation($input:SendRawEmailInput!){sendRawEmail(input:$input){success error throttled}}",
          variables: {
            input: {
              recipient: {
                id: "smtp-user",
                email: "to@example.test",
                name: "To 東京",
              },
              subject: "Subject 東京",
              bodyHtml: "<p>HTML 東京</p>",
              bodyText: "Text 東京",
            },
          },
        }),
      });
      assert.equal((await response.json()).data.sendRawEmail.success, true);
      const processQueue = async () =>
        (
          await fetch(url + "/internal/cron/process-queue", {
            method: "POST",
            headers: { authorization: "Bearer test-cron-secret" },
          })
        ).json();
      assert.deepEqual(await processQueue(), {
        processed: 1,
        sent: 0,
        failed: 1,
      });
      assert.deepEqual(await processQueue(), {
        processed: 1,
        sent: 1,
        failed: 0,
      });
      assert.deepEqual(await processQueue(), {
        processed: 0,
        sent: 0,
        failed: 0,
      });
      const row = database.db.prepare("SELECT * FROM email_queue").get();
      assert.equal(row.status, "sent");
      assert.equal(row.attempts, 1);
      assert.match(row.last_error, /fixture rejection/);
      assert(row.sent_at);
      assert.equal(fixture.messages.length, 2);
      assert.equal(fixture.authentications.length, 2);
      assert(fixture.authentications.every((value) => value.valid));
      const message = mime(fixture.messages.at(-1));
      assert.equal(message.subject, "Subject 東京");
      assert.match(message.from_address, /noreply@test.com/);
      assert.match(message.to, /To 東京/);
      assert.equal(message.html.trimEnd(), "<p>HTML 東京</p>");
      assert.equal(message.text.trimEnd(), "Text 東京");
      cases++;
      const probe = [...command(implementation, "ContractProbe"), "smtp"];
      await run(
        [...probe, "127.0.0.1", String(fixture.port), String(mode === "tls")],
        { env },
      );
      const direct = mime(fixture.messages.at(-1));
      assert.match(direct.from_address, /From 東京/);
      assert.match(direct.to, /second@example.test/);
      assert.match(direct.reply_to, /reply@example.test/);
      assert.equal(direct.subject, "Subject 東京");
      assert.equal(direct.html.trimEnd(), "<p>HTML 東京</p>");
      assert.equal(direct.text.trimEnd(), "Text 東京");
      assert.equal(fixture.authentications.length, 3);
      assert(
        fixture.envelopes.some((line) =>
          /RCPT TO:<second@example.test>/i.test(line),
        ),
      );
      assert(
        fixture.envelopes.some((line) =>
          /MAIL FROM:<from@example.test>/i.test(line),
        ),
      );
      cases++;
      const held = fixture.deferNext();
      const enqueue = await fetch(url + "/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query:
            "mutation($input:SendRawEmailInput!){sendRawEmail(input:$input){success}}",
          variables: {
            input: {
              recipient: {
                id: "disconnected-user",
                email: "disconnected@example.test",
                name: "Disconnected",
              },
              subject: "Continue after disconnect",
              bodyHtml: "html",
              bodyText: "text",
            },
          },
        }),
      });
      assert.equal((await enqueue.json()).data.sendRawEmail.success, true);
      const client = httpRequest(url + "/internal/cron/process-queue", {
        method: "POST",
        headers: { authorization: "Bearer test-cron-secret" },
      });
      client.on("error", (error) => {
        assert.equal(error.code, "ECONNRESET");
      });
      client.end();
      let deadline;
      try {
        await Promise.race([
          held.arrived,
          new Promise((_, reject) => {
            deadline = setTimeout(
              () =>
                reject(
                  new Error("SMTP disconnect fixture did not receive DATA"),
                ),
              10000,
            );
          }),
        ]);
        client.destroy();
        await new Promise((resolve) => setTimeout(resolve, 100));
      } finally {
        clearTimeout(deadline);
        held.release();
      }
      for (
        let attempt = 0;
        attempt < 100 &&
        database.db
          .prepare("SELECT status FROM email_queue WHERE recipient_id = ?")
          .get("disconnected-user").status !== "sent";
        attempt++
      )
        await new Promise((resolve) => setTimeout(resolve, 20));
      assert.equal(
        database.db
          .prepare("SELECT status FROM email_queue WHERE recipient_id = ?")
          .get("disconnected-user").status,
        "sent",
      );
      assert.equal(
        fixture.messages.length,
        4,
        "Disconnect must not cancel or duplicate delivery",
      );
      assert.deepEqual(await processQueue(), {
        processed: 0,
        sent: 0,
        failed: 0,
      });
      cases++;
      fixture.rejectNextQuit();
      await run(
        [...probe, "127.0.0.1", String(fixture.port), String(mode === "tls")],
        { env },
      );
      assert.equal(
        fixture.messages.length,
        5,
        "An accepted message remains successful when QUIT fails",
      );
      cases++;
      await run(
        [
          ...probe,
          "127.0.0.1",
          String(fixture.port),
          String(mode === "tls"),
          "reject-auth",
        ],
        { env },
      );
      assert.equal(
        fixture.messages.length,
        5,
        "Rejected credentials cannot deliver a message",
      );
      assert(fixture.authentications.some((value) => !value.valid));
      cases++;
      if (mode !== "plain") {
        const untrusted = { ...env };
        delete untrusted.SSL_CERT_FILE;
        delete untrusted.NODE_EXTRA_CA_CERTS;
        await run(
          [
            ...probe,
            "127.0.0.1",
            String(fixture.port),
            String(mode === "tls"),
            "reject-certificate",
          ],
          { env: untrusted },
        );
        assert.equal(
          fixture.messages.length,
          5,
          "Untrusted TLS cannot deliver a message",
        );
        cases++;
      }
      console.info(
        `SMTP PASS ${target}/${mode}: authenticated delivery, rejection, retry, Unicode MIME, multiple recipients, reply-to and caller disconnect`,
      );
    } finally {
      if (container) {
        await run(["docker", "logs", "--tail", "30", container]);
        await run(["docker", "stop", "-t", "15", container]);
      }
      if (server) await stop(server);
      await fixture.close();
      await teardownTestDatabase(database);
    }
  }
console.info(`SMTP: ${cases} delivery/provider contract cases passed`);
