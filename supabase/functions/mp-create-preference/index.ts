import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS: Record<string, {
  title: string;
  monthlyPrice: number;
  annualPrice: number;
  generations: number;
  profiles: number;
  projects: number;
  agents_access: string;
  is_recurring: boolean;
}> = {
  pro: { title: "CopyMagic Pro", monthlyPrice: 97, annualPrice: 970, generations: 100, profiles: 5, projects: 10, agents_access: "full", is_recurring: true },
  agency: { title: "CopyMagic Agency", monthlyPrice: 297, annualPrice: 2970, generations: 999999, profiles: 999, projects: 999999, agents_access: "full", is_recurring: true },
  agency_plus: { title: "CopyMagic Agency Plus", monthlyPrice: 497, annualPrice: 4970, generations: 999999, profiles: 999, projects: 999999, agents_access: "full", is_recurring: true },
  lifetime: { title: "CopyMagic Vitalício (Pro)", monthlyPrice: 1997, annualPrice: 1997, generations: 999999, profiles: 5, projects: 10, agents_access: "full", is_recurring: false },
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email || "";

    const { plan, billing = "monthly" } = await req.json();
    const planConfig = PLANS[plan];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check lifetime slots availability
    if (plan === "lifetime") {
      const { createClient: createAdminClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseAdmin = createAdminClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: slots } = await supabaseAdmin.from("lifetime_slots").select("*").limit(1).single();
      if (slots && slots.slots_sold >= slots.total_slots) {
        return new Response(JSON.stringify({ error: "Vagas vitalícias esgotadas!" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const isAnnual = billing === "annual" && plan !== "lifetime";
    const price = isAnnual ? planConfig.annualPrice : planConfig.monthlyPrice;
    const titleSuffix = isAnnual ? " (Anual)" : "";

    const baseUrl = Deno.env.get("SITE_URL") || "https://copymagic.lovable.app";

    const preference = {
      items: [
        {
          title: planConfig.title + titleSuffix,
          quantity: 1,
          unit_price: price,
          currency_id: "BRL",
        },
      ],
      payer: { email: userEmail },
      back_urls: {
        success: `${baseUrl}/pricing?status=approved`,
        failure: `${baseUrl}/pricing?status=failure`,
        pending: `${baseUrl}/pricing?status=pending`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({ user_id: userId, plan, billing: isAnnual ? "annual" : "monthly" }),
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error("MP error:", err);
      return new Response(JSON.stringify({ error: "Erro ao criar preferência" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpRes.json();

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});