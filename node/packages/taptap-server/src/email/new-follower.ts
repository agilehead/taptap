import { type EmailContent, wrapHtml } from "./types.js";

type NewFollowerData = {
  followerId: string;
  followerName: string;
  followerUsername: string;
};

export function formatNewFollowerEmail(
  recipientName: string,
  data: NewFollowerData,
): EmailContent {
  const subject = `${data.followerName} started following you`;

  const html = wrapHtml(`
  <h2>New follower</h2>
  <p>Hi ${recipientName}, <strong>${data.followerName}</strong> (@${data.followerUsername}) is now following you on Lesser.</p>
  <p>Check out their profile and listings.</p>`);

  const text = `New follower

Hi ${recipientName}, ${data.followerName} (@${data.followerUsername}) is now following you on Lesser.

Check out their profile and listings.`;

  return { subject, html, text };
}
