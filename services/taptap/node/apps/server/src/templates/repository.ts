import {
  executeSelect,
  executeInsert,
  executeUpdate,
  executeDelete,
} from "@tinqerjs/better-sqlite3-adapter";
import { schema, type SQLiteDatabase } from "@agilehead/taptap-db";
import type {
  CreateEmailTemplate,
  UpdateEmailTemplate,
  EmailTemplateRow,
  EmailTemplateRepository,
} from "./types.js";
import { mapRowToDomain } from "./types.js";

export function createEmailTemplateRepository(
  db: SQLiteDatabase,
): EmailTemplateRepository {
  return {
    findByName(name: string) {
      const rows = executeSelect(
        db,
        schema,
        (q, p) => q.from("email_template").where((t) => t.name === p.name),
        { name },
      );
      if (rows.length === 0) return null;
      return mapRowToDomain(rows[0] as unknown as EmailTemplateRow);
    },

    findAll() {
      const rows = executeSelect(
        db,
        schema,
        (q) => q.from("email_template").orderBy((t) => t.name),
        {},
      );
      return rows.map((row) =>
        mapRowToDomain(row as unknown as EmailTemplateRow),
      );
    },

    create(data: CreateEmailTemplate) {
      const now = new Date().toISOString();
      executeInsert(
        db,
        schema,
        (q, p) =>
          q.insertInto("email_template").values({
            name: p.name,
            subject: p.subject,
            body_html: p.bodyHtml,
            body_text: p.bodyText,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          }),
        {
          name: data.name,
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          bodyText: data.bodyText,
          createdAt: now,
          updatedAt: now,
        },
      );
      const rows = executeSelect(
        db,
        schema,
        (q, p) => q.from("email_template").where((t) => t.name === p.name),
        { name: data.name },
      );
      return mapRowToDomain(rows[0] as unknown as EmailTemplateRow);
    },

    update(name: string, data: UpdateEmailTemplate) {
      const existing = executeSelect(
        db,
        schema,
        (q, p) => q.from("email_template").where((t) => t.name === p.name),
        { name },
      );
      if (existing.length === 0) return null;
      const row = existing[0] as unknown as EmailTemplateRow;
      const now = new Date().toISOString();
      executeUpdate(
        db,
        schema,
        (q, p) =>
          q
            .update("email_template")
            .set({
              subject: p.subject,
              body_html: p.bodyHtml,
              body_text: p.bodyText,
              updated_at: p.updatedAt,
            })
            .where((t) => t.name === p.name),
        {
          name,
          subject: data.subject ?? row.subject,
          bodyHtml: data.bodyHtml ?? row.body_html,
          bodyText: data.bodyText ?? row.body_text,
          updatedAt: now,
        },
      );
      const updated = executeSelect(
        db,
        schema,
        (q, p) => q.from("email_template").where((t) => t.name === p.name),
        { name },
      );
      return mapRowToDomain(updated[0] as unknown as EmailTemplateRow);
    },

    delete(name: string) {
      const existing = executeSelect(
        db,
        schema,
        (q, p) => q.from("email_template").where((t) => t.name === p.name),
        { name },
      );
      if (existing.length === 0) return false;
      executeDelete(
        db,
        schema,
        (q, p) =>
          q.deleteFrom("email_template").where((t) => t.name === p.name),
        { name },
      );
      return true;
    },
  };
}
