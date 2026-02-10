import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type AuctionWonData = {
  itemId: string;
  itemTitle: string;
  auctionId: string;
  finalPrice: number;
  sellerId: string;
  sellerName: string;
};

export function formatAuctionWonEmail(
  recipientName: string,
  data: AuctionWonData,
): EmailContent {
  const subject = `You won the auction for "${data.itemTitle}"`;

  const html = wrapHtml(`
  <h2>Congratulations, ${recipientName}!</h2>
  <p>You won the auction for <strong>${data.itemTitle}</strong>.</p>
  <p><strong>Final price:</strong> ${formatPrice(data.finalPrice)}</p>
  <p><strong>Seller:</strong> ${data.sellerName}</p>
  <p>Please contact the seller to arrange payment and delivery.</p>`);

  const text = `Congratulations, ${recipientName}!

You won the auction for "${data.itemTitle}".

Final price: ${formatPrice(data.finalPrice)}
Seller: ${data.sellerName}

Please contact the seller to arrange payment and delivery.`;

  return { subject, html, text };
}
