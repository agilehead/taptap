const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;

export const THROTTLE_INTERVALS: Record<string, number | null> = {
  AUCTION_WON: null,
  AUCTION_ENDING_SOON: null,
  NEW_BID_ON_YOUR_ITEM: 15 * MINUTES,
  OUTBID: 15 * MINUTES,
  ITEM_SOLD: null,
  PURCHASE_CONFIRMED: null,
  NEW_ITEM_CHAT_MESSAGE: 8 * HOURS,
  NEW_DIRECT_MESSAGE: 8 * HOURS,
  NEW_FOLLOWER: 1 * HOURS,
  NEW_REVIEW: null,
  VOUCHED_FOR_YOU: null,
  VERIFICATION_APPROVED: null,
  WATCHED_ITEM_PRICE_DROP: null,
  WATCHED_ITEM_ENDING_SOON: null,
  SAVED_SEARCH_MATCH: 1 * HOURS,
  ITEM_REMOVED: null,
  ITEM_APPROVED: null,
  ACCOUNT_WARNING: null,
};

function getStringValue(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

export function getContextIdFromData(
  notificationType: string,
  data: Record<string, unknown>,
): string {
  switch (notificationType) {
    case "NEW_ITEM_CHAT_MESSAGE":
    case "NEW_BID_ON_YOUR_ITEM":
    case "OUTBID":
    case "AUCTION_ENDING_SOON":
    case "WATCHED_ITEM_ENDING_SOON":
    case "WATCHED_ITEM_PRICE_DROP":
      return getStringValue(data.itemId, "unknown");
    case "NEW_DIRECT_MESSAGE":
      return getStringValue(data.senderId, "unknown");
    case "NEW_FOLLOWER":
      return getStringValue(data.followerId, "unknown");
    case "SAVED_SEARCH_MATCH":
      return getStringValue(data.searchId, "unknown");
    default:
      return "none";
  }
}

export function shouldThrottle(notificationType: string): boolean {
  return THROTTLE_INTERVALS[notificationType] !== null;
}

export function getThrottleInterval(notificationType: string): number | null {
  return THROTTLE_INTERVALS[notificationType] ?? null;
}
