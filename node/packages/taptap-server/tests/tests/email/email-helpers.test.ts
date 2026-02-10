import { expect } from "chai";
import { formatPrice, wrapHtml } from "../../../src/email/types.js";

describe("Email Helpers", () => {
  describe("formatPrice", () => {
    it("should format whole number price", () => {
      expect(formatPrice(100)).to.equal("$100.00");
    });

    it("should format price with cents", () => {
      expect(formatPrice(49.99)).to.equal("$49.99");
    });

    it("should format zero price", () => {
      expect(formatPrice(0)).to.equal("$0.00");
    });

    it("should round to two decimal places", () => {
      expect(formatPrice(10.999)).to.equal("$11.00");
    });

    it("should format large price", () => {
      expect(formatPrice(99999.5)).to.equal("$99999.50");
    });
  });

  describe("wrapHtml", () => {
    it("should wrap content in HTML document structure", () => {
      const result = wrapHtml("<p>Hello</p>");
      expect(result).to.include("<!DOCTYPE html>");
      expect(result).to.include("<html>");
      expect(result).to.include("</html>");
      expect(result).to.include("<body");
      expect(result).to.include("</body>");
    });

    it("should include content in body", () => {
      const result = wrapHtml("<p>Test content</p>");
      expect(result).to.include("<p>Test content</p>");
    });

    it("should include meta charset", () => {
      const result = wrapHtml("");
      expect(result).to.include('<meta charset="utf-8">');
    });

    it("should include viewport meta", () => {
      const result = wrapHtml("");
      expect(result).to.include("viewport");
    });

    it("should include footer text", () => {
      const result = wrapHtml("");
      expect(result).to.include("This email was sent by Lesser");
    });
  });
});
