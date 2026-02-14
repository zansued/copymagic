import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, { generations: number; profiles: number; projects: number; agents_access: string }> = {
  pro: { generations: 100, profiles: 5, projects: 10, agents_access: "full" },
  agency: { generations: 999999, profiles: 999, projects: 999999, agents_access: "full" },
  lifetime: { generations: 999999, profiles: 999, projects: 999999, agents_access: "full" },
};

async function verifyWebhookSignature(req: Request, body: any): Promise<boolean> {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) return false;

  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET not configured - rejecting request");
    return false;
  }

  const parts = xSignature.split(",");
  const tsParam = parts.find((p) => p.trim().startsWith("ts="));
  const v1Param = parts.find((p) => p.trim().startsWith("v1="));

  if (!tsParam || !v1Param) return false;

  const ts = tsParam.trim().split("=")[1];
  const hash = v1Param.trim().split("=")[1];

  const dataId = body.data?.id || "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHash === hash;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Verify webhook signature from Mercado Pago
    const isValid = await verifyWebhookSignature(req, body);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mercado Pago sends notification with type and data.id
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!ACCESS_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch payment details from Mercado Pago
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });

    if (!paymentRes.ok) {
      console.error("Failed to fetch payment:", await paymentRes.text());
      return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await paymentRes.json();
    console.log("Payment status:", payment.status, "external_reference:", payment.external_reference);

    if (payment.status !== "approved") {
      return new Response(JSON.stringify({ ok: true, status: payment.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse external reference
    let refData: { user_id: string; plan: string };
    try {
      refData = JSON.parse(payment.external_reference);
    } catch {
      console.error("Invalid external_reference:", payment.external_reference);
      return new Response(JSON.stringify({ error: "Invalid reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, plan } = refData;
    const limits = PLAN_LIMITS[plan];
    if (!limits) {
      console.error("Unknown plan:", plan);
      return new Response(JSON.stringify({ error: "Unknown plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to update subscription
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const isLifetime = plan === "lifetime";
    const periodEnd = isLifetime ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id,
          plan,
          status: "active",
          mp_subscription_id: String(paymentId),
          mp_payer_email: payment.payer?.email || null,
          generations_used: 0,
          generations_limit: limits.generations,
          brand_profiles_limit: limits.profiles,
          projects_limit: limits.projects,
          agents_access: limits.agents_access,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd ? periodEnd.toISOString() : null,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrement lifetime slots if applicable
    if (isLifetime) {
      await supabaseAdmin.rpc("decrement_lifetime_slot" as any);
      // Fallback: direct update
      const { data: slotData } = await supabaseAdmin.from("lifetime_slots").select("*").limit(1).single();
      if (slotData) {
        await supabaseAdmin.from("lifetime_slots").update({ slots_sold: slotData.slots_sold + 1 }).eq("id", slotData.id);
      }
    }

    console.log(`Subscription updated: user=${user_id}, plan=${plan}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
