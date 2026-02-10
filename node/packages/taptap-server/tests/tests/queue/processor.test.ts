import { expect } from "chai";
import { queueRepo, truncateEmailQueue, serverBaseUrl, cronSecret } from "../../setup.js";

type ProcessQueueResult = {
  processed: number;
  sent: number;
  failed: number;
};

async function callProcessQueue(): Promise<ProcessQueueResult> {
  const response = await fetch(`${serverBaseUrl}/internal/cron/process-queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cronSecret}`,
    },
  });
  return (await response.json()) as ProcessQueueResult;
}

describe("Email Queue Processor", () => {
  beforeEach(() => {
    truncateEmailQueue();
  });

  it("should process pending emails", async () => {
    queueRepo.create({
      id: "proc-1",
      notificationType: "AUCTION_WON",
      recipientId: "user-1",
      recipientEmail: "user@test.com",
      recipientName: "User",
      subject: "You won!",
      bodyHtml: "<p>Won</p>",
      bodyText: "Won",
      data: "{}",
    });

    const result = await callProcessQueue();

    expect(result.processed).to.equal(1);
    expect(result.sent).to.equal(1);
    expect(result.failed).to.equal(0);

    // Item should now be marked as sent
    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(0);
  });

  it("should return zeros when no pending emails", async () => {
    const result = await callProcessQueue();

    expect(result.processed).to.equal(0);
    expect(result.sent).to.equal(0);
    expect(result.failed).to.equal(0);
  });

  it("should process multiple emails in one batch", async () => {
    for (let i = 0; i < 3; i++) {
      queueRepo.create({
        id: `batch-${String(i)}`,
        notificationType: "AUCTION_WON",
        recipientId: "user-1",
        recipientEmail: "user@test.com",
        recipientName: "User",
        subject: `Email ${String(i)}`,
        bodyHtml: `<p>${String(i)}</p>`,
        bodyText: String(i),
        data: "{}",
      });
    }

    const result = await callProcessQueue();

    expect(result.processed).to.equal(3);
    expect(result.sent).to.equal(3);

    const pending = queueRepo.findPending(10);
    expect(pending).to.have.length(0);
  });

  it("should not process already-sent items", async () => {
    queueRepo.create({
      id: "already-sent",
      notificationType: "AUCTION_WON",
      recipientId: "user-1",
      recipientEmail: "user@test.com",
      recipientName: "User",
      subject: "Subject",
      bodyHtml: "<p>Body</p>",
      bodyText: "Body",
      data: "{}",
    });
    queueRepo.markSending("already-sent");
    queueRepo.markSent("already-sent");

    const result = await callProcessQueue();

    expect(result.processed).to.equal(0);
  });

  it("should require authentication", async () => {
    const response = await fetch(`${serverBaseUrl}/internal/cron/process-queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).to.equal(401);
  });

  it("should reject invalid cron secret", async () => {
    const response = await fetch(`${serverBaseUrl}/internal/cron/process-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer wrong-secret",
      },
    });

    expect(response.status).to.equal(401);
  });
});
