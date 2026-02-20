import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeam } from "@/hooks/use-team";

export interface SharedLibraryItem {
  id: string;
  team_id: string;
  created_by: string;
  title: string;
  content: string;
  agent_name: string | null;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
}

export function useSharedLibrary() {
  const { team } = useTeam();
  const [items, setItems] = useState<SharedLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!team) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("shared_library")
      .select("*")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false });

    setItems((data ?? []) as unknown as SharedLibraryItem[]);
    setLoading(false);
  }, [team]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(
    async (item: { title: string; content: string; agent_name?: string; tags?: string[]; category?: string }, userId: string) => {
      if (!team) return null;

      const { data, error } = await supabase
        .from("shared_library")
        .insert({
          team_id: team.id,
          created_by: userId,
          title: item.title,
          content: item.content,
          agent_name: item.agent_name ?? null,
          tags: item.tags ?? [],
          category: item.category ?? "geral",
        })
        .select()
        .single();

      if (!error) await fetchItems();
      return error ? null : data;
    },
    [team, fetchItems]
  );

  const updateItem = useCallback(
    async (id: string, updates: { title?: string; content?: string; tags?: string[]; category?: string }) => {
      const { error } = await supabase
        .from("shared_library")
        .update(updates)
        .eq("id", id);

      if (!error) await fetchItems();
      return !error;
    },
    [fetchItems]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("shared_library")
        .delete()
        .eq("id", id);

      if (!error) await fetchItems();
      return !error;
    },
    [fetchItems]
  );

  return { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems };
}
