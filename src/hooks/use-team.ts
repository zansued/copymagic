import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  plan: string;
  seats_limit: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joined_at: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  invited_by: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function useTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Find team where user is a member
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!memberData) {
      setTeam(null);
      setMyRole(null);
      setMembers([]);
      setInvites([]);
      setLoading(false);
      return;
    }

    setMyRole(memberData.role);

    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("id", memberData.team_id)
      .single();

    if (teamData) {
      setTeam(teamData as unknown as Team);

      // Fetch members & invites in parallel
      const [membersRes, invitesRes] = await Promise.all([
        supabase.from("team_members").select("*").eq("team_id", teamData.id),
        supabase.from("team_invites").select("*").eq("team_id", teamData.id).eq("status", "pending"),
      ]);

      setMembers((membersRes.data ?? []) as unknown as TeamMember[]);
      setInvites((invitesRes.data ?? []) as unknown as TeamInvite[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const createTeam = useCallback(async (name: string) => {
    if (!user) return null;

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({ name, owner_id: user.id })
      .select()
      .single();

    if (teamError || !teamData) return null;

    // Add owner as member
    await supabase.from("team_members").insert({
      team_id: teamData.id,
      user_id: user.id,
      role: "owner",
    });

    await fetchTeam();
    return teamData;
  }, [user, fetchTeam]);

  const inviteMember = useCallback(async (email: string, role: string = "editor") => {
    if (!user || !team) return false;

    const { error } = await supabase.from("team_invites").insert({
      team_id: team.id,
      invited_by: user.id,
      email,
      role,
    });

    if (!error) await fetchTeam();
    return !error;
  }, [user, team, fetchTeam]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    const { error } = await supabase
      .from("team_invites")
      .update({ status: "cancelled" })
      .eq("id", inviteId);

    if (!error) await fetchTeam();
    return !error;
  }, [fetchTeam]);

  const removeMember = useCallback(async (memberId: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (!error) await fetchTeam();
    return !error;
  }, [fetchTeam]);

  const updateMemberRole = useCallback(async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (!error) await fetchTeam();
    return !error;
  }, [fetchTeam]);

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  return {
    team,
    members,
    invites,
    myRole,
    loading,
    isOwnerOrAdmin,
    createTeam,
    inviteMember,
    cancelInvite,
    removeMember,
    updateMemberRole,
    refetch: fetchTeam,
  };
}
