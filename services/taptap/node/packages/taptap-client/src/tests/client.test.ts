import { describe, it, beforeEach, afterEach } from "node:test";
import { expect } from "chai";
import { createTapTapClient, createNoOpTapTapClient } from "../client.js";
import type { TapTapConfig, EmailTemplate, SendResult } from "../types.js";

type FetchCall = { url: string; init: RequestInit };

function first<T>(values: readonly T[]): T {
  const value = values[0];
  if (value === undefined) throw new Error("Expected at least one item");
  return value;
}

void describe("TapTapClient", () => {
  let fetchCalls: FetchCall[];
  let fetchResponse: { status: number; body: unknown };
  const originalFetch = globalThis.fetch;

  const config: TapTapConfig = {
    endpoint: "http://localhost:5006",
  };

  const sampleTemplate: EmailTemplate = {
    name: "welcome",
    subject: "Welcome!",
    bodyHtml: "<h1>Welcome</h1>",
    bodyText: "Welcome",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  beforeEach(() => {
    fetchCalls = [];
    fetchResponse = { status: 200, body: {} };
    globalThis.fetch = async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      fetchCalls.push({
        url:
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
        init: init ?? {},
      });
      return new Response(JSON.stringify(fetchResponse.body), {
        status: fetchResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  void describe("createTapTapClient", () => {
    void describe("getEmailTemplate", () => {
      void it("should fetch a template by name", async () => {
        fetchResponse = {
          status: 200,
          body: { data: { emailTemplate: sampleTemplate } },
        };

        const client = createTapTapClient(config);
        const result = await client.getEmailTemplate("welcome");

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data).to.not.equal(null);
          if (result.data === null) throw new Error("Expected a template");
          expect(result.data.name).to.equal("welcome");
          expect(result.data.subject).to.equal("Welcome!");
        }

        expect(fetchCalls).to.have.length(1);
        const call = first(fetchCalls);
        expect(call.url).to.equal("http://localhost:5006/graphql");

        const body = JSON.parse(call.init.body as string) as {
          query: string;
          variables: { name: string };
        };
        expect(body.variables.name).to.equal("welcome");
        expect(body.query).to.include("emailTemplate(");
      });

      void it("should return null for non-existent template", async () => {
        fetchResponse = {
          status: 200,
          body: { data: { emailTemplate: null } },
        };

        const client = createTapTapClient(config);
        const result = await client.getEmailTemplate("missing");

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data).to.equal(null);
        }
      });
    });

    void describe("listEmailTemplates", () => {
      void it("should list all templates", async () => {
        fetchResponse = {
          status: 200,
          body: { data: { emailTemplates: [sampleTemplate] } },
        };

        const client = createTapTapClient(config);
        const result = await client.listEmailTemplates();

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data).to.have.length(1);
          expect(first(result.data).name).to.equal("welcome");
        }
      });
    });

    void describe("registerEmailTemplate", () => {
      void it("should register a new template", async () => {
        fetchResponse = {
          status: 200,
          body: { data: { registerEmailTemplate: sampleTemplate } },
        };

        const client = createTapTapClient(config);
        const result = await client.registerEmailTemplate({
          name: "welcome",
          subject: "Welcome!",
          bodyHtml: "<h1>Welcome</h1>",
          bodyText: "Welcome",
        });

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data.name).to.equal("welcome");
        }

        const body = JSON.parse(first(fetchCalls).init.body as string) as {
          query: string;
          variables: { input: { name: string } };
        };
        expect(body.variables.input.name).to.equal("welcome");
        expect(body.query).to.include("registerEmailTemplate(");
      });
    });

    void describe("updateEmailTemplate", () => {
      void it("should update a template", async () => {
        const updated = { ...sampleTemplate, subject: "Updated!" };
        fetchResponse = {
          status: 200,
          body: { data: { updateEmailTemplate: updated } },
        };

        const client = createTapTapClient(config);
        const result = await client.updateEmailTemplate("welcome", {
          subject: "Updated!",
        });

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data.subject).to.equal("Updated!");
        }

        const body = JSON.parse(first(fetchCalls).init.body as string) as {
          variables: { name: string; input: { subject: string } };
        };
        expect(body.variables.name).to.equal("welcome");
        expect(body.variables.input.subject).to.equal("Updated!");
      });
    });

    void describe("deleteEmailTemplate", () => {
      void it("should delete a template", async () => {
        fetchResponse = {
          status: 200,
          body: { data: { deleteEmailTemplate: true } },
        };

        const client = createTapTapClient(config);
        const result = await client.deleteEmailTemplate("welcome");

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data).to.equal(true);
        }

        const body = JSON.parse(first(fetchCalls).init.body as string) as {
          variables: { name: string };
        };
        expect(body.variables.name).to.equal("welcome");
      });
    });

    void describe("sendEmail", () => {
      void it("should send an email using a template", async () => {
        const sendResult: SendResult = {
          success: true,
          throttled: false,
        };
        fetchResponse = {
          status: 200,
          body: { data: { sendEmail: sendResult } },
        };

        const client = createTapTapClient(config);
        const result = await client.sendEmail({
          template: "welcome",
          recipient: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
          },
          variables: JSON.stringify({ userName: "Test" }),
          category: "onboarding",
          contextId: "user-1",
          throttleIntervalMs: 60000,
        });

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data.success).to.equal(true);
          expect(result.data.throttled).to.equal(false);
        }

        const body = JSON.parse(first(fetchCalls).init.body as string) as {
          query: string;
          variables: {
            input: {
              template: string;
              recipient: { email: string };
              category: string;
            };
          };
        };
        expect(body.variables.input.template).to.equal("welcome");
        expect(body.variables.input.recipient.email).to.equal(
          "test@example.com",
        );
        expect(body.variables.input.category).to.equal("onboarding");
      });

      void it("should handle throttled response", async () => {
        const sendResult: SendResult = {
          success: true,
          throttled: true,
        };
        fetchResponse = {
          status: 200,
          body: { data: { sendEmail: sendResult } },
        };

        const client = createTapTapClient(config);
        const result = await client.sendEmail({
          template: "welcome",
          recipient: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
          },
        });

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data.throttled).to.equal(true);
        }
      });
    });

    void describe("sendRawEmail", () => {
      void it("should send a raw email", async () => {
        const sendResult: SendResult = {
          success: true,
          throttled: false,
        };
        fetchResponse = {
          status: 200,
          body: { data: { sendRawEmail: sendResult } },
        };

        const client = createTapTapClient(config);
        const result = await client.sendRawEmail({
          recipient: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
          },
          subject: "Hello",
          bodyHtml: "<p>Hello</p>",
          bodyText: "Hello",
        });

        expect(result.success).to.equal(true);
        if (result.success) {
          expect(result.data.success).to.equal(true);
        }

        const body = JSON.parse(first(fetchCalls).init.body as string) as {
          query: string;
          variables: {
            input: { subject: string; recipient: { email: string } };
          };
        };
        expect(body.variables.input.subject).to.equal("Hello");
        expect(body.query).to.include("sendRawEmail(");
      });
    });

    void describe("error handling", () => {
      void it("should return failure on HTTP error", async () => {
        fetchResponse = { status: 500, body: "Internal Server Error" };

        const client = createTapTapClient(config);
        const result = await client.getEmailTemplate("welcome");

        expect(result.success).to.equal(false);
        if (!result.success) {
          expect(result.error.message).to.include("500");
        }
      });

      void it("should return failure on GraphQL error", async () => {
        fetchResponse = {
          status: 200,
          body: {
            errors: [{ message: "Template not found" }],
            data: null,
          },
        };

        const client = createTapTapClient(config);
        const result = await client.registerEmailTemplate({
          name: "bad",
          subject: "x",
          bodyHtml: "x",
          bodyText: "x",
        });

        expect(result.success).to.equal(false);
        if (!result.success) {
          expect(result.error.message).to.include("Template not found");
        }
      });

      void it("should return failure on network error", async () => {
        globalThis.fetch = () => {
          return Promise.reject(new Error("Connection refused"));
        };

        const client = createTapTapClient(config);
        const result = await client.sendEmail({
          template: "welcome",
          recipient: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
          },
        });

        expect(result.success).to.equal(false);
        if (!result.success) {
          expect(result.error.message).to.include("Connection refused");
        }
      });
    });

    void describe("endpoint normalization", () => {
      void it("should strip trailing slash from endpoint", async () => {
        fetchResponse = {
          status: 200,
          body: { data: { emailTemplates: [] } },
        };

        const client = createTapTapClient({
          endpoint: "http://localhost:5006/",
        });
        await client.listEmailTemplates();

        expect(first(fetchCalls).url).to.equal("http://localhost:5006/graphql");
      });
    });
  });

  void describe("createNoOpTapTapClient", () => {
    void it("should return null for getEmailTemplate", async () => {
      const client = createNoOpTapTapClient();
      const result = await client.getEmailTemplate("welcome");

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.data).to.equal(null);
      }
    });

    void it("should return empty array for listEmailTemplates", async () => {
      const client = createNoOpTapTapClient();
      const result = await client.listEmailTemplates();

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.data).to.deep.equal([]);
      }
    });

    void it("should return failure for write operations", async () => {
      const client = createNoOpTapTapClient();

      const register = await client.registerEmailTemplate({
        name: "test",
        subject: "x",
        bodyHtml: "x",
        bodyText: "x",
      });
      expect(register.success).to.equal(false);

      const update = await client.updateEmailTemplate("test", {
        subject: "y",
      });
      expect(update.success).to.equal(false);

      const del = await client.deleteEmailTemplate("test");
      expect(del.success).to.equal(false);

      const send = await client.sendEmail({
        template: "test",
        recipient: { id: "u", email: "e", name: "n" },
      });
      expect(send.success).to.equal(false);

      const sendRaw = await client.sendRawEmail({
        recipient: { id: "u", email: "e", name: "n" },
        subject: "x",
        bodyHtml: "x",
        bodyText: "x",
      });
      expect(sendRaw.success).to.equal(false);
    });

    void it("should log warnings when logger provided", async () => {
      const warnings: unknown[][] = [];
      const logger = {
        debug: () => undefined,
        info: () => undefined,
        warn: (...args: unknown[]) => {
          warnings.push(args);
        },
        error: () => undefined,
      };

      const client = createNoOpTapTapClient(logger);
      await client.getEmailTemplate("welcome");
      await client.sendEmail({
        template: "test",
        recipient: { id: "u", email: "e", name: "n" },
      });

      expect(warnings).to.have.length(2);
      expect(first(warnings)[0]).to.include("not configured");
      expect(first(warnings.slice(1))[0]).to.include("not configured");
    });
  });
});
