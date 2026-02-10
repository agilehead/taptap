import { type EmailContent, wrapHtml } from "./types.js";

type NewDirectMessageData = {
  conversationId: string;
  senderName: string;
  senderId: string;
  messagePreview: string;
};

export function formatNewDirectMessageEmail(
  recipientName: string,
  data: NewDirectMessageData,
): EmailContent {
  const subject = `New message from ${data.senderName}`;

  const html = wrapHtml(`
  <h2>New message</h2>
  <p>Hi ${recipientName}, <strong>${data.senderName}</strong> sent you a message:</p>
  <blockquote style="border-left: 3px solid #ddd; padding-left: 12px; color: #555; margin: 16px 0;">${data.messagePreview}</blockquote>
  <p>Log in to Lesser to reply.</p>`);

  const text = `New message

Hi ${recipientName}, ${data.senderName} sent you a message:

"${data.messagePreview}"

Log in to Lesser to reply.`;

  return { subject, html, text };
}
