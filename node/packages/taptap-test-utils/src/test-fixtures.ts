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
  notificationType?: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientName?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  data?: string;
}): {
  id: string;
  notificationType: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  data: string;
} {
  const id = overrides?.id ?? generateId(10);

  return {
    id,
    notificationType: overrides?.notificationType ?? "AUCTION_WON",
    recipientId: overrides?.recipientId ?? `user-${generateId(8)}`,
    recipientEmail: overrides?.recipientEmail ?? `test-${id}@example.com`,
    recipientName: overrides?.recipientName ?? `Test User ${id}`,
    subject: overrides?.subject ?? "Test notification",
    bodyHtml: overrides?.bodyHtml ?? "<p>Test notification body</p>",
    bodyText: overrides?.bodyText ?? "Test notification body",
    data: overrides?.data ?? JSON.stringify({ itemId: "test-item" }),
  };
}
