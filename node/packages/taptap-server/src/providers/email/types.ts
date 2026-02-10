export type EmailAddress = { email: string; name?: string };
export type EmailMessage = {
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailAddress;
};
export type EmailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};
export type EmailProvider = {
  send(message: EmailMessage): Promise<EmailSendResult>;
  readonly name: string;
};
