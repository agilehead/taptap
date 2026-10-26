import { expect } from "chai";
import { throttleRepo, truncateEmailQueue } from "../../setup.js";

describe("Throttle Repository", () => {
  beforeEach(() => {
    truncateEmailQueue();
  });

  describe("isThrottled", () => {
    it("should return false when no throttle record exists", () => {
      const result = throttleRepo.isThrottled("email", "alerts", "user-1", "item-1", 60000);
      expect(result).to.equal(false);
    });

    it("should return true when within throttle interval", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      const result = throttleRepo.isThrottled("email", "alerts", "user-1", "item-1", 60000);
      expect(result).to.equal(true);
    });

    it("should return false when throttle interval has expired", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      // Check with 0ms interval (already expired)
      const result = throttleRepo.isThrottled("email", "alerts", "user-1", "item-1", 0);
      expect(result).to.equal(false);
    });

    it("should not throttle different recipients", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      const result = throttleRepo.isThrottled("email", "alerts", "user-2", "item-1", 60000);
      expect(result).to.equal(false);
    });

    it("should not throttle different contexts", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      const result = throttleRepo.isThrottled("email", "alerts", "user-1", "item-2", 60000);
      expect(result).to.equal(false);
    });

    it("should not throttle different categories", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      const result = throttleRepo.isThrottled("email", "welcome", "user-1", "item-1", 60000);
      expect(result).to.equal(false);
    });

    it("should not throttle different channels", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      const result = throttleRepo.isThrottled("sms", "alerts", "user-1", "item-1", 60000);
      expect(result).to.equal(false);
    });
  });

  describe("recordSent", () => {
    it("should create a new throttle record", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      const result = throttleRepo.isThrottled("email", "alerts", "user-1", "item-1", 60000);
      expect(result).to.equal(true);
    });

    it("should update existing record on duplicate (UPSERT)", () => {
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      // Should not throw on second call (UPSERT)
      throttleRepo.recordSent("email", "alerts", "user-1", "item-1");
      const result = throttleRepo.isThrottled("email", "alerts", "user-1", "item-1", 60000);
      expect(result).to.equal(true);
    });
  });
});
