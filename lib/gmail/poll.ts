import { getGmailClient } from "./client";

/**
 * Checks a Gmail thread for replies.
 * Returns true if there is at least one message in the thread
 * that was NOT sent by the connected user (i.e. a reply exists).
 */
export async function hasReply({
  refreshToken,
  threadId,
  senderEmail,
}: {
  refreshToken: string;
  threadId: string;
  senderEmail: string;
}): Promise<boolean> {
  const gmail = getGmailClient(refreshToken);

  try {
    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "metadata",
      metadataHeaders: ["From"],
    });

    const messages = thread.data.messages ?? [];
    if (messages.length <= 1) return false;

    // Check if any message after the first is NOT from the sender
    for (const msg of messages.slice(1)) {
      const fromHeader = msg.payload?.headers?.find(
        (h) => h.name?.toLowerCase() === "from"
      );
      const from = fromHeader?.value ?? "";
      if (!from.toLowerCase().includes(senderEmail.toLowerCase())) {
        return true;
      }
    }

    return false;
  } catch {
    // Thread may have been deleted or token may be invalid — skip silently
    return false;
  }
}
