// Database schema definition for Tinqer
// This provides type-safe queries with the Tinqer query builder

export type DatabaseSchema = {
  // Email template registry
  email_template: {
    name: string;
    subject: string;
    body_html: string;
    body_text: string;
    created_at: string;
    updated_at: string;
  };

  // Email delivery queue
  email_queue: {
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

  // Throttle - shared across channels
  throttle: {
    id: string;
    channel: string;
    category: string;
    recipient_id: string;
    context_id: string;
    last_sent_at: string;
  };
};
