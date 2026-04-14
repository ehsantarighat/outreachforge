import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { leadId?: string };
  const { leadId } = body;
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  // Verify lead belongs to user's org (RLS enforces this)
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await inngest.send({
    name: "outreachforge/lead.research.requested",
    data: { leadId },
  });

  return NextResponse.json({ success: true });
}
