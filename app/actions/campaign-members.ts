"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type MemberRole = "owner" | "editor" | "viewer";

export interface CampaignMember {
  id: string;
  campaign_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string | null;
  created_at: string;
  // joined from auth.users via admin client
  email?: string;
  display_name?: string;
}

// ─── Load members ─────────────────────────────────────────────────────────────

export async function loadCampaignMembers(
  campaignId: string
): Promise<CampaignMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_members")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Enrich with user emails via admin client
  const admin = createAdminClient();
  const userIds = data.map((m) => m.user_id as string);

  const enriched = await Promise.all(
    userIds.map(async (uid) => {
      const { data: user } = await admin.auth.admin.getUserById(uid);
      return {
        uid,
        email: user?.user?.email ?? uid,
        display_name: user?.user?.user_metadata?.full_name as string | undefined,
      };
    })
  );

  const userMap = new Map(enriched.map((u) => [u.uid, u]));

  return data.map((m) => ({
    id: m.id as string,
    campaign_id: m.campaign_id as string,
    user_id: m.user_id as string,
    role: m.role as MemberRole,
    invited_by: m.invited_by as string | null,
    created_at: m.created_at as string,
    email: userMap.get(m.user_id as string)?.email,
    display_name: userMap.get(m.user_id as string)?.display_name,
  }));
}

// ─── Get current user role in campaign ───────────────────────────────────────

export async function getMyRole(
  campaignId: string
): Promise<MemberRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.role as MemberRole) ?? null;
}

// ─── Invite member by email ───────────────────────────────────────────────────

export async function inviteMember(
  campaignId: string,
  email: string,
  role: MemberRole
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify current user is owner of this campaign
  const { data: myMembership } = await supabase
    .from("campaign_members")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (myMembership?.role !== "owner") {
    return { error: "Only campaign owners can invite members." };
  }

  // Look up user by email via admin client
  const admin = createAdminClient();
  const { data: users, error: searchErr } = await admin.auth.admin.listUsers();
  if (searchErr) return { error: searchErr.message };

  const target = users.users.find((u) => u.email === email.trim().toLowerCase());
  if (!target) {
    return { error: `No account found for ${email}. They must sign up first.` };
  }

  // Insert membership
  const { error } = await admin.from("campaign_members").insert({
    campaign_id: campaignId,
    user_id: target.id,
    role,
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "This user is already a member." };
    return { error: error.message };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

// ─── Change member role ───────────────────────────────────────────────────────

export async function changeMemberRole(
  campaignId: string,
  memberId: string,
  newRole: MemberRole
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("campaign_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("campaign_id", campaignId);

  if (error) return { error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

// ─── Remove member ────────────────────────────────────────────────────────────

export async function removeMember(campaignId: string, memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Cannot remove the last owner
  const { data: owners } = await supabase
    .from("campaign_members")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("role", "owner");

  const { data: target } = await supabase
    .from("campaign_members")
    .select("role, user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (target?.role === "owner" && (owners?.length ?? 0) <= 1) {
    return { error: "Cannot remove the last owner. Transfer ownership first." };
  }

  const { error } = await supabase
    .from("campaign_members")
    .delete()
    .eq("id", memberId)
    .eq("campaign_id", campaignId);

  if (error) return { error: error.message };
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}
