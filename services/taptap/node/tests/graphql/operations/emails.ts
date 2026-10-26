export const HEALTH_QUERY = `
  query Health {
    health
  }
`;

export const REGISTER_EMAIL_TEMPLATE = `
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

export const UPDATE_EMAIL_TEMPLATE = `
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

export const DELETE_EMAIL_TEMPLATE = `
  mutation DeleteEmailTemplate($name: String!) {
    deleteEmailTemplate(name: $name)
  }
`;

export const GET_EMAIL_TEMPLATE = `
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

export const GET_EMAIL_TEMPLATES = `
  query GetEmailTemplates {
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

export const SEND_EMAIL = `
  mutation SendEmail($input: SendEmailInput!) {
    sendEmail(input: $input) {
      success
      error
      throttled
    }
  }
`;

export const SEND_RAW_EMAIL = `
  mutation SendRawEmail($input: SendRawEmailInput!) {
    sendRawEmail(input: $input) {
      success
      error
      throttled
    }
  }
`;
