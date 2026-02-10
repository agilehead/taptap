import { type EmailContent, wrapHtml } from "./types.js";

type VerificationApprovedData = {
  verificationType: string;
};

export function formatVerificationApprovedEmail(
  recipientName: string,
  data: VerificationApprovedData,
): EmailContent {
  const subject = "Your verification has been approved";

  const html = wrapHtml(`
  <h2>Verification approved</h2>
  <p>Hi ${recipientName}, your ${data.verificationType} verification has been approved.</p>
  <p>Your profile now shows a verification badge, which helps build trust with other users.</p>`);

  const text = `Verification approved

Hi ${recipientName}, your ${data.verificationType} verification has been approved.

Your profile now shows a verification badge, which helps build trust with other users.`;

  return { subject, html, text };
}
