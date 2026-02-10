export type CreateEmailQueueItem = {
  id: string;
  notificationType: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  data: string;
};

export type EmailQueueItem = {
  id: string;
  notificationType: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  data: string;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type EmailQueueRow = {
  id: string;
  notification_type: string;
  recipient_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body_html: string;
  body_text: string;
  data: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

export function mapRowToDomain(row: EmailQueueRow): EmailQueueItem {
  return {
    id: row.id,
    notificationType: row.notification_type,
    recipientId: row.recipient_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    subject: row.subject,
    bodyHtml: row.body_html,
    bodyText: row.body_text,
    data: row.data,
    status: row.status,
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
