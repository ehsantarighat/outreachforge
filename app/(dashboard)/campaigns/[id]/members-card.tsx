"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, UserPlus, Trash2, Crown, Pencil, Eye } from "lucide-react";
import type { CampaignMember, MemberRole } from "@/app/actions/campaign-members";
import {
  inviteMember,
  changeMemberRole,
  removeMember,
} from "@/app/actions/campaign-members";

const ROLE_LABELS: Record<MemberRole, { label: string; icon: React.ReactNode; description: string }> = {
  owner: {
    label: "Owner",
    icon: <Crown className="h-3.5 w-3.5" />,
    description: "Full control — can invite, edit, send, delete",
  },
  editor: {
    label: "Editor",
    icon: <Pencil className="h-3.5 w-3.5" />,
    description: "Can research, draft, and send",
  },
  viewer: {
    label: "Viewer",
    icon: <Eye className="h-3.5 w-3.5" />,
    description: "Read-only access",
  },
};

function RoleBadge({ role }: { role: MemberRole }) {
  const { label, icon } = ROLE_LABELS[role];
  const colors: Record<MemberRole, string> = {
    owner: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    editor: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    viewer: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colors[role]}`}>
      {icon}{label}
    </span>
  );
}

interface MembersCardProps {
  campaignId: string;
  initialMembers: CampaignMember[];
  myRole: MemberRole | null;
  currentUserId: string;
}

export function MembersCard({
  campaignId,
  initialMembers,
  myRole,
  currentUserId,
}: MembersCardProps) {
  const [members, setMembers] = useState(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");
  const [isInviting, startInvite] = useTransition();
  const [isChanging, startChange] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const isOwner = myRole === "owner";

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    startInvite(async () => {
      const res = await inviteMember(campaignId, inviteEmail.trim(), inviteRole);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`${inviteEmail} added as ${inviteRole}`);
        setInviteEmail("");
        // Optimistic: reload would be better but action revalidates the path
        // so a page refetch handles this; for now show a hint
      }
    });
  }

  function handleRoleChange(member: CampaignMember, newRole: MemberRole) {
    startChange(async () => {
      const res = await changeMemberRole(campaignId, member.id, newRole);
      if (res.error) {
        toast.error(res.error);
      } else {
        setMembers((prev) =>
          prev.map((m) => m.id === member.id ? { ...m, role: newRole } : m)
        );
        toast.success("Role updated");
      }
    });
  }

  function handleRemove(member: CampaignMember) {
    startRemove(async () => {
      const res = await removeMember(campaignId, member.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast.success("Member removed");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team members</CardTitle>
        <CardDescription>
          Control who can access this campaign and what they can do.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Member list */}
        <div className="divide-y rounded-lg border">
          {members.map((member) => {
            const isSelf = member.user_id === currentUserId;
            const displayName =
              member.display_name ||
              member.email?.split("@")[0] ||
              "Unknown user";

            return (
              <div key={member.id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {displayName}
                    {isSelf && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOwner && !isSelf ? (
                    <Select
                      value={member.role}
                      onValueChange={(v) => handleRoleChange(member, v as MemberRole)}
                      disabled={isChanging}
                    >
                      <SelectTrigger className="h-7 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["owner", "editor", "viewer"] as MemberRole[]).map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABELS[r].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}

                  {isOwner && !isSelf && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            disabled={isRemoving}
                          />
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {displayName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            They will lose access to this campaign immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleRemove(member)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Role legend */}
        <div className="rounded-lg bg-muted/40 px-4 py-3 space-y-1">
          {(["owner", "editor", "viewer"] as MemberRole[]).map((r) => (
            <div key={r} className="flex items-center gap-2 text-xs text-muted-foreground">
              <RoleBadge role={r} />
              <span>— {ROLE_LABELS[r].description}</span>
            </div>
          ))}
        </div>

        {/* Invite form — owners only */}
        {isOwner && (
          <form onSubmit={handleInvite} className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium">Invite by email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as MemberRole)}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Invite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The person must already have an OutreachForge account.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
