import { type EmailContent, wrapHtml } from "./types.js";

type AccountWarningData = {
  reason: string;
  details?: string;
  warningLevel: "minor" | "major" | "final";
};

export function formatAccountWarningEmail(
  recipientName: string,
  data: AccountWarningData,
): EmailContent {
  const levelText =
    data.warningLevel === "final"
      ? "Final Warning"
      : data.warningLevel === "major"
        ? "Warning"
        : "Notice";

  const subject = `Account ${levelText}: Action required`;

  const detailsSection =
    data.details !== undefined
      ? `<p><strong>Details:</strong> ${data.details}</p>`
      : "";
  const detailsText =
    data.details !== undefined ? `\nDetails: ${data.details}` : "";

  const severityNote =
    data.warningLevel === "final"
      ? "<p style='color: #e74c3c;'><strong>This is a final warning. Further violations may result in account suspension.</strong></p>"
      : "";
  const severityText =
    data.warningLevel === "final"
      ? "\n\nThis is a final warning. Further violations may result in account suspension."
      : "";

  const html = wrapHtml(`
  <h2>Account ${levelText}</h2>
  <p>Hi ${recipientName}, your account has received a warning.</p>
  <p><strong>Reason:</strong> ${data.reason}</p>
  ${detailsSection}
  ${severityNote}
  <p>Please review our community guidelines to avoid future issues.</p>`);

  const text = `Account ${levelText}

Hi ${recipientName}, your account has received a warning.

Reason: ${data.reason}${detailsText}${severityText}

Please review our community guidelines to avoid future issues.`;

  return { subject, html, text };
}
