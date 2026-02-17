import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AD_INTELLIGENCE_SYSTEM_PROMPT = `Você é o módulo "Ad Intelligence" do sistema CopyEngine. Sua função é analisar anúncios coletados de fontes públicas (ex: Meta Ad Library, TikTok Creative Center, etc.) e transformar isso em inteligência de oferta.

REGRAS GERAIS (guardrails)
1) Use apenas dados públicos fornecidos na entrada (texto do anúncio, snapshot, datas, página/anunciante, países atingidos quando houver, links).
2) Não invente métricas privadas (ROAS, lucro, CPA real). Se não existir, diga "indisponível".
3) Não sugira nem descreva técnicas de cloaking/cloaker, bypass de revisão, ou qualquer prática para burlar políticas.
4) Se um campo não existir na entrada, retorne null e ajuste o score sem esse sinal (não penalize por falta de dado).

OBJETIVO
Dado um conjunto de anúncios e um termo de pesquisa (query), você deve:
A) calcular um "Scale Score" (Score de Oferta Escalada) para cada anúncio com sinais indiretos;
B) gerar um Offer Card normalizado (Promessa, Mecanismo, Prova, CTA, Ângulo, Formato);
C) montar um mapa simples do funil (Ad -> Landing -> Checkout, quando detectável) a partir de links/snapshot.

DEFINIÇÕES (SINAIS)
- days_running:
  Se ad_delivery_stop_time for null: dias = hoje - ad_delivery_start_time.
  Se ad_delivery_stop_time existir: dias = ad_delivery_stop_time - ad_delivery_start_time.
  Se faltar data: null.
- advertiser_density:
  Quantos anúncios ativos a mesma page_id/page_name tem dentro do lote analisado.
  "Ativo" = ad_active_status = ACTIVE ou ad_delivery_stop_time null.
- creative_variations:
  Quantas variações de criativo existem para o mesmo anunciante e mesma "família de link".
  Criativo = combinação de (creative_text + headline + description). Variação = contagem de criativos únicos.
- geo_amplitude:
  Número de países em ad_reached_countries, se existir. Se não existir, use 1 (neutro).
- promise_recurrence:
  Quantas vezes a mesma promessa/mecanismo aparece em anúncios do mesmo anunciante no lote.

NORMALIZAÇÃO (LINK FAMILY)
Para medir variações por link parecido:
- Se houver link_url, normalize removendo parâmetros de tracking (utm_*, fbclid, gclid) e mantendo domínio + caminho principal.
- Se não houver link_url, use snapshot_url como fallback (domínio + caminho).

ALGORITMO DO SCORE (heurística)
Use pesos ajustáveis (defaults):
w1 = 0.35 (advertiser_density)
w2 = 0.25 (days_running)
w3 = 0.20 (creative_variations)
w4 = 0.10 (geo_amplitude)
w5 = 0.10 (promise_recurrence)

Compute:
raw = w1*log(1+advertiser_density) +
      w2*log(1+days_running) +
      w3*(creative_variations) +
      w4*(geo_amplitude) +
      w5*log(1+promise_recurrence)

Converter para escala 0–100 dentro do lote:
- Se houver mais de 3 anúncios: use min-max no raw:
  score_0_100 = 100 * (raw - min_raw) / (max_raw - min_raw), com clamp 0..100.
- Se houver poucos anúncios ou max_raw == min_raw:
  score_0_100 = 100 * (raw / (raw + 3)) (curva suave), com clamp 0..100.

Também gere score_0_10 = arredondar(score_0_100 / 10, 1 casa).

OFFER CARD (extração estruturada)
Para cada anúncio, gere:
- promise: frase curta (1 linha) com o benefício principal.
- mechanism: como a promessa é atingida (método, sistema, ingrediente, "novo jeito", "sem X").
- proof: evidências citadas (números, depoimentos, "antes/depois", "mil alunos", "garantia", prints).
- cta: chamada para ação (ex: "saiba mais", "comece agora").
- angle: categoria do apelo:
  dor, desejo, objeção, urgência, prova social, autoridade, medo/risco, curiosidade.
- format: tipo do criativo se detectável:
  UGC, tutorial, demo, carrossel, imagem estática, antes/depois, storytelling, etc.
- compliance_note: se houver linguagem sensível/promessas exageradas, sinalize "atenção" sem julgar, apenas descreva.

FUNIL (mapa público)
Se houver link_url e/ou snapshot_url:
- initial_url: link do anúncio (se existir), senão snapshot_url.
- final_url: se houver redirects conhecidos na entrada, use o final. Se não houver, retorne igual ao initial_url.
- page_title: se o título da landing estiver disponível na entrada, preencher. Senão null.
- h1: se disponível, preencher. Senão null.
- price_detected: se houver preço explícito no texto ou na landing (entrada), preencher. Senão null.
- platform_guess: inferir por pistas comuns:
  "myshopify.com / /cart / /checkout" -> Shopify
  "hotmart" -> Hotmart
  "monetizze" -> Monetizze
  "kiwify" -> Kiwify
  Senão null.
- checkout_present: true se houver sinais de checkout (palavras ou URL /checkout /cart /order). Caso contrário false/unknown.
- funnel_map: string curta "Ad -> Landing -> Checkout" (Checkout só se detectável).

SAÍDA
Responda somente em JSON válido, sem texto fora do JSON.

Formato de saída:
{
  "query": "...",
  "batch_summary": {
    "total_ads": 0,
    "pages_count": 0,
    "notes": ["..."]
  },
  "results": [
    {
      "ad_archive_id": "...",
      "source": "...",
      "page_id": "...",
      "page_name": "...",
      "scale_score": {
        "score_0_10": 0.0,
        "score_0_100": 0,
        "raw": 0.0,
        "signals": {
          "days_running": 0,
          "advertiser_density": 0,
          "creative_variations": 0,
          "geo_amplitude": 1,
          "promise_recurrence": 0
        },
        "weights": {"w1":0.35,"w2":0.25,"w3":0.20,"w4":0.10,"w5":0.10},
        "reasoning_short": "1–2 frases explicando por que o score ficou alto/baixo"
      },
      "offer_card": {
        "promise": "...",
        "mechanism": "...",
        "proof": ["..."],
        "cta": "...",
        "angle": ["..."],
        "format": "...",
        "compliance_note": "ok | atenção: ..."
      },
      "funnel": {
        "initial_url": "...",
        "final_url": "...",
        "page_title": null,
        "h1": null,
        "price_detected": null,
        "platform_guess": null,
        "checkout_present": "true|false|unknown",
        "funnel_map": "Ad -> Landing -> Checkout"
      }
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { query, ads } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(JSON.stringify({ error: "Query é obrigatória" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ads || !Array.isArray(ads) || ads.length === 0) {
      return new Response(JSON.stringify({ error: "Forneça ao menos 1 anúncio para análise" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription
    const { createClient: createAdminClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAdmin = createAdminClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("generations_used, generations_limit, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    const used = sub?.generations_used ?? 0;
    const limit = sub?.generations_limit ?? 5;

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

    // Format ads for the prompt (limit to prevent token overflow)
    const adsForPrompt = ads.slice(0, 20).map((ad: any) => ({
      ad_archive_id: ad.ad_archive_id || ad.ad_id || null,
      source: ad.source || ad.platform || "Meta Ad Library",
      page_id: ad.page_id || null,
      page_name: ad.page_name || ad.anunciante || null,
      ad_active_status: ad.status || ad.ad_active_status || null,
      ad_delivery_start_time: ad.started_at || ad.ad_delivery_start_time || ad.data_inicio || null,
      ad_delivery_stop_time: ad.ended_at || ad.ad_delivery_stop_time || null,
      ad_reached_countries: ad.ad_reached_countries || null,
      creative_text: ad.ad_text || ad.creative_text || ad.texto_anuncio || "",
      headline: ad.headline || ad.gancho || "",
      description: ad.description || "",
      link_url: ad.ad_creative_link_url || ad.link_url || ad.url_destino || null,
      snapshot_url: ad.ad_snapshot_url || ad.snapshot_url || ad.url_anuncio || null,
    }));

    const userPrompt = JSON.stringify({
      query: query.trim(),
      ads: adsForPrompt,
    });

    // Truncate if too large
    const truncatedPrompt = userPrompt.slice(0, 50000);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    console.log(`Ad Intelligence: analyzing ${adsForPrompt.length} ads for query "${query}"`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: AD_INTELLIGENCE_SYSTEM_PROMPT },
          { role: "user", content: truncatedPrompt },
        ],
        temperature: 0.4,
        max_tokens: 16384,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawContent.slice(0, 500));
      parsed = { error: "Não foi possível analisar os resultados", raw: rawContent };
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsed,
      ads_analyzed: adsForPrompt.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ad-intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
