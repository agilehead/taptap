import type {
  TapTapConfig,
  Logger,
  Result,
  EmailTemplate,
  RegisterEmailTemplateInput,
  UpdateEmailTemplateInput,
  SendEmailInput,
  SendRawEmailInput,
  SendResult,
} from "./types.js";
import { failure } from "./types.js";
import { graphqlRequest } from "./http-client.js";

export type TapTapClient = {
  /** Get an email template by name */
  getEmailTemplate(name: string): Promise<Result<EmailTemplate | null>>;

  /** List all email templates */
  listEmailTemplates(): Promise<Result<EmailTemplate[]>>;

  /** Register a new email template */
  registerEmailTemplate(
    input: RegisterEmailTemplateInput,
  ): Promise<Result<EmailTemplate>>;

  /** Update an existing email template */
  updateEmailTemplate(
    name: string,
    input: UpdateEmailTemplateInput,
  ): Promise<Result<EmailTemplate>>;

  /** Delete an email template */
  deleteEmailTemplate(name: string): Promise<Result<boolean>>;

  /** Send an email using a template */
  sendEmail(input: SendEmailInput): Promise<Result<SendResult>>;

  /** Send a raw email without a template */
  sendRawEmail(input: SendRawEmailInput): Promise<Result<SendResult>>;
};

export function createTapTapClient(config: TapTapConfig): TapTapClient {
  const { endpoint, timeout, logger } = config;
  const base = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
  const graphqlUrl = `${base}/graphql`;

  return {
    async getEmailTemplate(
      name: string,
    ): Promise<Result<EmailTemplate | null>> {
      const query = `
        query GetEmailTemplate($name: String!) {
          emailTemplate(name: $name) {
            name
            subject
            bodyHtml
            bodyText
            createdAt
            updatedAt
          }
        }
      `;

      const result = await graphqlRequest<{
        emailTemplate: EmailTemplate | null;
      }>({
        endpoint: graphqlUrl,
        query,
        variables: { name },
        timeout,
        logger,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.emailTemplate };
    },

    async listEmailTemplates(): Promise<Result<EmailTemplate[]>> {
      const query = `
        query ListEmailTemplates {
          emailTemplates {
            name
            subject
            bodyHtml
            bodyText
            createdAt
            updatedAt
          }
        }
      `;

      const result = await graphqlRequest<{
        emailTemplates: EmailTemplate[];
      }>({
        endpoint: graphqlUrl,
        query,
        timeout,
        logger,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.emailTemplates };
    },

    async registerEmailTemplate(
      input: RegisterEmailTemplateInput,
    ): Promise<Result<EmailTemplate>> {
      const mutation = `
        mutation RegisterEmailTemplate($input: RegisterEmailTemplateInput!) {
          registerEmailTemplate(input: $input) {
            name
            subject
            bodyHtml
            bodyText
            createdAt
            updatedAt
          }
        }
      `;

      const result = await graphqlRequest<{
        registerEmailTemplate: EmailTemplate;
      }>({
        endpoint: graphqlUrl,
        query: mutation,
        variables: { input },
        timeout,
        logger,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.registerEmailTemplate };
    },

    async updateEmailTemplate(
      name: string,
      input: UpdateEmailTemplateInput,
    ): Promise<Result<EmailTemplate>> {
      const mutation = `
        mutation UpdateEmailTemplate($name: String!, $input: UpdateEmailTemplateInput!) {
          updateEmailTemplate(name: $name, input: $input) {
            name
            subject
            bodyHtml
            bodyText
            createdAt
            updatedAt
          }
        }
      `;

      const result = await graphqlRequest<{
        updateEmailTemplate: EmailTemplate;
      }>({
        endpoint: graphqlUrl,
        query: mutation,
        variables: { name, input },
        timeout,
        logger,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.updateEmailTemplate };
    },

    async deleteEmailTemplate(name: string): Promise<Result<boolean>> {
      const mutation = `
        mutation DeleteEmailTemplate($name: String!) {
          deleteEmailTemplate(name: $name)
        }
      `;

      const result = await graphqlRequest<{ deleteEmailTemplate: boolean }>({
        endpoint: graphqlUrl,
        query: mutation,
        variables: { name },
        timeout,
        logger,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.deleteEmailTemplate };
    },

    async sendEmail(input: SendEmailInput): Promise<Result<SendResult>> {
      const mutation = `
        mutation SendEmail($input: SendEmailInput!) {
          sendEmail(input: $input) {
            success
            error
            throttled
          }
        }
      `;

      const result = await graphqlRequest<{ sendEmail: SendResult }>({
        endpoint: graphqlUrl,
        query: mutation,
        variables: { input },
        timeout,
        logger,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.sendEmail };
    },

    async sendRawEmail(
      input: SendRawEmailInput,
    ): Promise<Result<SendResult>> {
      const mutation = `
        mutation SendRawEmail($input: SendRawEmailInput!) {
          sendRawEmail(input: $input) {
            success
            error
            throttled
          }
        }
      `;

      const result = await graphqlRequest<{ sendRawEmail: SendResult }>({
        endpoint: graphqlUrl,
        query: mutation,
        variables: { input },
        timeout,
        logger,
      });

      if (!result.success) {
        return result;
      }

      return { success: true, data: result.data.sendRawEmail };
    },
  };
}

export function createNoOpTapTapClient(logger?: Logger): TapTapClient {
  const warn = (method: string): void => {
    logger?.warn(`TapTap service is not configured — ${method} is a no-op`);
  };

  const notConfigured = (method: string): Promise<Result<never>> => {
    warn(method);
    return Promise.resolve(
      failure(new Error("TapTap service is not configured")),
    );
  };

  return {
    getEmailTemplate(_name: string): Promise<Result<EmailTemplate | null>> {
      warn("getEmailTemplate");
      return Promise.resolve({ success: true, data: null });
    },

    listEmailTemplates(): Promise<Result<EmailTemplate[]>> {
      warn("listEmailTemplates");
      return Promise.resolve({ success: true, data: [] });
    },

    registerEmailTemplate: (_input) =>
      notConfigured("registerEmailTemplate"),

    updateEmailTemplate: (_name, _input) =>
      notConfigured("updateEmailTemplate"),

    deleteEmailTemplate: (_name) => notConfigured("deleteEmailTemplate"),

    sendEmail: (_input) => notConfigured("sendEmail"),

    sendRawEmail: (_input) => notConfigured("sendRawEmail"),
  };
}
