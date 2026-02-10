/**
 * Initial schema for TapTap - notification and email delivery service
 *
 * This creates the email_queue and notification_throttle tables.
 */

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  // Email queue table - stores pending/sent/failed notification emails
  await knex.schema.createTable("email_queue", (table) => {
    table.string("id", 10).primary();
    table.string("notification_type", 50).notNullable();
    table.string("recipient_id", 32).notNullable();
    table.string("recipient_email", 255).notNullable();
    table.string("recipient_name", 255).notNullable();
    table.string("subject", 500).notNullable();
    table.text("body_html").notNullable();
    table.text("body_text").notNullable();
    table.text("data").notNullable();
    table.string("status", 20).notNullable().defaultTo("pending");
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error");
    table.datetime("created_at").notNullable();
    table.datetime("sent_at");
  });

  // Indexes for email_queue
  await knex.schema.raw(
    "CREATE INDEX idx_email_queue_status_created ON email_queue(status, created_at)",
  );

  // Notification throttle table - rate-limits per type+recipient+context
  await knex.schema.createTable("notification_throttle", (table) => {
    table.string("id", 100).primary();
    table.string("notification_type", 50).notNullable();
    table.string("recipient_id", 32).notNullable();
    table.string("context_id", 50).notNullable();
    table.datetime("last_sent_at").notNullable();
  });

  // Indexes for notification_throttle
  await knex.schema.raw(
    "CREATE INDEX idx_throttle_type_recipient_context ON notification_throttle(notification_type, recipient_id, context_id)",
  );
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("notification_throttle");
  await knex.schema.dropTableIfExists("email_queue");
}
