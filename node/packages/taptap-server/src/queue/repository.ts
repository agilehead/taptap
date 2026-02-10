import {
  executeSelect,
  executeInsert,
  executeUpdate,
} from "@tinqerjs/better-sqlite3-adapter";
import { schema, type SQLiteDatabase } from "@agilehead/taptap-db";
import type {
  CreateEmailQueueItem,
  EmailQueueRow,
  EmailQueueRepository,
} from "./types.js";
import { mapRowToDomain } from "./types.js";

export function createEmailQueueRepository(
  db: SQLiteDatabase,
): EmailQueueRepository {
  return {
    create(data: CreateEmailQueueItem) {
      const now = new Date().toISOString();
      executeInsert(
        db,
        schema,
        (q, p) =>
          q.insertInto("email_queue").values({
            id: p.id,
            template_name: p.templateName,
            status: "pending",
            recipient_id: p.recipientId,
            recipient_email: p.recipientEmail,
            recipient_name: p.recipientName,
            subject: p.subject,
            body_html: p.bodyHtml,
            body_text: p.bodyText,
            category: p.category,
            metadata: p.metadata,
            attempts: 0,
            last_error: null,
            created_at: p.createdAt,
            sent_at: null,
          }),
        {
          id: data.id,
          templateName: data.templateName,
          recipientId: data.recipientId,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          bodyText: data.bodyText,
          category: data.category,
          metadata: data.metadata,
          createdAt: now,
        },
      );
      const rows = executeSelect(
        db,
        schema,
        (q, p) => q.from("email_queue").where((e) => e.id === p.id),
        { id: data.id },
      );
      return mapRowToDomain(rows[0] as unknown as EmailQueueRow);
    },

    findPending(limit: number) {
      const rows = executeSelect(
        db,
        schema,
        (q, p) =>
          q
            .from("email_queue")
            .where((e) => e.status === p.status)
            .orderBy((e) => e.created_at)
            .take(p.limit),
        { status: "pending", limit },
      );
      return rows.map((row) => mapRowToDomain(row as unknown as EmailQueueRow));
    },

    markSending(id: string) {
      executeUpdate(
        db,
        schema,
        (q, p) =>
          q
            .update("email_queue")
            .set({ status: p.status })
            .where((e) => e.id === p.id),
        { id, status: "sending" },
      );
    },

    markSent(id: string) {
      const now = new Date().toISOString();
      executeUpdate(
        db,
        schema,
        (q, p) =>
          q
            .update("email_queue")
            .set({ status: p.status, sent_at: p.sentAt })
            .where((e) => e.id === p.id),
        { id, status: "sent", sentAt: now },
      );
    },

    markFailed(id: string, error: string, maxAttempts: number) {
      const rows = executeSelect(
        db,
        schema,
        (q, p) => q.from("email_queue").where((e) => e.id === p.id),
        { id },
      );
      if (rows.length === 0) return;
      const row = rows[0] as unknown as EmailQueueRow;
      const newAttempts = row.attempts + 1;
      const newStatus = newAttempts >= maxAttempts ? "failed" : "pending";
      executeUpdate(
        db,
        schema,
        (q, p) =>
          q
            .update("email_queue")
            .set({
              status: p.newStatus,
              attempts: p.newAttempts,
              last_error: p.lastError,
            })
            .where((e) => e.id === p.id),
        { id, newStatus, newAttempts, lastError: error },
      );
    },
  };
}
