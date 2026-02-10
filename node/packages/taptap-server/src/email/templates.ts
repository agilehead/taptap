import type { EmailContent } from "./types.js";
import { wrapHtml } from "./types.js";

// Auction/Bidding
import { formatAuctionWonEmail } from "./auction-won.js";
import { formatAuctionEndingSoonEmail } from "./auction-ending-soon.js";
import { formatNewBidOnYourItemEmail } from "./new-bid-on-your-item.js";
import { formatOutbidEmail } from "./outbid.js";

// Sales
import { formatItemSoldEmail } from "./item-sold.js";
import { formatPurchaseConfirmedEmail } from "./purchase-confirmed.js";

// Messaging
import { formatNewItemChatMessageEmail } from "./new-item-chat-message.js";
import { formatNewDirectMessageEmail } from "./new-direct-message.js";

// Account/Trust
import { formatNewFollowerEmail } from "./new-follower.js";
import { formatNewReviewEmail } from "./new-review.js";
import { formatVouchedForYouEmail } from "./vouched-for-you.js";
import { formatVerificationApprovedEmail } from "./verification-approved.js";

// Watchlist/Alerts
import { formatWatchedItemPriceDropEmail } from "./watched-item-price-drop.js";
import { formatWatchedItemEndingSoonEmail } from "./watched-item-ending-soon.js";
import { formatSavedSearchMatchEmail } from "./saved-search-match.js";

// Moderation
import { formatItemRemovedEmail } from "./item-removed.js";
import { formatItemApprovedEmail } from "./item-approved.js";
import { formatAccountWarningEmail } from "./account-warning.js";

export function formatEmailForNotificationType(
  notificationType: string,
  recipientName: string,
  data: Record<string, unknown>,
): EmailContent {
  switch (notificationType) {
    // Auction/Bidding
    case "AUCTION_WON":
      return formatAuctionWonEmail(recipientName, data as never);
    case "AUCTION_ENDING_SOON":
      return formatAuctionEndingSoonEmail(recipientName, data as never);
    case "NEW_BID_ON_YOUR_ITEM":
      return formatNewBidOnYourItemEmail(recipientName, data as never);
    case "OUTBID":
      return formatOutbidEmail(recipientName, data as never);

    // Sales
    case "ITEM_SOLD":
      return formatItemSoldEmail(recipientName, data as never);
    case "PURCHASE_CONFIRMED":
      return formatPurchaseConfirmedEmail(recipientName, data as never);

    // Messaging
    case "NEW_ITEM_CHAT_MESSAGE":
      return formatNewItemChatMessageEmail(recipientName, data as never);
    case "NEW_DIRECT_MESSAGE":
      return formatNewDirectMessageEmail(recipientName, data as never);

    // Account/Trust
    case "NEW_FOLLOWER":
      return formatNewFollowerEmail(recipientName, data as never);
    case "NEW_REVIEW":
      return formatNewReviewEmail(recipientName, data as never);
    case "VOUCHED_FOR_YOU":
      return formatVouchedForYouEmail(recipientName, data as never);
    case "VERIFICATION_APPROVED":
      return formatVerificationApprovedEmail(recipientName, data as never);

    // Watchlist/Alerts
    case "WATCHED_ITEM_PRICE_DROP":
      return formatWatchedItemPriceDropEmail(recipientName, data as never);
    case "WATCHED_ITEM_ENDING_SOON":
      return formatWatchedItemEndingSoonEmail(recipientName, data as never);
    case "SAVED_SEARCH_MATCH":
      return formatSavedSearchMatchEmail(recipientName, data as never);

    // Moderation
    case "ITEM_REMOVED":
      return formatItemRemovedEmail(recipientName, data as never);
    case "ITEM_APPROVED":
      return formatItemApprovedEmail(recipientName, data as never);
    case "ACCOUNT_WARNING":
      return formatAccountWarningEmail(recipientName, data as never);

    default:
      return {
        subject: "Notification from Lesser",
        html: wrapHtml(`<p>You have a new notification on Lesser.</p>`),
        text: "You have a new notification on Lesser.",
      };
  }
}
