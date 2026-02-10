import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type PurchaseConfirmedData = {
  itemId: string;
  itemTitle: string;
  price: number;
  sellerId: string;
  sellerName: string;
};

export function formatPurchaseConfirmedEmail(
  recipientName: string,
  data: PurchaseConfirmedData,
): EmailContent {
  const subject = `Purchase confirmed: "${data.itemTitle}"`;

  const html = wrapHtml(`
  <h2>Purchase confirmed</h2>
  <p>Hi ${recipientName}, your purchase of <strong>${data.itemTitle}</strong> has been confirmed.</p>
  <p><strong>Price:</strong> ${formatPrice(data.price)}</p>
  <p><strong>Seller:</strong> ${data.sellerName}</p>
  <p>Please contact the seller to arrange payment and delivery.</p>`);

  const text = `Purchase confirmed

Hi ${recipientName}, your purchase of "${data.itemTitle}" has been confirmed.

Price: ${formatPrice(data.price)}
Seller: ${data.sellerName}

Please contact the seller to arrange payment and delivery.`;

  return { subject, html, text };
}
