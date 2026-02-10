import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type WatchedItemPriceDropData = {
  itemId: string;
  itemTitle: string;
  oldPrice: number;
  newPrice: number;
  sellerName: string;
};

export function formatWatchedItemPriceDropEmail(
  recipientName: string,
  data: WatchedItemPriceDropData,
): EmailContent {
  const discount = Math.round(
    ((data.oldPrice - data.newPrice) / data.oldPrice) * 100,
  );
  const subject = `Price drop: "${data.itemTitle}" now ${formatPrice(data.newPrice)}`;

  const html = wrapHtml(`
  <h2>Price drop on watched item</h2>
  <p>Hi ${recipientName}, an item you're watching has dropped in price.</p>
  <p><strong>${data.itemTitle}</strong></p>
  <p><strong>New price:</strong> ${formatPrice(data.newPrice)} <span style="color: #e74c3c; text-decoration: line-through;">${formatPrice(data.oldPrice)}</span> (${String(discount)}% off)</p>
  <p><strong>Seller:</strong> ${data.sellerName}</p>`);

  const text = `Price drop on watched item

Hi ${recipientName}, an item you're watching has dropped in price.

${data.itemTitle}
New price: ${formatPrice(data.newPrice)} (was ${formatPrice(data.oldPrice)}, ${String(discount)}% off)
Seller: ${data.sellerName}`;

  return { subject, html, text };
}
