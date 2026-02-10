export type CreateEmailQueueItem = {
  id: string;
  templateName: string | null;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: string | null;
  metadata: string | null;
};

export type EmailQueueItem = {
  id: string;
  templateName: string | null;
  status: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: string | null;
  metadata: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type EmailQueueRow = {
  id: string;
  template_name: string | null;
  status: string;
  recipient_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  category: string | null;
  metadata: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

export function mapRowToDomain(row: EmailQueueRow): EmailQueueItem {
  return {
    id: row.id,
    templateName: row.template_name,
    status: row.status,
    recipientId: row.recipient_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    category: row.category,
    metadata: row.metadata,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  };
}

export type EmailQueueRepository = {
  create(data: CreateEmailQueueItem): EmailQueueItem;
  findPending(limit: number): EmailQueueItem[];
  markSending(id: string): void;
  markSent(id: string): void;
  markFailed(id: string, error: string, maxAttempts: number): void;
};
