import assert from "node:assert/strict";

export async function contracts({ url, database, mode, internalSecret }) {
  let passed = 0;
  async function check(name, operation) {
    await operation();
    passed++;
    console.info(`HTTP contract PASS: ${name}`);
  }
  async function request(path, options = {}) {
    const response = await fetch(url + path, {
      redirect: "manual",
      ...options,
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text.startsWith("{") ? JSON.parse(text) : null,
    };
  }
  const graphql = (query, variables) =>
    request("/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  const templateFields = "name subject bodyHtml bodyText createdAt updatedAt";
  const register = `mutation($input:RegisterEmailTemplateInput!){registerEmailTemplate(input:$input){${templateFields}}}`;
  const raw =
    "mutation($input:SendRawEmailInput!){sendRawEmail(input:$input){success error throttled}}";
  const send =
    "mutation($input:SendEmailInput!){sendEmail(input:$input){success error throttled}}";
  const recipient = {
    id: "contract-user",
    email: "user@example.test",
    name: "Name 東京",
  };
  await check("health endpoints", async () => {
    assert.deepEqual((await request("/health")).body, { status: "ok" });
    const response = await graphql("{health}");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { data: { health: "ok" } });
  });
  await check("GraphQL variables validated", async () => {
    const response = await graphql(raw, { input: { recipient } });
    assert.equal(response.status, 400);
    assert(response.body.errors.length > 0);
    assert.equal(response.body.errors[0].extensions.code, "BAD_USER_INPUT");
  });
  await check("GraphQL syntax and unknown fields", async () => {
    assert.equal((await graphql("{")).status, 400);
    assert.equal((await graphql("{unknown}")).status, 400);
  });
  await check("GraphQL GET query", async () => {
    const response = await request(
      "/graphql?query=" + encodeURIComponent("{health}"),
      { headers: { "apollo-require-preflight": "true" } },
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.data.health, "ok");
  });
  await check("GET mutations rejected", async () => {
    const response = await request(
      "/graphql?query=" +
        encodeURIComponent('mutation{deleteEmailTemplate(name:"none")}'),
      { headers: { "apollo-require-preflight": "true" } },
    );
    assert.equal(response.status, 405);
  });
  await check("introspection configuration", async () => {
    const response = await graphql("{__schema{queryType{name}}}");
    assert.equal(response.status, mode === "production" ? 400 : 200);
  });
  await check("template registration", async () => {
    const response = await graphql(register, {
      input: {
        name: "contract",
        subject: "Hello {{name}}",
        bodyHtml: "<p>{{name}} {{missing}}</p>",
        bodyText: "Text {{name}}",
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.errors, undefined);
    assert.equal(response.body.data.registerEmailTemplate.name, "contract");
    assert.match(
      response.body.data.registerEmailTemplate.createdAt,
      /\.\d{3}Z$/,
    );
  });
  await check("duplicate template error", async () => {
    const response = await graphql(register, {
      input: { name: "contract", subject: "x", bodyHtml: "h", bodyText: "t" },
    });
    assert.equal(response.status, 200);
    assert.match(response.body.errors[0].message, /already exists/);
    assert.equal(
      response.body.errors[0].extensions.code,
      "INTERNAL_SERVER_ERROR",
    );
    assert.equal(response.body.data, null);
  });
  await check("template read and order", async () => {
    await graphql(register, {
      input: { name: "aaa", subject: "x", bodyHtml: "h", bodyText: "t" },
    });
    const response = await graphql(
      `{emailTemplates{${templateFields}} emailTemplate(name:"missing"){name}}`,
    );
    assert.equal(response.body.errors, undefined);
    assert.deepEqual(
      response.body.data.emailTemplates.map((value) => value.name),
      ["aaa", "contract"],
    );
    assert.equal(response.body.data.emailTemplate, null);
  });
  await check("partial template updates and empty values", async () => {
    const response = await graphql(
      `mutation($input:UpdateEmailTemplateInput!){updateEmailTemplate(name:"contract",input:$input){${templateFields}}}`,
      { input: { bodyText: "", subject: null } },
    );
    assert.equal(response.body.errors, undefined);
    assert.equal(response.body.data.updateEmailTemplate.bodyText, "");
    assert.equal(
      response.body.data.updateEmailTemplate.subject,
      "Hello {{name}}",
    );
  });
  await check("missing template update", async () => {
    const response = await graphql(
      'mutation{updateEmailTemplate(name:"missing",input:{subject:"x"}){name}}',
    );
    assert.equal(response.status, 200);
    assert.match(response.body.errors[0].message, /not found/);
  });
  await check("rendered queue storage", async () => {
    const response = await graphql(send, {
      input: {
        template: "contract",
        recipient,
        variables: JSON.stringify({ name: "東京" }),
        category: "contract",
        metadata: '{"extra":1}',
      },
    });
    assert.deepEqual(response.body.data.sendEmail, {
      success: true,
      error: null,
      throttled: false,
    });
    const item = database.db
      .prepare("SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 1")
      .get();
    assert.match(item.id, /^[0-9a-f]{16}$/);
    assert.equal(item.template_name, "contract");
    assert.equal(item.subject, "Hello 東京");
    assert.equal(item.body_html, "<p>東京 </p>");
    assert.equal(item.body_text, "");
    assert.equal(item.category, "contract");
    assert.equal(item.metadata, '{"extra":1}');
    assert.equal(item.status, "pending");
    assert.equal(item.attempts, 0);
    assert.equal(item.last_error, null);
    assert.equal(item.sent_at, null);
  });
  await check("malformed variables fail without enqueueing", async () => {
    const before = database.db
      .prepare("SELECT COUNT(*) AS count FROM email_queue")
      .get().count;
    const response = await graphql(send, {
      input: { template: "contract", recipient, variables: "not-json" },
    });
    assert.equal(response.body.data.sendEmail.success, false);
    assert.equal(typeof response.body.data.sendEmail.error, "string");
    assert.equal(
      database.db.prepare("SELECT COUNT(*) AS count FROM email_queue").get()
        .count,
      before,
    );
  });
  await check("null variables fail without enqueueing", async () => {
    const before = database.db
      .prepare("SELECT COUNT(*) AS count FROM email_queue")
      .get().count;
    const response = await graphql(send, {
      input: { template: "contract", recipient, variables: "null" },
    });
    assert.equal(response.body.data.sendEmail.success, false);
    assert.equal(typeof response.body.data.sendEmail.error, "string");
    assert.equal(
      database.db.prepare("SELECT COUNT(*) AS count FROM email_queue").get()
        .count,
      before,
    );
  });
  await check("missing template send result", async () => {
    const response = await graphql(send, {
      input: { template: "missing", recipient },
    });
    assert.deepEqual(response.body.data.sendEmail, {
      success: false,
      error: 'Template "missing" not found',
      throttled: false,
    });
  });
  const input = {
    recipient,
    subject: "Raw subject",
    bodyHtml: "<b>Raw</b>",
    bodyText: "Raw",
    category: "raw",
    contextId: "context",
    throttleIntervalMs: 60000,
  };
  await check("raw delivery and shared throttle", async () => {
    assert.deepEqual((await graphql(raw, { input })).body.data.sendRawEmail, {
      success: true,
      error: null,
      throttled: false,
    });
    assert.deepEqual((await graphql(raw, { input })).body.data.sendRawEmail, {
      success: true,
      error: null,
      throttled: true,
    });
    const row = database.db
      .prepare("SELECT * FROM throttle WHERE id = ?")
      .get("email:raw:contract-user:context");
    assert.equal(row.category, "raw");
    assert.equal(row.context_id, "context");
    assert.match(row.last_sent_at, /\.\d{3}Z$/);
  });
  await check("throttle context isolation", async () => {
    assert.equal(
      (await graphql(raw, { input: { ...input, contextId: "other" } })).body
        .data.sendRawEmail.throttled,
      false,
    );
    assert.equal(
      (await graphql(raw, { input: { ...input, throttleIntervalMs: 0 } })).body
        .data.sendRawEmail.throttled,
      false,
    );
  });
  await check("cron authentication", async () => {
    assert.equal(
      (await request("/internal/cron/process-queue", { method: "POST" }))
        .status,
      401,
    );
    assert.equal(
      (
        await request("/internal/cron/process-queue", {
          method: "POST",
          headers: { authorization: "Bearer wrong" },
        })
      ).status,
      401,
    );
  });
  await check("queue processing through HTTP", async () => {
    const response = await request("/internal/cron/process-queue", {
      method: "POST",
      headers: { authorization: "Bearer " + internalSecret },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { processed: 4, sent: 4, failed: 0 });
    const items = database.db
      .prepare("SELECT status, attempts, sent_at FROM email_queue")
      .all();
    assert(
      items.every(
        (value) =>
          value.status === "sent" &&
          value.attempts === 1 &&
          value.sent_at !== null,
      ),
    );
    assert.deepEqual(
      (
        await request("/internal/cron/process-queue", {
          method: "POST",
          headers: { authorization: "Bearer " + internalSecret },
        })
      ).body,
      { processed: 0, sent: 0, failed: 0 },
    );
  });
  await check("template deletion", async () => {
    assert.equal(
      (await graphql('mutation{deleteEmailTemplate(name:"contract")}')).body
        .data.deleteEmailTemplate,
      true,
    );
    assert.equal(
      (await graphql('mutation{deleteEmailTemplate(name:"contract")}')).body
        .data.deleteEmailTemplate,
      false,
    );
  });
  await check("concurrent throttle requests enqueue once", async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        graphql(raw, { input: { ...input, contextId: "concurrent" } }),
      ),
    );
    const values = responses.map((response) => response.body.data.sendRawEmail);
    assert(values.every((value) => value.success));
    assert.equal(values.filter((value) => !value.throttled).length, 1);
    assert.equal(values.filter((value) => value.throttled).length, 7);
    assert.equal(
      database.db
        .prepare(
          "SELECT COUNT(*) AS count FROM email_queue WHERE subject = ? AND status = 'pending'",
        )
        .get("Raw subject").count,
      1,
    );
  });
  await check("oversized JSON body rejected", async () => {
    const response = await request("/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: "{health}",
        padding: "x".repeat(1024 * 1024),
      }),
    });
    assert.equal(response.status, 413);
  });
  return passed;
}
