import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/settings?error=gmail_denied`
    );
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=gmail_no_refresh_token`
      );
    }

    // Get the user's Gmail address
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const gmailEmail = userInfo.email ?? "";

    // Store encrypted refresh token
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${appUrl}/login`);
    }

    const encryptedToken = encrypt(tokens.refresh_token);
    await supabase
      .from("user_settings")
      .update({
        gmail_refresh_token: encryptedToken,
        gmail_email: gmailEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.redirect(`${appUrl}/settings?gmail=connected`);
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/settings?error=gmail_failed`);
  }
}
