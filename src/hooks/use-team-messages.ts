import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface TeamMessage {
  id: string;
  team_id: string;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  expires_at: string;
  // joined from profiles
  author_name?: string;
  author_avatar?: string;
}

export function useTeamMessages(teamId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const profileCache = useRef<Map<string, { name: string; avatar: string | null }>>(new Map());

  const enrichWithProfiles = useCallback(async (msgs: TeamMessage[]) => {
    const unknownIds = [...new Set(msgs.map((m) => m.author_id))].filter(
      (id) => !profileCache.current.has(id)
    );

    if (unknownIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", unknownIds);

      (data ?? []).forEach((p) => {
        profileCache.current.set(p.user_id, {
          name: p.display_name || "Membro",
          avatar: p.avatar_url,
        });
      });
    }

    return msgs.map((m) => ({
      ...m,
      author_name: profileCache.current.get(m.author_id)?.name || "Membro",
      author_avatar: profileCache.current.get(m.author_id)?.avatar || undefined,
    }));
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!teamId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("team_messages")
      .select("*")
      .eq("team_id", teamId)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    const enriched = await enrichWithProfiles(
      (data ?? []) as unknown as TeamMessage[]
    );
    setMessages(enriched);
    setLoading(false);
  }, [teamId, enrichWithProfiles]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`team-messages-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user || !teamId || !content.trim()) return false;

      const { error } = await supabase.from("team_messages").insert({
        team_id: teamId,
        author_id: user.id,
        content: content.trim(),
      } as any);

      return !error;
    },
    [user, teamId]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const { error } = await supabase
        .from("team_messages")
        .delete()
        .eq("id", messageId);

      return !error;
    },
    []
  );

  const pinMessage = useCallback(
    async (messageId: string, pinned: boolean) => {
      const { error } = await supabase
        .from("team_messages")
        .update({ is_pinned: pinned } as any)
        .eq("id", messageId);

      return !error;
    },
    []
  );

  return { messages, loading, sendMessage, deleteMessage, pinMessage, refetch: fetchMessages };
}
