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
  const [teams, setTeams] = useState<Team[]>([]);
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

    // Find all teams where user is a member
    const { data: memberData } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id);

    if (!memberData || memberData.length === 0) {
      setTeam(null);
      setTeams([]);
      setMyRole(null);
      setMembers([]);
      setInvites([]);
      setLoading(false);
      return;
    }

    const teamIds = memberData.map((m) => m.team_id);
    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds);

    const allTeams = (teamsData ?? []) as unknown as Team[];
    setTeams(allTeams);

    // Use first team as active by default
    const primaryTeam = allTeams[0] || null;
    setTeam(primaryTeam);

    const primaryMember = memberData.find((m) => m.team_id === primaryTeam?.id);
    setMyRole(primaryMember?.role ?? null);

    if (primaryTeam) {
      const [membersRes, invitesRes] = await Promise.all([
        supabase.from("team_members").select("*").eq("team_id", primaryTeam.id),
        supabase.from("team_invites").select("*").eq("team_id", primaryTeam.id).eq("status", "pending"),
      ]);

      setMembers((membersRes.data ?? []) as unknown as TeamMember[]);
      setInvites((invitesRes.data ?? []) as unknown as TeamInvite[]);
    }

    setLoading(false);
  }, [user]);

  const switchTeam = useCallback(async (teamId: string) => {
    if (!user) return;

    const { data: memberData } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!memberData) return;

    const selectedTeam = teams.find((t) => t.id === teamId);
    if (!selectedTeam) return;

    setTeam(selectedTeam);
    setMyRole(memberData.role);

    const [membersRes, invitesRes] = await Promise.all([
      supabase.from("team_members").select("*").eq("team_id", teamId),
      supabase.from("team_invites").select("*").eq("team_id", teamId).eq("status", "pending"),
    ]);

    setMembers((membersRes.data ?? []) as unknown as TeamMember[]);
    setInvites((invitesRes.data ?? []) as unknown as TeamInvite[]);
  }, [user, teams]);

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

    await supabase.from("team_members").insert({
      team_id: teamData.id,
      user_id: user.id,
      role: "owner",
    });

    await fetchTeam();
    return teamData;
  }, [user, fetchTeam]);

  const updateTeamName = useCallback(async (newName: string) => {
    if (!team) return false;
    const { error } = await supabase
      .from("teams")
      .update({ name: newName })
      .eq("id", team.id);

    if (!error) {
      setTeam((prev) => prev ? { ...prev, name: newName } : prev);
      setTeams((prev) => prev.map((t) => t.id === team.id ? { ...t, name: newName } : t));
    }
    return !error;
  }, [team]);

  const deleteTeam = useCallback(async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (!error) await fetchTeam();
    return !error;
  }, [fetchTeam]);

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

  const transferMember = useCallback(async (memberId: string, targetTeamId: string) => {
    const { error } = await supabase
      .from("team_members")
      .update({ team_id: targetTeamId })
      .eq("id", memberId);

    if (!error) await fetchTeam();
    return !error;
  }, [fetchTeam]);

  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";

  return {
    team,
    teams,
    members,
    invites,
    myRole,
    loading,
    isOwnerOrAdmin,
    createTeam,
    updateTeamName,
    deleteTeam,
    inviteMember,
    cancelInvite,
    removeMember,
    updateMemberRole,
    transferMember,
    switchTeam,
    refetch: fetchTeam,
  };
}
