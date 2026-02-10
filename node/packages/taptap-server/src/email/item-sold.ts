import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type ItemSoldData = {
  itemId: string;
  itemTitle: string;
  auctionId: string;
  finalPrice: number;
  buyerId: string;
  buyerName: string;
};

export function formatItemSoldEmail(
  recipientName: string,
  data: ItemSoldData,
): EmailContent {
  const subject = `Your item "${data.itemTitle}" has been sold`;

  const html = wrapHtml(`
  <h2>Your item has been sold!</h2>
  <p>Hi ${recipientName}, your item <strong>${data.itemTitle}</strong> has been sold.</p>
  <p><strong>Final price:</strong> ${formatPrice(data.finalPrice)}</p>
  <p><strong>Buyer:</strong> ${data.buyerName}</p>
  <p>Please contact the buyer to arrange payment and delivery.</p>`);

  const text = `Your item has been sold!

Hi ${recipientName}, your item "${data.itemTitle}" has been sold.

Final price: ${formatPrice(data.finalPrice)}
Buyer: ${data.buyerName}

Please contact the buyer to arrange payment and delivery.`;

  return { subject, html, text };
}
