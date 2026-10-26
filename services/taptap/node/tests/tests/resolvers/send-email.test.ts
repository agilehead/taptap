import { expect } from "chai";
import { graphqlUrl, truncateEmailQueue, queueRepo } from "../../setup.js";
import { SEND_EMAIL, REGISTER_EMAIL_TEMPLATE } from "../../graphql/operations/emails.js";

type SendResult = {
  sendEmail: {
    success: boolean;
    error: string | null;
    throttled: boolean;
  };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return (await response.json()) as GraphQLResponse<T>;
}

describe("sendEmail Mutation (template-based)", () => {
  beforeEach(async () => {
    truncateEmailQueue();
    // Register a test template
    await gql(REGISTER_EMAIL_TEMPLATE, {
      input: {
        name: "test-welcome",
        subject: "Welcome {{name}}!",
        bodyHtml: "<p>Hello {{name}}, welcome to {{appName}}!</p>",
        bodyText: "Hello {{name}}, welcome to {{appName}}!",
      },
    });
  });

  it("should send an email using a template", async () => {
    const result = await gql<SendResult>(SEND_EMAIL, {
      input: {
        template: "test-welcome",
        recipient: { id: "user-1", email: "user@test.com", name: "Test User" },
        variables: JSON.stringify({ name: "Alice", appName: "TestApp" }),
      },
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendEmail.success).to.equal(true);
    expect(result.data?.sendEmail.throttled).to.equal(false);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.subject).to.equal("Welcome Alice!");
    expect(pending[0]?.bodyHtml).to.equal("<p>Hello Alice, welcome to TestApp!</p>");
    expect(pending[0]?.bodyText).to.equal("Hello Alice, welcome to TestApp!");
    expect(pending[0]?.templateName).to.equal("test-welcome");
  });

  it("should return error for non-existent template", async () => {
    const result = await gql<SendResult>(SEND_EMAIL, {
      input: {
        template: "non-existent",
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
      },
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendEmail.success).to.equal(false);
    expect(result.data?.sendEmail.error).to.include("not found");
  });

  it("should throttle duplicate emails", async () => {
    const first = await gql<SendResult>(SEND_EMAIL, {
      input: {
        template: "test-welcome",
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        variables: JSON.stringify({ name: "Alice", appName: "App" }),
        category: "welcome",
        contextId: "signup-1",
        throttleIntervalMs: 60000,
      },
    });

    expect(first.data?.sendEmail.success).to.equal(true);
    expect(first.data?.sendEmail.throttled).to.equal(false);

    const second = await gql<SendResult>(SEND_EMAIL, {
      input: {
        template: "test-welcome",
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        variables: JSON.stringify({ name: "Alice", appName: "App" }),
        category: "welcome",
        contextId: "signup-1",
        throttleIntervalMs: 60000,
      },
    });

    expect(second.data?.sendEmail.success).to.equal(true);
    expect(second.data?.sendEmail.throttled).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
  });

  it("should return error for invalid JSON variables", async () => {
    const result = await gql<SendResult>(SEND_EMAIL, {
      input: {
        template: "test-welcome",
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        variables: "not-valid-json",
      },
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendEmail.success).to.equal(false);
    expect(result.data?.sendEmail.error).to.be.a("string");

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(0);
  });

  it("should store category and metadata", async () => {
    await gql<SendResult>(SEND_EMAIL, {
      input: {
        template: "test-welcome",
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        variables: JSON.stringify({ name: "Bob", appName: "App" }),
        category: "onboarding",
        metadata: JSON.stringify({ source: "signup" }),
      },
    });

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.category).to.equal("onboarding");
    expect(pending[0]?.metadata).to.equal('{"source":"signup"}');
  });
});
