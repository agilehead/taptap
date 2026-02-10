import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type WatchedItemEndingSoonData = {
  itemId: string;
  itemTitle: string;
  auctionId: string;
  currentBid: number;
  endsAt: string;
  hoursRemaining: number;
};

export function formatWatchedItemEndingSoonEmail(
  recipientName: string,
  data: WatchedItemEndingSoonData,
): EmailContent {
  const subject = `Watched auction ending: "${data.itemTitle}"`;

  const html = wrapHtml(`
  <h2>Watched auction ending soon</h2>
  <p>Hi ${recipientName}, an auction you're watching ends in ${String(data.hoursRemaining)} hours.</p>
  <p><strong>${data.itemTitle}</strong></p>
  <p><strong>Current bid:</strong> ${formatPrice(data.currentBid)}</p>
  <p>Place a bid now if you're interested!</p>`);

  const text = `Watched auction ending soon

Hi ${recipientName}, an auction you're watching ends in ${String(data.hoursRemaining)} hours.

${data.itemTitle}
Current bid: ${formatPrice(data.currentBid)}

Place a bid now if you're interested!`;

  return { subject, html, text };
}
