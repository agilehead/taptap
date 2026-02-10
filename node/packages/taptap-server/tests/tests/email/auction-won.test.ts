import { expect } from "chai";
import { formatAuctionWonEmail } from "../../../src/email/auction-won.js";

describe("Email - Auction Won", () => {
  const data = {
    itemId: "item-1",
    itemTitle: "Vintage Camera",
    auctionId: "auction-1",
    finalPrice: 150.5,
    sellerId: "seller-1",
    sellerName: "Jane Seller",
  };

  it("should include item title in subject", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result.subject).to.include("Vintage Camera");
  });

  it("should include recipient name in HTML body", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result.html).to.include("Bob");
  });

  it("should include formatted price in HTML body", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result.html).to.include("$150.50");
  });

  it("should include seller name in HTML body", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result.html).to.include("Jane Seller");
  });

  it("should include item title in text body", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result.text).to.include("Vintage Camera");
  });

  it("should include formatted price in text body", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result.text).to.include("$150.50");
  });

  it("should include seller name in text body", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result.text).to.include("Jane Seller");
  });

  it("should return subject, html, and text fields", () => {
    const result = formatAuctionWonEmail("Bob", data);
    expect(result).to.have.property("subject");
    expect(result).to.have.property("html");
    expect(result).to.have.property("text");
  });
});
