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

    // Find expired subscriptions (recurring plans only, not lifetime)
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

    console.log(`Found ${expired?.length || 0} expired subscriptions`);

    let reverted = 0;
    let downgraded = 0;

    for (const sub of expired || []) {
      const fallback = sub.fallback_plan;

      if (fallback && PLAN_LIMITS[fallback]) {
        // Revert to fallback plan (e.g., lifetime)
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

        console.log(`Reverted user ${sub.user_id} from ${sub.plan} to fallback: ${fallback}`);
        reverted++;
      } else {
        // No fallback — downgrade to free
        const limits = PLAN_LIMITS.free;
        await supabaseAdmin.from("subscriptions").update({
          plan: "free",
          status: "active",
          generations_limit: limits.generations,
          brand_profiles_limit: limits.profiles,
          projects_limit: limits.projects,
          agents_access: limits.agents_access,
          current_period_end: null,
          fallback_plan: null,
          generations_used: 0,
          updated_at: now,
        }).eq("user_id", sub.user_id);

        console.log(`Downgraded user ${sub.user_id} from ${sub.plan} to free`);
        downgraded++;
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      checked: expired?.length || 0,
      reverted,
      downgraded,
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
