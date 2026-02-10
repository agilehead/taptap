import { executeSelect } from "@tinqerjs/better-sqlite3-adapter";
import { schema, type SQLiteDatabase } from "@agilehead/taptap-db";
import type { ThrottleRepository, ThrottleRow } from "./types.js";

function makeThrottleId(
  channel: string,
  category: string,
  recipientId: string,
  contextId: string,
): string {
  return `${channel}:${category}:${recipientId}:${contextId}`;
}

export function createThrottleRepository(
  db: SQLiteDatabase,
): ThrottleRepository {
  return {
    isThrottled(
      channel,
      category,
      recipientId,
      contextId,
      intervalMs,
    ): boolean {
      const id = makeThrottleId(channel, category, recipientId, contextId);
      const rows = executeSelect(
        db,
        schema,
        (q, p) => q.from("throttle").where((t) => t.id === p.id),
        { id },
      );
      if (rows.length === 0) return false;
      const row = rows[0] as unknown as ThrottleRow;
      const lastSentAt = new Date(row.last_sent_at).getTime();
      const now = Date.now();
      return now - lastSentAt < intervalMs;
    },

    recordSent(channel, category, recipientId, contextId): void {
      const id = makeThrottleId(channel, category, recipientId, contextId);
      const now = new Date().toISOString();
      // Use raw SQL for UPSERT (INSERT ... ON CONFLICT ... UPDATE)
      // better-sqlite3 uses @param binding syntax
      const stmt = db.prepare(`
        INSERT INTO throttle (id, channel, category, recipient_id, context_id, last_sent_at)
        VALUES (@id, @channel, @category, @recipientId, @contextId, @lastSentAt)
        ON CONFLICT(id) DO UPDATE SET last_sent_at = @lastSentAt
      `);
      stmt.run({
        id,
        channel,
        category,
        recipientId,
        contextId,
        lastSentAt: now,
      });
    },
  };
}
