import { expect } from "chai";
import { formatItemSoldEmail } from "../../../src/email/item-sold.js";

describe("Email - Item Sold", () => {
  const data = {
    itemId: "item-1",
    itemTitle: "Rare Book",
    auctionId: "auction-1",
    finalPrice: 75,
    buyerId: "buyer-1",
    buyerName: "Alice Buyer",
  };

  it("should include item title in subject", () => {
    const result = formatItemSoldEmail("Jane", data);
    expect(result.subject).to.include("Rare Book");
  });

  it("should include recipient name in HTML body", () => {
    const result = formatItemSoldEmail("Jane", data);
    expect(result.html).to.include("Jane");
  });

  it("should include formatted price in HTML body", () => {
    const result = formatItemSoldEmail("Jane", data);
    expect(result.html).to.include("$75.00");
  });

  it("should include buyer name in HTML body", () => {
    const result = formatItemSoldEmail("Jane", data);
    expect(result.html).to.include("Alice Buyer");
  });

  it("should include item title in text body", () => {
    const result = formatItemSoldEmail("Jane", data);
    expect(result.text).to.include("Rare Book");
  });

  it("should include formatted price in text body", () => {
    const result = formatItemSoldEmail("Jane", data);
    expect(result.text).to.include("$75.00");
  });

  it("should include buyer name in text body", () => {
    const result = formatItemSoldEmail("Jane", data);
    expect(result.text).to.include("Alice Buyer");
  });
});
