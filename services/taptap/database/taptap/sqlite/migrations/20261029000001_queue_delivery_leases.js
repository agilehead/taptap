/** @param {import("knex").Knex} knex */
export async function up(knex) {
  await knex.schema.alterTable("email_queue", (table) => {
    table.string("lease_owner");
    table.bigInteger("lease_until");
  });
  // Deploy with the old workers stopped. Abandoned pre-lease sends become
  // expired claims, counted as an attempt because SMTP acceptance is unknown.
  await knex("email_queue")
    .where({ status: "sending" })
    .update({
      lease_until: 0,
      attempts: knex.raw("attempts + 1"),
      last_error:
        "Delivery interrupted before lease migration; acceptance unknown",
    });
}

export async function down() {
  throw new Error("Delivery lease migration requires a forward migration");
}
