import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const orgId = lead.organization_id as string;

  // Try Inngest first (works when dev server is running or in production).
  // If unavailable, fall back to a direct background update via after().
  let inngestSent = false;
  try {
    const { inngest } = await import("@/inngest/client");
    await inngest.send({
      name: "outreachforge/lead.research.requested",
      data: { leadId },
    });
    inngestSent = true;
  } catch {
    // Inngest dev server not running — use fallback below
  }

  if (!inngestSent) {
    // Fallback: simulate the placeholder job via after()
    after(async () => {
      await new Promise((r) => setTimeout(r, 2000));
      const admin = createAdminClient();
      await admin
        .from("leads")
        .update({ status: "researched", updated_at: new Date().toISOString() })
        .eq("id", leadId);
      await admin.from("activity_log").insert({
        lead_id: leadId,
        organization_id: orgId,
        event_type: "researched",
        metadata: { note: "Research completed (placeholder)." },
      });
    });
  }

  return NextResponse.json({ success: true });
}
