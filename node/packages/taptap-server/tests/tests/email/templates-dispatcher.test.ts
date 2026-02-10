import { expect } from "chai";
import { formatEmailForNotificationType } from "../../../src/email/templates.js";

describe("Email - Templates Dispatcher", () => {
  it("should dispatch AUCTION_WON to auction won formatter", () => {
    const result = formatEmailForNotificationType("AUCTION_WON", "Bob", {
      itemId: "item-1",
      itemTitle: "Camera",
      auctionId: "auction-1",
      finalPrice: 100,
      sellerId: "seller-1",
      sellerName: "Jane",
    });
    expect(result.subject).to.include("Camera");
    expect(result.html).to.include("Congratulations");
  });

  it("should dispatch ITEM_SOLD to item sold formatter", () => {
    const result = formatEmailForNotificationType("ITEM_SOLD", "Jane", {
      itemId: "item-1",
      itemTitle: "Book",
      auctionId: "auction-1",
      finalPrice: 50,
      buyerId: "buyer-1",
      buyerName: "Bob",
    });
    expect(result.subject).to.include("Book");
    expect(result.html).to.include("sold");
  });

  it("should dispatch OUTBID to outbid formatter", () => {
    const result = formatEmailForNotificationType("OUTBID", "Bob", {
      itemId: "item-1",
      itemTitle: "Vase",
      auctionId: "auction-1",
      newHighBid: 200,
      yourBid: 150,
    });
    expect(result.subject).to.include("outbid");
    expect(result.html).to.include("$200.00");
  });

  it("should dispatch NEW_ITEM_CHAT_MESSAGE to chat message formatter", () => {
    const result = formatEmailForNotificationType("NEW_ITEM_CHAT_MESSAGE", "Bob", {
      itemId: "item-1",
      itemTitle: "Console",
      chatId: "chat-1",
      senderName: "Alice",
      messagePreview: "Is this available?",
    });
    expect(result.subject).to.include("Console");
    expect(result.html).to.include("Is this available?");
  });

  it("should return fallback for unknown notification type", () => {
    const result = formatEmailForNotificationType("UNKNOWN_TYPE", "Bob", {});
    expect(result.subject).to.equal("Notification from Lesser");
    expect(result.html).to.include("new notification");
    expect(result.text).to.include("new notification");
  });
});
