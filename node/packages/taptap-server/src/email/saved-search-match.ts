import { type EmailContent, formatPrice, wrapHtml } from "./types.js";

type SavedSearchMatchData = {
  searchId: string;
  searchQuery: string;
  itemId: string;
  itemTitle: string;
  price: number;
  sellerName: string;
};

export function formatSavedSearchMatchEmail(
  recipientName: string,
  data: SavedSearchMatchData,
): EmailContent {
  const subject = `New match for "${data.searchQuery}"`;

  const html = wrapHtml(`
  <h2>New item matches your search</h2>
  <p>Hi ${recipientName}, a new item matches your saved search "<strong>${data.searchQuery}</strong>".</p>
  <p><strong>${data.itemTitle}</strong></p>
  <p><strong>Price:</strong> ${formatPrice(data.price)}</p>
  <p><strong>Seller:</strong> ${data.sellerName}</p>`);

  const text = `New item matches your search

Hi ${recipientName}, a new item matches your saved search "${data.searchQuery}".

${data.itemTitle}
Price: ${formatPrice(data.price)}
Seller: ${data.sellerName}`;

  return { subject, html, text };
}
