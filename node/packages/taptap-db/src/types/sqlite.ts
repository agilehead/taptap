/**
 * SQLite-specific database row types for taptap-db
 * These map directly to database tables with SQLite-specific types
 */

// Email template table row
export type EmailTemplateRow = {
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  created_at: string;
  updated_at: string;
};

// Email queue table row
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

// Throttle table row
export type ThrottleRow = {
  id: string;
  channel: string;
  category: string;
  recipient_id: string;
  context_id: string;
  last_sent_at: string;
};
