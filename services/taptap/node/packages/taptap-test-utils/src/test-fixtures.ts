/**
 * Common test fixtures for TapTap tests
 */

import { randomBytes } from "crypto";

// Generate a random alphanumeric ID of given length
export function generateId(length = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      const charIndex = byte % chars.length;
      result += chars.charAt(charIndex);
    }
  }
  return result;
}

// Create a test email queue item fixture
export function createTestEmailQueueItem(overrides?: {
  id?: string;
  templateName?: string | null;
  recipientId?: string;
  recipientEmail?: string;
  recipientName?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  category?: string | null;
  metadata?: string | null;
}): {
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
} {
  const id = overrides?.id ?? generateId(10);

  return {
    id,
    templateName: overrides?.templateName ?? null,
    recipientId: overrides?.recipientId ?? `user-${generateId(8)}`,
    recipientEmail: overrides?.recipientEmail ?? `test-${id}@example.com`,
    recipientName: overrides?.recipientName ?? `Test User ${id}`,
    subject: overrides?.subject ?? "Test notification",
    bodyHtml: overrides?.bodyHtml ?? "<p>Test notification body</p>",
    bodyText: overrides?.bodyText ?? "Test notification body",
    category: overrides?.category ?? null,
    metadata: overrides?.metadata ?? null,
  };
}
