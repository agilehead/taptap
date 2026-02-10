import { expect } from "chai";
import { formatOutbidEmail } from "../../../src/email/outbid.js";

describe("Email - Outbid", () => {
  const data = {
    itemId: "item-1",
    itemTitle: "Antique Vase",
    auctionId: "auction-1",
    newHighBid: 200,
    yourBid: 150,
  };

  it("should include item title in subject", () => {
    const result = formatOutbidEmail("Bob", data);
    expect(result.subject).to.include("Antique Vase");
  });

  it("should include new high bid in HTML body", () => {
    const result = formatOutbidEmail("Bob", data);
    expect(result.html).to.include("$200.00");
  });

  it("should include user's bid in HTML body", () => {
    const result = formatOutbidEmail("Bob", data);
    expect(result.html).to.include("$150.00");
  });

  it("should include recipient name in HTML body", () => {
    const result = formatOutbidEmail("Bob", data);
    expect(result.html).to.include("Bob");
  });

  it("should include new high bid in text body", () => {
    const result = formatOutbidEmail("Bob", data);
    expect(result.text).to.include("$200.00");
  });

  it("should include user's bid in text body", () => {
    const result = formatOutbidEmail("Bob", data);
    expect(result.text).to.include("$150.00");
  });
});
