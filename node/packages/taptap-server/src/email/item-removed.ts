import { type EmailContent, wrapHtml } from "./types.js";

type ItemRemovedData = {
  itemId: string;
  itemTitle: string;
  reason: string;
  moderatorNote?: string;
};

export function formatItemRemovedEmail(
  recipientName: string,
  data: ItemRemovedData,
): EmailContent {
  const subject = `Your listing "${data.itemTitle}" has been removed`;

  const noteSection =
    data.moderatorNote !== undefined
      ? `<p><strong>Moderator note:</strong> ${data.moderatorNote}</p>`
      : "";
  const noteText =
    data.moderatorNote !== undefined
      ? `\nModerator note: ${data.moderatorNote}`
      : "";

  const html = wrapHtml(`
  <h2>Listing removed</h2>
  <p>Hi ${recipientName}, your listing <strong>${data.itemTitle}</strong> has been removed by a moderator.</p>
  <p><strong>Reason:</strong> ${data.reason}</p>
  ${noteSection}
  <p>If you believe this was a mistake, please contact support.</p>`);

  const text = `Listing removed

Hi ${recipientName}, your listing "${data.itemTitle}" has been removed by a moderator.

Reason: ${data.reason}${noteText}

If you believe this was a mistake, please contact support.`;

  return { subject, html, text };
}
