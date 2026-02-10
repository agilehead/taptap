import { expect } from "chai";
import { render } from "../../../src/templates/render.js";

describe("Template Rendering", () => {
  it("should replace variables with values", () => {
    const result = render("Hello {{name}}, welcome to {{app}}!", {
      name: "Alice",
      app: "TapTap",
    });
    expect(result).to.equal("Hello Alice, welcome to TapTap!");
  });

  it("should replace missing variables with empty string", () => {
    const result = render("Hello {{name}}, your order {{orderId}} is ready", {
      name: "Bob",
    });
    expect(result).to.equal("Hello Bob, your order  is ready");
  });

  it("should return template unchanged when no variables provided", () => {
    const result = render("Hello {{name}}!", {});
    expect(result).to.equal("Hello !");
  });

  it("should return template unchanged when no placeholders exist", () => {
    const result = render("Hello world!", { name: "Alice" });
    expect(result).to.equal("Hello world!");
  });

  it("should handle empty template", () => {
    const result = render("", { name: "Alice" });
    expect(result).to.equal("");
  });

  it("should handle multiple occurrences of the same variable", () => {
    const result = render("{{name}} said hello to {{name}}", { name: "Alice" });
    expect(result).to.equal("Alice said hello to Alice");
  });

  it("should not replace malformed placeholders", () => {
    const result = render("Hello {name} and {{name}}", { name: "Alice" });
    expect(result).to.equal("Hello {name} and Alice");
  });

  it("should handle special regex characters in values", () => {
    const result = render("Price: {{price}}", { price: "$10.00 (USD)" });
    expect(result).to.equal("Price: $10.00 (USD)");
  });
});
