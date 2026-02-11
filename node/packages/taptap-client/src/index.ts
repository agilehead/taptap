export type {
  Logger,
  Result,
  TapTapConfig,
  EmailRecipient,
  EmailTemplate,
  RegisterEmailTemplateInput,
  UpdateEmailTemplateInput,
  SendEmailInput,
  SendRawEmailInput,
  SendResult,
} from "./types.js";
export { success, failure } from "./types.js";

export type { TapTapClient } from "./client.js";
export { createTapTapClient, createNoOpTapTapClient } from "./client.js";
