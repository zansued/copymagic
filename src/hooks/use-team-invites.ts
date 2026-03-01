import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface PendingInvite {
  id: string;
  team_id: string;
  team_name: string;
  invited_by: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export function useTeamInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!user?.email) {
      setInvites([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("team_invites")
      .select("id, team_id, invited_by, role, created_at, expires_at")
      .eq("status", "pending")
      .ilike("email", user.email);

    if (!data || data.length === 0) {
      setInvites([]);
      setLoading(false);
      return;
    }

    // Fetch team names
    const teamIds = [...new Set(data.map((i) => i.team_id))];
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);

    const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]));

    setInvites(
      data.map((inv) => ({
        ...inv,
        team_name: teamMap.get(inv.team_id) ?? "Equipe",
      }))
    );
    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const acceptInvite = useCallback(
    async (invite: PendingInvite) => {
      if (!user) return false;

      const { error } = await supabase.rpc(
        "respond_to_team_invite" as never,
        { p_invite_id: invite.id, p_action: "accepted" } as never
      );

      if (error) {
        console.error("[useTeamInvites] acceptInvite error", error);
        return false;
      }

      await fetchInvites();
      return true;
    },
    [user, fetchInvites]
  );

  const rejectInvite = useCallback(
    async (inviteId: string) => {
      if (!user) return false;

      const { error } = await supabase.rpc(
        "respond_to_team_invite" as never,
        { p_invite_id: inviteId, p_action: "rejected" } as never
      );

      if (error) {
        console.error("[useTeamInvites] rejectInvite error", error);
        return false;
      }

      await fetchInvites();
      return true;
    },
    [user, fetchInvites]
  );

  return { invites, loading, acceptInvite, rejectInvite, refetch: fetchInvites };
}
