import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runDraftPipeline } from "@/lib/draft/pipeline";
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
    .select("id, dossier, organization_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.dossier) return NextResponse.json({ error: "no_dossier" }, { status: 422 });

  // Usage cap check (drafts share the same cap as research)
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

  // Try Inngest first
  let inngestSent = false;
  try {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "outreachforge/lead.draft.requested",
      data: { leadId },
    });
    inngestSent = true;
  } catch {
    // Inngest not available — fall back to direct execution
  }

  if (!inngestSent) {
    after(async () => {
      try {
        await runDraftPipeline(leadId);
      } catch (err) {
        console.error("[draft] pipeline failed for lead", leadId, err);
      }
    });
  }

  return NextResponse.json({ success: true });
}
