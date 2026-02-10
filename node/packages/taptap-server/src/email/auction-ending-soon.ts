import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type AuctionEndingSoonData = {
  itemId: string;
  itemTitle: string;
  auctionId: string;
  currentBid: number;
  endsAt: string;
  hoursRemaining: number;
};

export function formatAuctionEndingSoonEmail(
  recipientName: string,
  data: AuctionEndingSoonData,
): EmailContent {
  const subject = `Auction ending soon: "${data.itemTitle}"`;

  const html = wrapHtml(`
  <h2>Auction ending soon</h2>
  <p>Hi ${recipientName}, the auction for <strong>${data.itemTitle}</strong> ends in ${String(data.hoursRemaining)} hours.</p>
  <p><strong>Current bid:</strong> ${formatPrice(data.currentBid)}</p>
  <p>Don't miss out - place your bid now!</p>`);

  const text = `Auction ending soon

Hi ${recipientName}, the auction for "${data.itemTitle}" ends in ${String(data.hoursRemaining)} hours.

Current bid: ${formatPrice(data.currentBid)}

Don't miss out - place your bid now!`;

  return { subject, html, text };
}
