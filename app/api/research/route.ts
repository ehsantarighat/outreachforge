import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runResearchPipeline } from "@/lib/research/pipeline";
import { checkResearchCap } from "@/lib/stripe/checkCap";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { leadId?: string };
  const { leadId } = body;
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  // Verify lead belongs to user's org (RLS enforces this)
  const { data: lead } = await supabase
    .from("leads")
    .select("id, organization_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Usage cap check
  const cap = await checkResearchCap(lead.organization_id as string);
  if (!cap.allowed) {
    return NextResponse.json(
      {
        error: "cap_exceeded",
        message: `You've hit your ${cap.cap} lead cap for this period. Resets ${cap.resetLabel}.`,
        cap,
      },
      { status: 429 }
    );
  }

  // Try Inngest first (works when dev server or production cloud is configured)
  let inngestSent = false;
  try {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "outreachforge/lead.research.requested",
      data: { leadId },
    });
    inngestSent = true;
  } catch {
    // Inngest not available — fall back to direct execution
  }

  if (!inngestSent) {
    // Fallback: run the real research pipeline in the background via after()
    after(async () => {
      try {
        await runResearchPipeline(leadId);
      } catch (err) {
        console.error("[research] pipeline failed for lead", leadId, err);
      }
    });
  }

  return NextResponse.json({ success: true });
}
