/**
 * SQLite-specific database row types for taptap-db
 * These map directly to database tables with SQLite-specific types
 */

// Email queue table row
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

// Notification throttle table row
export type NotificationThrottleRow = {
  id: string;
  notification_type: string;
  recipient_id: string;
  context_id: string;
  last_sent_at: string;
};
