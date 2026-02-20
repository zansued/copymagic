import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export function useProfiles(userIds: string[]) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    if (userIds.length === 0) return;
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, avatar_url")
      .in("user_id", userIds);

    const map: Record<string, Profile> = {};
    (data ?? []).forEach((p: any) => {
      map[p.user_id] = p as Profile;
    });
    setProfiles(map);
    setLoading(false);
  }, [userIds.join(",")]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const updateMyProfile = useCallback(
    async (displayName: string, avatarUrl?: string | null) => {
      if (!user) return false;

      const payload: any = { display_name: displayName };
      if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;

      // Upsert profile
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, ...payload },
          { onConflict: "user_id" }
        );

      if (!error) await fetchProfiles();
      return !error;
    },
    [user, fetchProfiles]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user) return null;

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (error) return null;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl + "?t=" + Date.now();
    },
    [user]
  );

  return { profiles, loading, updateMyProfile, uploadAvatar, refetch: fetchProfiles };
}
