import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, { generations: number; profiles: number; projects: number; agents_access: string }> = {
  free: { generations: 20, profiles: 1, projects: 1, agents_access: "basic" },
  starter: { generations: 30, profiles: 3, projects: 5, agents_access: "basic" },
  pro: { generations: 100, profiles: 10, projects: 25, agents_access: "full" },
  lifetime: { generations: 999999, profiles: 15, projects: 30, agents_access: "full" },
  agency: { generations: 999999, profiles: 999, projects: 999999, agents_access: "full" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();
    const nowDate = new Date();

    // ── 1. Handle expired PAID subscriptions (not free, not lifetime) ──
    const { data: expired, error } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, plan, fallback_plan, current_period_end")
      .neq("plan", "free")
      .neq("plan", "lifetime")
      .eq("status", "active")
      .not("current_period_end", "is", null)
      .lt("current_period_end", now);

    if (error) {
      console.error("Query error:", error);
      throw error;
    }

    console.log(`Found ${expired?.length || 0} expired paid subscriptions`);

    let reverted = 0;
    let downgraded = 0;

    for (const sub of expired || []) {
      const fallback = sub.fallback_plan;

      if (fallback && PLAN_LIMITS[fallback]) {
        const limits = PLAN_LIMITS[fallback];
        await supabaseAdmin.from("subscriptions").update({
          plan: fallback,
          status: "active",
          generations_limit: limits.generations,
          brand_profiles_limit: limits.profiles,
          projects_limit: limits.projects,
          agents_access: limits.agents_access,
          current_period_end: fallback === "lifetime" ? null : undefined,
          fallback_plan: null,
          generations_used: 0,
          updated_at: now,
        }).eq("user_id", sub.user_id);
        console.log(`Reverted user ${sub.user_id} to fallback: ${fallback}`);
        reverted++;
      } else {
        const limits = PLAN_LIMITS.free;
        const nextPeriodEnd = new Date(nowDate.getTime() + 30 * 86400000).toISOString();
        await supabaseAdmin.from("subscriptions").update({
          plan: "free",
          status: "active",
          generations_limit: limits.generations,
          brand_profiles_limit: limits.profiles,
          projects_limit: limits.projects,
          agents_access: limits.agents_access,
          current_period_start: now,
          current_period_end: nextPeriodEnd,
          fallback_plan: null,
          generations_used: 0,
          updated_at: now,
        }).eq("user_id", sub.user_id);
        console.log(`Downgraded user ${sub.user_id} to free (next reset: ${nextPeriodEnd})`);
        downgraded++;
      }
    }

    // ── 2. Handle FREE plan monthly reset ──
    const { data: freeExpired, error: freeError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, current_period_end, generations_used")
      .eq("plan", "free")
      .eq("status", "active")
      .not("current_period_end", "is", null)
      .lt("current_period_end", now);

    if (freeError) {
      console.error("Free reset query error:", freeError);
    }

    let freeReset = 0;
    for (const sub of freeExpired || []) {
      const nextPeriodEnd = new Date(nowDate.getTime() + 30 * 86400000).toISOString();
      await supabaseAdmin.from("subscriptions").update({
        generations_used: 0,
        current_period_start: now,
        current_period_end: nextPeriodEnd,
        updated_at: now,
      }).eq("user_id", sub.user_id);
      console.log(`Reset free user ${sub.user_id} generations (was ${sub.generations_used})`);
      freeReset++;
    }

    return new Response(JSON.stringify({
      ok: true,
      checked: (expired?.length || 0) + (freeExpired?.length || 0),
      reverted,
      downgraded,
      freeReset,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Check expired error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
