export type ThrottleRecord = {
  id: string;
  channel: string;
  category: string;
  recipientId: string;
  contextId: string;
  lastSentAt: string;
};

export type ThrottleRow = {
  id: string;
  channel: string;
  category: string;
  recipient_id: string;
  context_id: string;
  last_sent_at: string;
};

export function mapRowToDomain(row: ThrottleRow): ThrottleRecord {
  return {
    id: row.id,
    channel: row.channel,
    category: row.category,
    recipientId: row.recipient_id,
    contextId: row.context_id,
    lastSentAt: row.last_sent_at,
  };
}

export type ThrottleRepository = {
  isThrottled(
    channel: string,
    category: string,
    recipientId: string,
    contextId: string,
    intervalMs: number,
  ): boolean;
  recordSent(
    channel: string,
    category: string,
    recipientId: string,
    contextId: string,
  ): void;
};
