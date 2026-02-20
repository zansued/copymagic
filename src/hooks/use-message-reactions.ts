import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user_ids
}

export type ReactionsMap = Record<string, Reaction[]>; // messageId -> reactions

export function useMessageReactions(teamId: string | undefined) {
  const { user } = useAuth();
  const [reactionsMap, setReactionsMap] = useState<ReactionsMap>({});

  const fetchReactions = useCallback(async () => {
    if (!teamId) return;

    // Get all message ids for this team first, then reactions
    const { data: msgs } = await supabase
      .from("team_messages")
      .select("id")
      .eq("team_id", teamId);

    if (!msgs || msgs.length === 0) {
      setReactionsMap({});
      return;
    }

    const msgIds = msgs.map((m) => m.id);
    const { data } = await supabase
      .from("team_message_reactions")
      .select("*")
      .in("message_id", msgIds);

    if (!data) {
      setReactionsMap({});
      return;
    }

    // Group by message_id -> emoji
    const map: ReactionsMap = {};
    for (const r of data) {
      if (!map[r.message_id]) map[r.message_id] = [];
      const existing = map[r.message_id].find((x) => x.emoji === r.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(r.user_id);
      } else {
        map[r.message_id].push({ emoji: r.emoji, count: 1, users: [r.user_id] });
      }
    }
    setReactionsMap(map);
  }, [teamId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Realtime
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`reactions-${teamId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_message_reactions" }, () => {
        fetchReactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teamId, fetchReactions]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;
      const existing = reactionsMap[messageId]?.find(
        (r) => r.emoji === emoji && r.users.includes(user.id)
      );
      if (existing) {
        await supabase
          .from("team_message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);
      } else {
        await supabase.from("team_message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        } as any);
      }
    },
    [user, reactionsMap]
  );

  return { reactionsMap, toggleReaction };
}
