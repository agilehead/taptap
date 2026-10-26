export type Logger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

export type TapTapConfig = {
  /** Base URL of the TapTap service (e.g., "http://localhost:5006") */
  endpoint: string;
  /** Optional request timeout in milliseconds */
  timeout?: number;
  /** Optional logger for debugging */
  logger?: Logger;
};

export type EmailRecipient = {
  id: string;
  email: string;
  name: string;
};

export type EmailTemplate = {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
  updatedAt: string;
};

export type RegisterEmailTemplateInput = {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
};

export type UpdateEmailTemplateInput = {
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
};

export type SendEmailInput = {
  template: string;
  recipient: EmailRecipient;
  variables?: string;
  category?: string;
  contextId?: string;
  throttleIntervalMs?: number;
  metadata?: string;
};

export type SendRawEmailInput = {
  recipient: EmailRecipient;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category?: string;
  contextId?: string;
  throttleIntervalMs?: number;
  metadata?: string;
};

export type SendResult = {
  success: boolean;
  error?: string;
  throttled: boolean;
};
