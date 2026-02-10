import { executeSelect } from "@tinqerjs/better-sqlite3-adapter";
import { schema, type SQLiteDatabase } from "@agilehead/taptap-db";
import type { ThrottleRepository, ThrottleRow } from "./types.js";

function makeThrottleId(
  notificationType: string,
  recipientId: string,
  contextId: string,
): string {
  return `${notificationType}:${recipientId}:${contextId}`;
}

export function createThrottleRepository(
  db: SQLiteDatabase,
): ThrottleRepository {
  return {
    isThrottled(notificationType, recipientId, contextId, intervalMs): boolean {
      const id = makeThrottleId(notificationType, recipientId, contextId);
      const rows = executeSelect(
        db,
        schema,
        (q, p) => q.from("notification_throttle").where((t) => t.id === p.id),
        { id },
      );
      if (rows.length === 0) return false;
      const row = rows[0] as unknown as ThrottleRow;
      const lastSentAt = new Date(row.last_sent_at).getTime();
      const now = Date.now();
      return now - lastSentAt < intervalMs;
    },

    recordSent(notificationType, recipientId, contextId): void {
      const id = makeThrottleId(notificationType, recipientId, contextId);
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO notification_throttle (id, notification_type, recipient_id, context_id, last_sent_at)
        VALUES (:id, :notificationType, :recipientId, :contextId, :lastSentAt)
        ON CONFLICT(id) DO UPDATE SET last_sent_at = :lastSentAt
      `);
      stmt.run({
        id,
        notificationType,
        recipientId,
        contextId,
        lastSentAt: now,
      });
    },
  };
}
