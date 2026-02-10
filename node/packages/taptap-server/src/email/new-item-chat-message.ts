import { type EmailContent, wrapHtml } from "./types.js";

type NewItemChatMessageData = {
  itemId: string;
  itemTitle: string;
  chatId: string;
  senderName: string;
  messagePreview: string;
};

export function formatNewItemChatMessageEmail(
  recipientName: string,
  data: NewItemChatMessageData,
): EmailContent {
  const subject = `New message about "${data.itemTitle}" from ${data.senderName}`;

  const html = wrapHtml(`
  <h2>New message about your item</h2>
  <p>Hi ${recipientName}, <strong>${data.senderName}</strong> sent a message about <strong>${data.itemTitle}</strong>:</p>
  <blockquote style="border-left: 3px solid #ddd; padding-left: 12px; color: #555; margin: 16px 0;">${data.messagePreview}</blockquote>
  <p>Log in to Lesser to reply.</p>`);

  const text = `New message about your item

Hi ${recipientName}, ${data.senderName} sent a message about "${data.itemTitle}":

"${data.messagePreview}"

Log in to Lesser to reply.`;

  return { subject, html, text };
}
