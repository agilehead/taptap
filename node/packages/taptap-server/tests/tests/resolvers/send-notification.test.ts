import { expect } from "chai";
import { graphqlUrl, truncateEmailQueue, queueRepo } from "../../setup.js";
import { SEND_NOTIFICATION_MUTATION } from "../../graphql/operations/notifications.js";

type SendNotificationResult = {
  sendNotification: {
    success: boolean;
    error: string | null;
  };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

async function sendNotification(
  input: Record<string, unknown>,
): Promise<GraphQLResponse<SendNotificationResult>> {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEND_NOTIFICATION_MUTATION,
      variables: { input },
    }),
  });
  return (await response.json()) as GraphQLResponse<SendNotificationResult>;
}

describe("sendNotification Mutation", () => {
  beforeEach(() => {
    truncateEmailQueue();
  });

  it("should send AUCTION_WON notification successfully", async () => {
    const result = await sendNotification({
      type: "AUCTION_WON",
      recipient: {
        id: "user-1",
        email: "winner@test.com",
        name: "Winner",
      },
      data: JSON.stringify({
        itemId: "item-1",
        itemTitle: "Camera",
        auctionId: "auction-1",
        finalPrice: 100,
        sellerId: "seller-1",
        sellerName: "Seller",
      }),
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendNotification.success).to.equal(true);
    expect(result.data?.sendNotification.error).to.equal(null);

    // Verify queued
    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.notificationType).to.equal("AUCTION_WON");
  });

  it("should send ITEM_SOLD notification successfully", async () => {
    const result = await sendNotification({
      type: "ITEM_SOLD",
      recipient: {
        id: "seller-1",
        email: "seller@test.com",
        name: "Seller",
      },
      data: JSON.stringify({
        itemId: "item-1",
        itemTitle: "Book",
        auctionId: "auction-1",
        finalPrice: 50,
        buyerId: "buyer-1",
        buyerName: "Buyer",
      }),
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendNotification.success).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.notificationType).to.equal("ITEM_SOLD");
  });

  it("should send OUTBID notification successfully", async () => {
    const result = await sendNotification({
      type: "OUTBID",
      recipient: {
        id: "bidder-1",
        email: "bidder@test.com",
        name: "Bidder",
      },
      data: JSON.stringify({
        itemId: "item-1",
        itemTitle: "Vase",
        auctionId: "auction-1",
        newHighBid: 200,
        yourBid: 150,
      }),
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendNotification.success).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.notificationType).to.equal("OUTBID");
  });

  it("should send NEW_ITEM_CHAT_MESSAGE notification successfully", async () => {
    const result = await sendNotification({
      type: "NEW_ITEM_CHAT_MESSAGE",
      recipient: {
        id: "user-1",
        email: "user@test.com",
        name: "User",
      },
      data: JSON.stringify({
        itemId: "item-1",
        itemTitle: "Console",
        chatId: "chat-1",
        senderName: "Alice",
        messagePreview: "Is this available?",
      }),
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendNotification.success).to.equal(true);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(1);
    expect(pending[0]?.notificationType).to.equal("NEW_ITEM_CHAT_MESSAGE");
  });

  it("should return error for invalid JSON in data field", async () => {
    const result = await sendNotification({
      type: "AUCTION_WON",
      recipient: {
        id: "user-1",
        email: "user@test.com",
        name: "User",
      },
      data: "not valid json {{{",
    });

    expect(result.errors).to.equal(undefined);
    expect(result.data?.sendNotification.success).to.equal(false);
    expect(result.data?.sendNotification.error).to.include("Invalid JSON");
  });

  it("should return GraphQL error for missing required fields", async () => {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: SEND_NOTIFICATION_MUTATION,
        variables: {
          input: {
            type: "AUCTION_WON",
            // Missing recipient and data
          },
        },
      }),
    });

    const result = (await response.json()) as GraphQLResponse<SendNotificationResult>;
    expect(result.errors).to.not.equal(undefined);
  });

  it("should return GraphQL error for invalid notification type", async () => {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: SEND_NOTIFICATION_MUTATION,
        variables: {
          input: {
            type: "INVALID_TYPE",
            recipient: {
              id: "user-1",
              email: "user@test.com",
              name: "User",
            },
            data: "{}",
          },
        },
      }),
    });

    const result = (await response.json()) as GraphQLResponse<SendNotificationResult>;
    expect(result.errors).to.not.equal(undefined);
  });
});
