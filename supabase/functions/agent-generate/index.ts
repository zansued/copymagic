import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Check subscription limits
    const { createClient: createAdminClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAdmin = createAdminClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("generations_used, generations_limit, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    const used = sub?.generations_used ?? 0;
    const limit = sub?.generations_limit ?? 5;

    // Reset usage if period expired (skip for lifetime plans)
    if (sub?.current_period_end && new Date(sub.current_period_end) < new Date()) {
      await supabaseAdmin.from("subscriptions").update({
        generations_used: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("user_id", userId);
    } else if (used >= limit) {
      return new Response(JSON.stringify({ error: "Limite de gerações atingido. Faça upgrade do seu plano." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment usage
    await supabaseAdmin.from("subscriptions").upsert({
      user_id: userId,
      generations_used: used + 1,
    }, { onConflict: "user_id" });

    const { system_prompt, provider } = await req.json();

    if (!system_prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (system_prompt.length > 150000) {
      return new Response(JSON.stringify({ error: "Prompt muito longo (máximo 150.000 caracteres)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (provider && !["openai", "deepseek"].includes(provider)) {
      return new Response(JSON.stringify({ error: "Provider inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = provider === "openai"
      ? Deno.env.get("OPENAI_API_KEY")
      : Deno.env.get("DEEPSEEK_API_KEY");

    const apiUrl = provider === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.deepseek.com/v1/chat/completions";

    const model = provider === "openai" ? "gpt-4o" : "deepseek-chat";
    const maxTokens = provider === "openai" ? 16384 : 8192;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `API key para ${provider} não configurada` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.7,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: "Entregue APENAS o resultado final pronto para uso. Regras obrigatórias: 1) NÃO inclua fases, etapas ou diagnósticos intermediários (ex: 'FASE 1 — DIAGNÓSTICO', 'FASE 2 — ANÁLISE'). 2) NÃO inclua introduções, explicações de contexto ou comentários sobre o processo. 3) Vá DIRETO aos entregáveis finais (os ângulos, os hooks, as headlines, os roteiros, etc). 4) Comece imediatamente pelo primeiro item do resultado." },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI API error:", err);
      return new Response(JSON.stringify({ error: "Erro na API de IA" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
