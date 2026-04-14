import { google } from "googleapis";

/**
 * Returns an authenticated Gmail API client given a decrypted refresh token.
 * Throws if GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set.
 */
export function getGmailClient(refreshToken: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set to use Gmail."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: "v1", auth: oauth2 });
}
