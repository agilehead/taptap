import { type EmailContent, wrapHtml } from "./types.js";

type VouchedForYouData = {
  voucherId: string;
  voucherName: string;
  voucherUsername: string;
};

export function formatVouchedForYouEmail(
  recipientName: string,
  data: VouchedForYouData,
): EmailContent {
  const subject = `${data.voucherName} vouched for you`;

  const html = wrapHtml(`
  <h2>Someone vouched for you</h2>
  <p>Hi ${recipientName}, <strong>${data.voucherName}</strong> (@${data.voucherUsername}) has vouched for you on Lesser.</p>
  <p>Being vouched for increases your trust score and helps other users feel confident transacting with you.</p>`);

  const text = `Someone vouched for you

Hi ${recipientName}, ${data.voucherName} (@${data.voucherUsername}) has vouched for you on Lesser.

Being vouched for increases your trust score and helps other users feel confident transacting with you.`;

  return { subject, html, text };
}
