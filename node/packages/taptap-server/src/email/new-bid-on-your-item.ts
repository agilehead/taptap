import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type NewBidOnYourItemData = {
  itemId: string;
  itemTitle: string;
  auctionId: string;
  bidAmount: number;
  bidderName: string;
  totalBids: number;
};

export function formatNewBidOnYourItemEmail(
  recipientName: string,
  data: NewBidOnYourItemData,
): EmailContent {
  const subject = `New bid on "${data.itemTitle}": ${formatPrice(data.bidAmount)}`;

  const html = wrapHtml(`
  <h2>New bid on your item</h2>
  <p>Hi ${recipientName}, <strong>${data.bidderName}</strong> placed a bid on <strong>${data.itemTitle}</strong>.</p>
  <p><strong>Bid amount:</strong> ${formatPrice(data.bidAmount)}</p>
  <p><strong>Total bids:</strong> ${String(data.totalBids)}</p>`);

  const text = `New bid on your item

Hi ${recipientName}, ${data.bidderName} placed a bid on "${data.itemTitle}".

Bid amount: ${formatPrice(data.bidAmount)}
Total bids: ${String(data.totalBids)}`;

  return { subject, html, text };
}
