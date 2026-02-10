import { expect } from "chai";
import { queueRepo, truncateEmailQueue } from "../../setup.js";
import { createQueueProvider } from "../../../src/providers/queue.js";

describe("Queue Provider", () => {
  beforeEach(() => {
    truncateEmailQueue();
  });

  it("should enqueue a notification with formatted email", async () => {
    const provider = createQueueProvider(queueRepo);

    const result = await provider.send({
      type: "AUCTION_WON",
      recipient: {
        id: "user-1",
        email: "winner@test.com",
        name: "Winner",
      },
      data: {
        itemId: "item-1",
        itemTitle: "Vintage Camera",
        auctionId: "auction-1",
        finalPrice: 250,
        sellerId: "seller-1",
        sellerName: "Seller",
      },
    });

    expect(result.success).to.equal(true);

    // Verify item was queued
    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.recipientEmail).to.equal("winner@test.com");
    expect(pending[0]?.recipientName).to.equal("Winner");
    expect(pending[0]?.notificationType).to.equal("AUCTION_WON");
    expect(pending[0]?.subject).to.include("Vintage Camera");
    expect(pending[0]?.bodyHtml).to.include("Congratulations");
    expect(pending[0]?.bodyText).to.include("Vintage Camera");
  });

  it("should enqueue ITEM_SOLD notification", async () => {
    const provider = createQueueProvider(queueRepo);

    const result = await provider.send({
      type: "ITEM_SOLD",
      recipient: {
        id: "seller-1",
        email: "seller@test.com",
        name: "Seller",
      },
      data: {
        itemId: "item-1",
        itemTitle: "Book",
        auctionId: "auction-1",
        finalPrice: 30,
        buyerId: "buyer-1",
        buyerName: "Buyer",
      },
    });

    expect(result.success).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.notificationType).to.equal("ITEM_SOLD");
    expect(pending[0]?.subject).to.include("Book");
  });

  it("should enqueue OUTBID notification", async () => {
    const provider = createQueueProvider(queueRepo);

    const result = await provider.send({
      type: "OUTBID",
      recipient: {
        id: "bidder-1",
        email: "bidder@test.com",
        name: "Bidder",
      },
      data: {
        itemId: "item-1",
        itemTitle: "Vase",
        auctionId: "auction-1",
        newHighBid: 100,
        yourBid: 80,
      },
    });

    expect(result.success).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.notificationType).to.equal("OUTBID");
  });

  it("should enqueue NEW_ITEM_CHAT_MESSAGE notification", async () => {
    const provider = createQueueProvider(queueRepo);

    const result = await provider.send({
      type: "NEW_ITEM_CHAT_MESSAGE",
      recipient: {
        id: "user-1",
        email: "user@test.com",
        name: "User",
      },
      data: {
        itemId: "item-1",
        itemTitle: "Console",
        chatId: "chat-1",
        senderName: "Sender",
        messagePreview: "Hello!",
      },
    });

    expect(result.success).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.notificationType).to.equal("NEW_ITEM_CHAT_MESSAGE");
    expect(pending[0]?.subject).to.include("Console");
  });

  it("should store notification data as JSON", async () => {
    const provider = createQueueProvider(queueRepo);

    await provider.send({
      type: "AUCTION_WON",
      recipient: {
        id: "user-1",
        email: "user@test.com",
        name: "User",
      },
      data: {
        itemId: "item-1",
        itemTitle: "Camera",
        auctionId: "auction-1",
        finalPrice: 100,
        sellerId: "seller-1",
        sellerName: "Seller",
      },
    });

    const pending = queueRepo.findPending(10);
    const data = pending[0]?.data ?? "{}";
    const parsed = JSON.parse(data) as Record<string, unknown>;
    expect(parsed.itemId).to.equal("item-1");
    expect(parsed.finalPrice).to.equal(100);
  });
});
