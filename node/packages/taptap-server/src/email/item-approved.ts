import { type EmailContent, wrapHtml } from "./types.js";

type ItemApprovedData = {
  itemId: string;
  itemTitle: string;
};

export function formatItemApprovedEmail(
  recipientName: string,
  data: ItemApprovedData,
): EmailContent {
  const subject = `Your listing "${data.itemTitle}" has been approved`;

  const html = wrapHtml(`
  <h2>Listing approved</h2>
  <p>Hi ${recipientName}, your listing <strong>${data.itemTitle}</strong> has been reviewed and approved.</p>
  <p>Your item is now visible to all users on Lesser.</p>`);

  const text = `Listing approved

Hi ${recipientName}, your listing "${data.itemTitle}" has been reviewed and approved.

Your item is now visible to all users on Lesser.`;

  return { subject, html, text };
}
