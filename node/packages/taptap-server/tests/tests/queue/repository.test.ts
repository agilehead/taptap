import { expect } from "chai";
import { queueRepo, truncateEmailQueue } from "../../setup.js";

describe("Email Queue Repository", () => {
  beforeEach(() => {
    truncateEmailQueue();
  });

  describe("create", () => {
    it("should create a queue item with pending status", () => {
      const item = queueRepo.create({
        id: "test-1",
        templateName: null,
        category: "order-update",
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "Test User",
        subject: "You won!",
        bodyHtml: "<p>You won!</p>",
        bodyText: "You won!",
        metadata: JSON.stringify({ itemId: "item-1" }),
      });

      expect(item.id).to.equal("test-1");
      expect(item.category).to.equal("order-update");
      expect(item.recipientId).to.equal("user-1");
      expect(item.recipientEmail).to.equal("user@test.com");
      expect(item.recipientName).to.equal("Test User");
      expect(item.subject).to.equal("You won!");
      expect(item.status).to.equal("pending");
      expect(item.attempts).to.equal(0);
      expect(item.lastError).to.equal(null);
      expect(item.sentAt).to.equal(null);
      expect(item.createdAt).to.be.a("string");
    });

    it("should store body HTML and text", () => {
      const item = queueRepo.create({
        id: "test-2",
        templateName: null,
        category: null,
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "Test User",
        subject: "Item sold",
        bodyHtml: "<h1>Sold!</h1>",
        bodyText: "Sold!",
        metadata: null,
      });

      expect(item.bodyHtml).to.equal("<h1>Sold!</h1>");
      expect(item.bodyText).to.equal("Sold!");
    });
  });

  describe("findPending", () => {
    it("should return empty array when no pending items", () => {
      const items = queueRepo.findPending(10);
      expect(items).to.have.length(0);
    });

    it("should return pending items", () => {
      queueRepo.create({
        id: "test-1",
        templateName: null,
        category: "alerts",
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        metadata: null,
      });

      const items = queueRepo.findPending(10);
      expect(items).to.have.length(1);
      expect(items[0]?.id).to.equal("test-1");
    });

    it("should respect limit parameter", () => {
      for (let i = 0; i < 5; i++) {
        queueRepo.create({
          id: `test-${String(i)}`,
          templateName: null,
          category: null,
          recipientId: "user-1",
          recipientEmail: "user@test.com",
          recipientName: "User",
          subject: "Subject",
          bodyHtml: "<p>Body</p>",
          bodyText: "Body",
          metadata: null,
        });
      }

      const items = queueRepo.findPending(3);
      expect(items).to.have.length(3);
    });

    it("should not return items with non-pending status", () => {
      queueRepo.create({
        id: "test-sent",
        templateName: null,
        category: null,
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        metadata: null,
      });
      queueRepo.markSending("test-sent");
      queueRepo.markSent("test-sent");

      queueRepo.create({
        id: "test-pending",
        templateName: null,
        category: null,
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        metadata: null,
      });

      const items = queueRepo.findPending(10);
      expect(items).to.have.length(1);
      expect(items[0]?.id).to.equal("test-pending");
    });
  });

  describe("markSending", () => {
    it("should update status to sending", () => {
      queueRepo.create({
        id: "test-1",
        templateName: null,
        category: null,
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        metadata: null,
      });

      queueRepo.markSending("test-1");

      // Should no longer appear in pending
      const pending = queueRepo.findPending(10);
      expect(pending).to.have.length(0);
    });
  });

  describe("markSent", () => {
    it("should update status to sent with timestamp", () => {
      queueRepo.create({
        id: "test-1",
        templateName: null,
        category: null,
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        metadata: null,
      });

      queueRepo.markSending("test-1");
      queueRepo.markSent("test-1");

      // Should not appear in pending
      const pending = queueRepo.findPending(10);
      expect(pending).to.have.length(0);
    });
  });

  describe("markFailed", () => {
    it("should set status back to pending when under max attempts", () => {
      queueRepo.create({
        id: "test-1",
        templateName: null,
        category: null,
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        metadata: null,
      });

      queueRepo.markSending("test-1");
      queueRepo.markFailed("test-1", "Connection timeout", 3);

      // Should reappear in pending (attempts = 1, max = 3)
      const pending = queueRepo.findPending(10);
      expect(pending).to.have.length(1);
      expect(pending[0]?.id).to.equal("test-1");
    });

    it("should set status to failed when max attempts reached", () => {
      queueRepo.create({
        id: "test-1",
        templateName: null,
        category: null,
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        metadata: null,
      });

      // Fail 3 times (maxAttempts = 3)
      queueRepo.markFailed("test-1", "Error 1", 3);
      queueRepo.markFailed("test-1", "Error 2", 3);
      queueRepo.markFailed("test-1", "Error 3", 3);

      // Should NOT appear in pending (permanently failed)
      const pending = queueRepo.findPending(10);
      expect(pending).to.have.length(0);
    });

    it("should do nothing for non-existent id", () => {
      // Should not throw
      queueRepo.markFailed("non-existent", "Error", 3);
    });
  });
});
