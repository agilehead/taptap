// Database schema definition for Tinqer
// This provides type-safe queries with the Tinqer query builder

export type DatabaseSchema = {
  // Email notification queue
  email_queue: {
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

  // Notification throttle records
  notification_throttle: {
    id: string;
    notification_type: string;
    recipient_id: string;
    context_id: string;
    last_sent_at: string;
  };
};
