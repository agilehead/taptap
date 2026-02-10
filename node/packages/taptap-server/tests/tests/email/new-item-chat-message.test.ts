import { expect } from "chai";
import { formatNewItemChatMessageEmail } from "../../../src/email/new-item-chat-message.js";

describe("Email - New Item Chat Message", () => {
  const data = {
    itemId: "item-1",
    itemTitle: "Gaming Console",
    chatId: "chat-1",
    senderName: "Alice",
    messagePreview: "Hi, is this still available?",
  };

  it("should include item title in subject", () => {
    const result = formatNewItemChatMessageEmail("Bob", data);
    expect(result.subject).to.include("Gaming Console");
  });

  it("should include sender name in subject", () => {
    const result = formatNewItemChatMessageEmail("Bob", data);
    expect(result.subject).to.include("Alice");
  });

  it("should include recipient name in HTML body", () => {
    const result = formatNewItemChatMessageEmail("Bob", data);
    expect(result.html).to.include("Bob");
  });

  it("should include message preview in HTML body", () => {
    const result = formatNewItemChatMessageEmail("Bob", data);
    expect(result.html).to.include("Hi, is this still available?");
  });

  it("should include sender name in HTML body", () => {
    const result = formatNewItemChatMessageEmail("Bob", data);
    expect(result.html).to.include("Alice");
  });

  it("should include message preview in text body", () => {
    const result = formatNewItemChatMessageEmail("Bob", data);
    expect(result.text).to.include("Hi, is this still available?");
  });

  it("should include sender name in text body", () => {
    const result = formatNewItemChatMessageEmail("Bob", data);
    expect(result.text).to.include("Alice");
  });
});
