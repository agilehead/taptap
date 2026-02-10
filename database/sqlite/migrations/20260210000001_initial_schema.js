/**
 * Initial schema for TapTap notification service
 *
 * Creates: email_template, email_queue, throttle tables.
 */

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  // Email template registry
  await knex.schema.createTable("email_template", (table) => {
    table.string("name", 100).primary();
    table.string("subject", 1000).notNullable();
    table.text("body_html").notNullable();
    table.text("body_text").notNullable();
    table.datetime("created_at").notNullable();
    table.datetime("updated_at").notNullable();
  });

  // Email delivery queue
  await knex.schema.createTable("email_queue", (table) => {
    table.string("id", 20).primary();
    table.string("template_name", 100);
    table.string("status", 20).notNullable().defaultTo("pending");
    table.string("recipient_id", 32).notNullable();
    table.string("recipient_email", 255).notNullable();
    table.string("recipient_name", 255).notNullable();
    table.string("subject", 1000).notNullable();
    table.text("body_html").notNullable();
    table.text("body_text").notNullable();
    table.string("category", 100);
    table.text("metadata");
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error");
    table.datetime("created_at").notNullable();
    table.datetime("sent_at");
  });

  await knex.schema.raw(
    "CREATE INDEX idx_email_queue_status_created ON email_queue(status, created_at)",
  );

  // Throttle - shared across channels
  await knex.schema.createTable("throttle", (table) => {
    table.string("id", 200).primary();
    table.string("channel", 20).notNullable();
    table.string("category", 100).notNullable();
    table.string("recipient_id", 32).notNullable();
    table.string("context_id", 100).notNullable();
    table.datetime("last_sent_at").notNullable();
  });

  await knex.schema.raw(
    "CREATE INDEX idx_throttle_channel_category_recipient ON throttle(channel, category, recipient_id, context_id)",
  );
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("throttle");
  await knex.schema.dropTableIfExists("email_queue");
  await knex.schema.dropTableIfExists("email_template");
}
