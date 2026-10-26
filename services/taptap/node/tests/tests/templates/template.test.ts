import { expect } from "chai";
import { graphqlUrl, truncateEmailQueue } from "../../setup.js";
import {
  REGISTER_EMAIL_TEMPLATE,
  UPDATE_EMAIL_TEMPLATE,
  DELETE_EMAIL_TEMPLATE,
  GET_EMAIL_TEMPLATE,
  GET_EMAIL_TEMPLATES,
} from "../../graphql/operations/emails.js";

type EmailTemplate = {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
  updatedAt: string;
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

describe("Email Template Management", () => {
  beforeEach(() => {
    truncateEmailQueue();
  });

  it("should register a new template", async () => {
    const result = await gql<{ registerEmailTemplate: EmailTemplate }>(REGISTER_EMAIL_TEMPLATE, {
      input: {
        name: "welcome",
        subject: "Welcome {{name}}!",
        bodyHtml: "<p>Hello {{name}}, welcome to {{appName}}!</p>",
        bodyText: "Hello {{name}}, welcome to {{appName}}!",
      },
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.registerEmailTemplate.name).to.equal("welcome");
    expect(result.data?.registerEmailTemplate.subject).to.equal("Welcome {{name}}!");
    expect(result.data?.registerEmailTemplate.bodyHtml).to.equal("<p>Hello {{name}}, welcome to {{appName}}!</p>");
    expect(result.data?.registerEmailTemplate.createdAt).to.be.a("string");
  });

  it("should reject duplicate template names", async () => {
    await gql(REGISTER_EMAIL_TEMPLATE, {
      input: {
        name: "duplicate",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
      },
    });

    const result = await gql<{ registerEmailTemplate: EmailTemplate }>(REGISTER_EMAIL_TEMPLATE, {
      input: {
        name: "duplicate",
        subject: "Subject 2",
        bodyHtml: "<p>Body 2</p>",
        bodyText: "Body 2",
      },
    });

    expect(result.errors).to.not.equal(undefined);
  });

  it("should fetch a template by name", async () => {
    await gql(REGISTER_EMAIL_TEMPLATE, {
      input: {
        name: "fetch-test",
        subject: "Test Subject",
        bodyHtml: "<p>Test</p>",
        bodyText: "Test",
      },
    });

    const result = await gql<{ emailTemplate: EmailTemplate }>(GET_EMAIL_TEMPLATE, {
      name: "fetch-test",
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.emailTemplate.name).to.equal("fetch-test");
    expect(result.data?.emailTemplate.subject).to.equal("Test Subject");
  });

  it("should return null for non-existent template", async () => {
    const result = await gql<{ emailTemplate: EmailTemplate | null }>(GET_EMAIL_TEMPLATE, {
      name: "non-existent",
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.emailTemplate).to.equal(null);
  });

  it("should list all templates", async () => {
    await gql(REGISTER_EMAIL_TEMPLATE, {
      input: { name: "alpha", subject: "A", bodyHtml: "<p>A</p>", bodyText: "A" },
    });
    await gql(REGISTER_EMAIL_TEMPLATE, {
      input: { name: "beta", subject: "B", bodyHtml: "<p>B</p>", bodyText: "B" },
    });

    const result = await gql<{ emailTemplates: EmailTemplate[] }>(GET_EMAIL_TEMPLATES);

    expect(result.errors).to.equal(undefined);
    expect(result.data?.emailTemplates).to.have.length(2);
  });

  it("should update a template", async () => {
    await gql(REGISTER_EMAIL_TEMPLATE, {
      input: { name: "update-test", subject: "Old", bodyHtml: "<p>Old</p>", bodyText: "Old" },
    });

    const result = await gql<{ updateEmailTemplate: EmailTemplate }>(UPDATE_EMAIL_TEMPLATE, {
      name: "update-test",
      input: { subject: "New Subject" },
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.updateEmailTemplate.subject).to.equal("New Subject");
    expect(result.data?.updateEmailTemplate.bodyHtml).to.equal("<p>Old</p>");
  });

  it("should return error when updating non-existent template", async () => {
    const result = await gql<{ updateEmailTemplate: EmailTemplate }>(UPDATE_EMAIL_TEMPLATE, {
      name: "non-existent",
      input: { subject: "New Subject" },
    });

    expect(result.errors).to.not.equal(undefined);
    expect(result.errors?.[0]?.message).to.include("not found");
  });

  it("should return false when deleting non-existent template", async () => {
    const result = await gql<{ deleteEmailTemplate: boolean }>(DELETE_EMAIL_TEMPLATE, {
      name: "non-existent",
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.deleteEmailTemplate).to.equal(false);
  });

  it("should delete a template", async () => {
    await gql(REGISTER_EMAIL_TEMPLATE, {
      input: { name: "delete-test", subject: "S", bodyHtml: "<p>B</p>", bodyText: "B" },
    });

    const deleteResult = await gql<{ deleteEmailTemplate: boolean }>(DELETE_EMAIL_TEMPLATE, {
      name: "delete-test",
    });
    expect(deleteResult.data?.deleteEmailTemplate).to.equal(true);

    const fetchResult = await gql<{ emailTemplate: EmailTemplate | null }>(GET_EMAIL_TEMPLATE, {
      name: "delete-test",
    });
    expect(fetchResult.data?.emailTemplate).to.equal(null);
  });
});
