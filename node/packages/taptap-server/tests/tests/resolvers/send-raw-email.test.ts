import { expect } from "chai";
import { graphqlUrl, truncateEmailQueue, queueRepo } from "../../setup.js";
import { SEND_RAW_EMAIL } from "../../graphql/operations/emails.js";

type SendResult = {
  sendRawEmail: {
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

describe("sendRawEmail Mutation", () => {
  beforeEach(() => {
    truncateEmailQueue();
  });

  it("should queue a raw email successfully", async () => {
    const result = await gql<SendResult>(SEND_RAW_EMAIL, {
      input: {
        recipient: { id: "user-1", email: "user@test.com", name: "Test User" },
        subject: "Welcome",
        bodyHtml: "<p>Welcome to the app</p>",
        bodyText: "Welcome to the app",
      },
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendRawEmail.success).to.equal(true);
    expect(result.data?.sendRawEmail.throttled).to.equal(false);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.recipientEmail).to.equal("user@test.com");
    expect(pending[0]?.subject).to.equal("Welcome");
    expect(pending[0]?.bodyHtml).to.equal("<p>Welcome to the app</p>");
    expect(pending[0]?.templateName).to.equal(null);
  });

  it("should store category and metadata when provided", async () => {
    await gql<SendResult>(SEND_RAW_EMAIL, {
      input: {
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        subject: "Notification",
        bodyHtml: "<p>Hello</p>",
        bodyText: "Hello",
        category: "order-update",
        metadata: JSON.stringify({ orderId: "order-123" }),
      },
    });

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.category).to.equal("order-update");
    expect(pending[0]?.metadata).to.equal('{"orderId":"order-123"}');
  });

  it("should throttle duplicate raw emails", async () => {
    const first = await gql<SendResult>(SEND_RAW_EMAIL, {
      input: {
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        subject: "Alert",
        bodyHtml: "<p>Alert</p>",
        bodyText: "Alert",
        category: "alerts",
        contextId: "item-42",
        throttleIntervalMs: 60000,
      },
    });

    expect(first.data?.sendRawEmail.throttled).to.equal(false);

    const second = await gql<SendResult>(SEND_RAW_EMAIL, {
      input: {
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        subject: "Alert again",
        bodyHtml: "<p>Alert again</p>",
        bodyText: "Alert again",
        category: "alerts",
        contextId: "item-42",
        throttleIntervalMs: 60000,
      },
    });

    expect(second.data?.sendRawEmail.throttled).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
  });

  it("should not throttle different contexts", async () => {
    await gql<SendResult>(SEND_RAW_EMAIL, {
      input: {
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        subject: "Alert 1",
        bodyHtml: "<p>Alert 1</p>",
        bodyText: "Alert 1",
        category: "alerts",
        contextId: "item-1",
        throttleIntervalMs: 60000,
      },
    });

    const second = await gql<SendResult>(SEND_RAW_EMAIL, {
      input: {
        recipient: { id: "user-1", email: "user@test.com", name: "User" },
        subject: "Alert 2",
        bodyHtml: "<p>Alert 2</p>",
        bodyText: "Alert 2",
        category: "alerts",
        contextId: "item-2",
        throttleIntervalMs: 60000,
      },
    });

    expect(second.data?.sendRawEmail.throttled).to.equal(false);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(2);
  });

  it("should return GraphQL error for missing required fields", async () => {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: SEND_RAW_EMAIL,
        variables: {
          input: {
            recipient: { id: "user-1", email: "user@test.com", name: "User" },
            // Missing subject, bodyHtml, bodyText
          },
        },
      }),
    });

    const result = (await response.json()) as GraphQLResponse<SendResult>;
    expect(result.errors).to.not.equal(undefined);
  });
});
