import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type OutbidData = {
  itemId: string;
  itemTitle: string;
  auctionId: string;
  newHighBid: number;
  yourBid: number;
};

export function formatOutbidEmail(
  recipientName: string,
  data: OutbidData,
): EmailContent {
  const subject = `You've been outbid on "${data.itemTitle}"`;

  const html = wrapHtml(`
  <h2>You've been outbid</h2>
  <p>Hi ${recipientName}, someone has placed a higher bid on <strong>${data.itemTitle}</strong>.</p>
  <p><strong>New high bid:</strong> ${formatPrice(data.newHighBid)}</p>
  <p><strong>Your bid:</strong> ${formatPrice(data.yourBid)}</p>
  <p>Place a new bid if you still want this item.</p>`);

  const text = `You've been outbid

Hi ${recipientName}, someone has placed a higher bid on "${data.itemTitle}".

New high bid: ${formatPrice(data.newHighBid)}
Your bid: ${formatPrice(data.yourBid)}

Place a new bid if you still want this item.`;

  return { subject, html, text };
}
