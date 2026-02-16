import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user token using getClaims
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Claims error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET") {
      if (action === "metrics") {
        // Query metrics directly instead of using RPC (which checks auth.uid())
        const { count: totalUsers } = await supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).limit(0);
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1, page: 1 });
        const totalUsersCount = authUsers?.total || 0;

        const { data: subs } = await supabaseAdmin.from("subscriptions").select("plan, status, generations_used");
        
        const activeSubs = subs?.filter(s => s.status === "active") || [];
        const totalPro = activeSubs.filter(s => s.plan === "pro").length;
        const totalAgency = activeSubs.filter(s => s.plan === "agency").length;
        const totalLifetime = activeSubs.filter(s => s.plan === "lifetime").length;
        const totalGenerations = subs?.reduce((sum, s) => sum + (s.generations_used || 0), 0) || 0;
        const mrr = activeSubs.reduce((sum, s) => {
          if (s.plan === "pro") return sum + 97;
          if (s.plan === "agency") return sum + 297;
          return sum;
        }, 0);

        const metrics = {
          total_users: totalUsersCount,
          total_pro: totalPro,
          total_agency: totalAgency,
          total_lifetime: totalLifetime,
          total_free: totalUsersCount - totalPro - totalAgency - totalLifetime,
          total_generations: totalGenerations,
          mrr,
        };

        return new Response(JSON.stringify(metrics), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "users") {
        // List users directly via admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (authError) throw authError;

        const { data: allSubs } = await supabaseAdmin.from("subscriptions").select("*");
        const subsMap = new Map((allSubs || []).map(s => [s.user_id, s]));

        const users = (authData?.users || []).map(u => {
          const sub = subsMap.get(u.id);
          return {
            user_id: u.id,
            email: u.email || "",
            registered_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            plan: sub?.plan || "free",
            subscription_status: sub?.status || "active",
            generations_used: sub?.generations_used || 0,
            generations_limit: sub?.generations_limit || 5,
            mp_subscription_id: sub?.mp_subscription_id || null,
            mp_payer_email: sub?.mp_payer_email || null,
            current_period_start: sub?.current_period_start || null,
            current_period_end: sub?.current_period_end || null,
          };
        });

        return new Response(JSON.stringify(users), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (action === "update-plan") {
        const { target_user_id, plan, generations_limit } = body;
        // Call RPC with the user's supabase client (which has auth.uid() set)
        const { error } = await supabaseUser.rpc("admin_update_user_plan", {
          _target_user_id: target_user_id,
          _plan: plan,
          _generations_limit: generations_limit,
        });
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "add-role") {
        const { target_user_id, role } = body;
        const { error } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: target_user_id, role });
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Admin API error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});