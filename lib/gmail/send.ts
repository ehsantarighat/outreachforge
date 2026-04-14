import { getGmailClient } from "./client";

/**
 * Sends a plain-text email via the Gmail API using the user's OAuth credentials.
 * Returns the Gmail message ID and thread ID.
 */
export async function sendGmailMessage({
  refreshToken,
  to,
  subject,
  body,
  senderName,
  senderEmail,
}: {
  refreshToken: string;
  to: string;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
}): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient(refreshToken);

  // Build RFC 2822 message
  const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
  const mimeLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `MIME-Version: 1.0`,
    ``,
    body,
  ];
  const raw = mimeLines.join("\r\n");

  // Base64url encode (Gmail requires base64url, not standard base64)
  const encoded = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  const messageId = response.data.id ?? "";
  const threadId = response.data.threadId ?? "";

  return { messageId, threadId };
}
