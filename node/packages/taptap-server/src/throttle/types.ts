export type ThrottleRecord = {
  id: string;
  notificationType: string;
  recipientId: string;
  contextId: string;
  lastSentAt: string;
};

export type ThrottleRow = {
  id: string;
  notification_type: string;
  recipient_id: string;
  context_id: string;
  last_sent_at: string;
};

export function mapRowToDomain(row: ThrottleRow): ThrottleRecord {
  return {
    id: row.id,
    notificationType: row.notification_type,
    recipientId: row.recipient_id,
    contextId: row.context_id,
    lastSentAt: row.last_sent_at,
  };
}

export type ThrottleRepository = {
  isThrottled(
    notificationType: string,
    recipientId: string,
    contextId: string,
    intervalMs: number,
  ): boolean;
  recordSent(
    notificationType: string,
    recipientId: string,
    contextId: string,
  ): void;
};
