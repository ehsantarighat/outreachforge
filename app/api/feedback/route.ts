import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = (await req.json()) as { message?: string; page?: string };
  const { message, page } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const feedbackEmail = process.env.FEEDBACK_EMAIL ?? process.env.FROM_EMAIL ?? "feedback@outreachforge.com";

  if (!resendKey) {
    // Log to console if Resend not configured
    console.log("[feedback]", { from: user?.email, page, message });
    return NextResponse.json({ success: true });
  }

  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: "OutreachForge Feedback <noreply@outreachforge.com>",
    to: feedbackEmail,
    subject: `Feedback from ${user?.email ?? "anonymous"} — ${page ?? "app"}`,
    text: [
      `From: ${user?.email ?? "Not logged in"}`,
      `Page: ${page ?? "unknown"}`,
      ``,
      message,
    ].join("\n"),
  });

  return NextResponse.json({ success: true });
}
