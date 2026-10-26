import assert from "node:assert/strict";
import { createSmtpEmailProvider } from "../apps/server/dist/providers/email/smtp.js";
const [host, port, secure, rejection] = process.argv.slice(2);
assert([undefined, "reject-auth", "reject-certificate"].includes(rejection));
const provider = createSmtpEmailProvider({
  host,
  port: Number(port),
  secure: secure === "true",
  user: "test-user",
  password: rejection === "reject-auth" ? "wrong-password" : "test-password",
});
const result = await provider.send({
  from: { email: "from@example.test", name: "From 東京" },
  to: [
    { email: "to@example.test", name: "To 東京" },
    { email: "second@example.test", name: "Second" },
  ],
  replyTo: { email: "reply@example.test", name: "Reply" },
  subject: "Subject 東京",
  html: "<p>HTML 東京</p>",
  text: "Text 東京",
});
assert.equal(result.success, rejection === undefined, result.error);
if (rejection !== undefined) assert.equal(typeof result.error, "string");
console.info("SMTP provider probe passed");
