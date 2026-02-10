import { type EmailContent, wrapHtml } from "./types.js";

type NewReviewData = {
  reviewerId: string;
  reviewerName: string;
  itemId: string;
  itemTitle: string;
  rating: number;
  reviewText: string;
  reviewType: "buyer" | "seller";
};

export function formatNewReviewEmail(
  recipientName: string,
  data: NewReviewData,
): EmailContent {
  const stars = "\u2605".repeat(data.rating) + "\u2606".repeat(5 - data.rating);
  const roleText = data.reviewType === "buyer" ? "buyer" : "seller";
  const subject = `${data.reviewerName} left you a ${String(data.rating)}-star review`;

  const html = wrapHtml(`
  <h2>New review</h2>
  <p>Hi ${recipientName}, <strong>${data.reviewerName}</strong> (${roleText}) left you a review for <strong>${data.itemTitle}</strong>.</p>
  <p style="font-size: 24px; color: #f5a623;">${stars}</p>
  <blockquote style="border-left: 3px solid #ddd; padding-left: 12px; color: #555; margin: 16px 0;">${data.reviewText}</blockquote>`);

  const text = `New review

Hi ${recipientName}, ${data.reviewerName} (${roleText}) left you a review for "${data.itemTitle}".

Rating: ${stars} (${String(data.rating)}/5)

"${data.reviewText}"`;

  return { subject, html, text };
}
