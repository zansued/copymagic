import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Subscription {
  id: string;
  plan: "free" | "starter" | "pro" | "agency" | "lifetime";
  status: string;
  generations_used: number;
  generations_limit: number;
  brand_profiles_limit: number;
  projects_limit: number;
  agents_access: "basic" | "full";
  current_period_end: string | null;
}

const FREE_DEFAULTS: Omit<Subscription, "id"> = {
  plan: "free",
  status: "active",
  generations_used: 0,
  generations_limit: 5,
  brand_profiles_limit: 1,
  projects_limit: 1,
  agents_access: "basic",
  current_period_end: null,
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
    }

    if (data) {
      setSubscription(data as unknown as Subscription);
    } else {
      // Create free plan for new users
      const { data: newSub } = await supabase
        .from("subscriptions")
        .insert({ user_id: user.id })
        .select()
        .single();

      setSubscription(newSub ? (newSub as unknown as Subscription) : { id: "", ...FREE_DEFAULTS });
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canGenerate = subscription
    ? subscription.generations_used < subscription.generations_limit
    : false;

  const remainingGenerations = subscription
    ? subscription.generations_limit - subscription.generations_used
    : 0;

  const incrementUsage = useCallback(async () => {
    if (!subscription || !user) return false;
    const { error } = await supabase
      .from("subscriptions")
      .update({ generations_used: subscription.generations_used + 1 })
      .eq("user_id", user.id);

    if (!error) {
      setSubscription((prev) => prev ? { ...prev, generations_used: prev.generations_used + 1 } : prev);
      return true;
    }
    return false;
  }, [subscription, user]);

  return {
    subscription,
    loading,
    canGenerate,
    remainingGenerations,
    incrementUsage,
    refetch: fetchSubscription,
  };
}
