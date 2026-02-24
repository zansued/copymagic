import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateGenerationContext, buildCulturalSystemPrompt } from "../_shared/cultural-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function dedupeByField<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const val = String(item[key] ?? "");
    if (!val || seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

function dedupeByTextHash(ads: any[]): any[] {
  const seen = new Set<string>();
  return ads.filter((ad) => {
    const hash = (ad.texto_anuncio || "").trim().toLowerCase().slice(0, 120);
    if (!hash || seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

const OFFER_TERMS = [
  "garantia", "bônus", "módulo", "inscrição", "checkout", "pix", "parcela",
  "método", "resultado", "aula", "grátis", "desconto", "oferta", "curso",
  "mentoria", "treinamento", "programa", "desafio", "vagas", "matrícula",
  "certificado", "acesso", "comunidade", "suporte", "transforma",
  "comprar", "assinar", "investimento", "promoção", "exclusiv"
];

function hasOfferSignal(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return OFFER_TERMS.some((t) => lower.includes(t));
}

// ─── Query Pack Generator (mini OpenAI call) ────────────────────────────────

async function generateQueryPack(niche: string, apiKey: string): Promise<{
  queries_trends: string[];
  queries_platforms: string[];
  queries_ads: string[];
}> {
  const fallback = buildHeuristicQueries(niche);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 600,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `Você gera pacotes de queries de busca para pesquisa de mercado digital no Brasil.
Retorne APENAS JSON válido, sem markdown. Formato:
{
  "queries_trends": ["q1","q2","q3","q4"],
  "queries_platforms": ["q1","q2","q3"],
  "queries_ads": ["q1","q2","q3","q4"]
}
queries_trends: 4 queries para Google Trends / tendências (inclua sinônimos, dores, "2025"/"2026")
queries_platforms: 3 queries para buscar infoprodutos em marketplaces (Hotmart, Kiwify, Monetizze, Eduzz) — use "site:" quando fizer sentido
queries_ads: 4 termos de busca para Meta Ad Library (curtos, 2-4 palavras cada, sinônimos e variações de dor/promessa)
Adapte ao nicho de forma criativa. Inclua variações de dor, desejo e termos de compra.`
          },
          { role: "user", content: `Nicho: "${niche}"` }
        ],
      }),
    });

    if (!res.ok) {
      console.warn("Query pack AI call failed, using heuristic:", res.status);
      return fallback;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) return fallback;

    const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    return {
      queries_trends: (parsed.queries_trends || []).slice(0, 5),
      queries_platforms: (parsed.queries_platforms || []).slice(0, 4),
      queries_ads: (parsed.queries_ads || []).slice(0, 5),
    };
  } catch (e) {
    console.warn("Query pack generation failed, using heuristic:", e);
    return fallback;
  }
}

function buildHeuristicQueries(niche: string) {
  const dores = ["como", "sem esforço", "rápido", "em 30 dias", "método"];
  const compra = ["curso", "mentoria", "programa", "treinamento"];
  return {
    queries_trends: [
      `"${niche}" tendências crescimento 2025`,
      `"${niche}" ${dores[0]} ${dores[2]} resultados`,
      `${niche} mercado digital demanda 2025 2026`,
    ],
    queries_platforms: [
      `site:hotmart.com "${niche}" curso mentoria`,
      `site:kiwify.com.br "${niche}" programa treinamento`,
      `${niche} infoproduto Monetizze Eduzz vendas`,
    ],
    queries_ads: [
      niche,
      `${niche} ${compra[0]}`,
      `${niche} ${dores[0]} ${dores[2]}`,
      `${niche} ${compra[1]} ${compra[3]}`,
    ],
  };
}

// ─── Main Handler ───────────────────────────────────────────────────────────

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

    const { niche, sources = ["trends", "ads", "platforms"], generation_context } = await req.json();
    const genCtx = validateGenerationContext(generation_context);

    if (!niche || typeof niche !== "string" || !niche.trim()) {
      return new Response(JSON.stringify({ error: "Nicho é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (niche.length > 500) {
      return new Response(JSON.stringify({ error: "Nicho muito longo (máximo 500 caracteres)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_SELF_HOSTED_KEY") || Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY não configurada");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

    const firecrawlBaseUrl = Deno.env.get("FIRECRAWL_SELF_HOSTED_KEY")
      ? "https://firecrawl.techstorebrasil.com"
      : "https://api.firecrawl.dev";

    // ═══ STEP 1: Generate Query Pack ═══════════════════════════════════════
    console.log("Step 1: Generating query pack for niche:", niche);
    const queryPack = await generateQueryPack(niche, OPENAI_API_KEY);
    console.log("Query pack generated:", JSON.stringify(queryPack));

    // ═══ STEP 2: Search & Scrape Functions ═════════════════════════════════

    const firecrawlCounts: Record<string, number> = {};

    const searchFirecrawl = async (query: string, limit = 12): Promise<any[]> => {
      try {
        const res = await fetch(`${firecrawlBaseUrl}/v1/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit,
            lang: "pt-br",
            country: "BR",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Firecrawl search error:", data);
          firecrawlCounts[query] = 0;
          return [];
        }
        const results = data.data || [];
        firecrawlCounts[query] = results.length;
        return results;
      } catch (e) {
        console.error("Firecrawl search failed:", e);
        firecrawlCounts[query] = 0;
        return [];
      }
    };

    // ═══ STEP 3: Meta Ads with multiple queries, pagination, dedupe ═══════

    const fetchMetaAds = async (searchTerms: string[]): Promise<{ ads: any[]; rawCount: number; afterFilterCount: number }> => {
      const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN");
      if (!META_ACCESS_TOKEN) {
        console.warn("META_ACCESS_TOKEN not configured, skipping Meta Ad Library API");
        return { ads: [], rawCount: 0, afterFilterCount: 0 };
      }

      const allAds: any[] = [];
      const seenIds = new Set<string>();

      for (const term of searchTerms.slice(0, 5)) {
        try {
          let url: string | null = buildMetaUrl(term, META_ACCESS_TOKEN, 50);
          let pagesRead = 0;

          while (url && pagesRead < 3 && allAds.length < 200) {
            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok || data.error) {
              console.error("Meta API error for term:", term, data.error?.message || "");
              break;
            }

            for (const ad of (data.data || [])) {
              if (!seenIds.has(ad.id)) {
                seenIds.add(ad.id);
                allAds.push(ad);
              }
            }

            url = data.paging?.next || null;
            pagesRead++;
          }
        } catch (e) {
          console.error("Meta API failed for term:", term, e);
        }
      }

      const rawCount = allAds.length;
      console.log(`Meta API: ${rawCount} raw ads collected from ${searchTerms.length} terms`);

      const now = new Date();
      let mapped = allAds.map((ad: any) => {
        const startDate = ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : null;
        const diasAtivo = startDate ? Math.max(1, Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;
        return {
          ad_archive_id: ad.id,
          anunciante: ad.page_name || ad.byline || "Desconhecido",
          page_id: ad.page_id,
          texto_anuncio: (ad.ad_creative_bodies || []).join(" ").slice(0, 500),
          plataforma: (ad.publisher_platforms || []).join(", ") || "Facebook",
          status: ad.ad_delivery_stop_time ? "Inativo" : "Ativo",
          data_inicio: ad.ad_delivery_start_time || null,
          data_fim: ad.ad_delivery_stop_time || null,
          dias_ativo: diasAtivo,
          cta: (ad.ad_creative_link_titles || []).join(" ") || null,
          url_destino: ad.ad_creative_link_url || null,
          url_anuncio: ad.id ? `https://www.facebook.com/ads/library/?id=${ad.id}&active_status=all&ad_type=all&country=BR&media_type=all` : null,
          tipo_midia: null,
          gancho: (ad.ad_creative_link_descriptions || []).join(" ").slice(0, 200) || null,
        };
      });

      // Dedupe by text hash
      mapped = dedupeByTextHash(mapped);

      // Sort by longevity
      mapped.sort((a: any, b: any) => b.dias_ativo - a.dias_ativo);

      // Calculate advertiser density
      const densityMap: Record<string, number> = {};
      for (const ad of mapped) {
        if (ad.page_id) densityMap[ad.page_id] = (densityMap[ad.page_id] || 0) + 1;
      }
      for (const ad of mapped) {
        (ad as any).densidade_anunciante = ad.page_id ? (densityMap[ad.page_id] || 1) : 1;
      }

      const afterFilterCount = mapped.length;
      console.log(`Meta API: ${afterFilterCount} ads after dedupe`);
      return { ads: mapped, rawCount, afterFilterCount };
    };

    function buildMetaUrl(query: string, token: string, limit: number): string {
      const params = new URLSearchParams({
        search_terms: query,
        search_type: "KEYWORD_UNORDERED",
        ad_type: "ALL",
        ad_reached_countries: '["BR"]',
        ad_active_status: "ACTIVE",
        fields: "id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,byline,page_id,page_name,publisher_platforms,languages,ad_creative_link_url",
        limit: String(limit),
        access_token: token,
      });
      return `https://graph.facebook.com/v22.0/ads_archive?${params.toString()}`;
    }

    // ═══ STEP 4: Execute parallel searches ═════════════════════════════════

    const searchPromises: { key: string; promise: Promise<any[]> }[] = [];
    let metaAdsPromise: Promise<{ ads: any[]; rawCount: number; afterFilterCount: number }> | null = null;

    if (sources.includes("trends")) {
      for (const q of queryPack.queries_trends.slice(0, 3)) {
        searchPromises.push({ key: "trends", promise: searchFirecrawl(q, 12) });
      }
    }

    if (sources.includes("ads")) {
      for (const q of queryPack.queries_ads.slice(0, 2)) {
        searchPromises.push({ key: "ads", promise: searchFirecrawl(q + " anúncios criativos escalados", 10) });
      }
      metaAdsPromise = fetchMetaAds(queryPack.queries_ads);
    }

    if (sources.includes("platforms")) {
      for (const q of queryPack.queries_platforms.slice(0, 3)) {
        searchPromises.push({ key: "platforms", promise: searchFirecrawl(q, 12) });
      }
    }

    const [searchResults, metaAdsResult] = await Promise.all([
      Promise.all(searchPromises.map((s) => s.promise)),
      metaAdsPromise,
    ]);

    // Aggregate and dedupe search results by URL
    const resultsBySource: Record<string, any[]> = { trends: [], ads: [], platforms: [] };
    const seenUrls = new Set<string>();

    searchPromises.forEach((s, i) => {
      for (const r of searchResults[i]) {
        const url = r.url || r.title || "";
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        resultsBySource[s.key].push(r);
      }
    });

    console.log("Search results collected:", Object.fromEntries(
      Object.entries(resultsBySource).map(([k, v]) => [k, v.length])
    ));

    // ═══ STEP 5: Build context with noise filtering ════════════════════════

    const contextParts: string[] = [];

    if (resultsBySource.trends.length) {
      contextParts.push("## TENDÊNCIAS DE BUSCA (via pesquisa web)\n" + resultsBySource.trends
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1500)}`)
        .join("\n\n"));
    }

    if (resultsBySource.ads.length) {
      contextParts.push("## ANÚNCIOS E CRIATIVOS (via pesquisa web)\n" + resultsBySource.ads
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1500)}`)
        .join("\n\n"));
    }

    // Filter platform results: prioritize pages with offer signals
    const platformResults = resultsBySource.platforms;
    const withSignal = platformResults.filter((r: any) =>
      hasOfferSignal(r.markdown || r.description || r.title || "")
    );
    const platformsToUse = withSignal.length >= 2 ? withSignal : platformResults;

    if (platformsToUse.length) {
      contextParts.push("## PRODUTOS DIGITAIS EM PLATAFORMAS (via pesquisa web)\n" + platformsToUse
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1500)}`)
        .join("\n\n"));
    }

    // Cap at 18k chars, prioritizing relevant content
    const fullContext = contextParts.join("\n\n---\n\n").slice(0, 18000);

    // ═══ STEP 6: Build Meta ads context ════════════════════════════════════

    const realAds = metaAdsResult?.ads || [];
    const metaAdsCountRaw = metaAdsResult?.rawCount || 0;
    const metaAdsCountFiltered = metaAdsResult?.afterFilterCount || 0;

    let metaAdsContext = "";
    if (realAds.length > 0) {
      metaAdsContext = `\n\n## ANÚNCIOS REAIS DA META AD LIBRARY (${realAds.length} após dedupe, ${metaAdsCountRaw} brutos)\n` +
        realAds.slice(0, 60).map((ad: any, i: number) =>
          `### Anúncio ${i + 1}: ${ad.anunciante}\n` +
          `- Texto: ${ad.texto_anuncio || "N/A"}\n` +
          `- Plataforma: ${ad.plataforma}\n` +
          `- Status: ${ad.status}\n` +
          `- Data início: ${ad.data_inicio || "N/A"}\n` +
          `- Dias ativo: ${ad.dias_ativo || 0} dias\n` +
          `- CTA: ${ad.cta || "N/A"}\n` +
          `- URL destino: ${ad.url_destino || "N/A"}\n` +
          `- URL anúncio: ${ad.url_anuncio || "N/A"}\n` +
          `- Gancho: ${ad.gancho || "N/A"}\n` +
          `- Densidade anunciante: ${ad.densidade_anunciante || 1} anúncios do mesmo page_id`
        ).join("\n\n");
    }

    // ═══ STEP 7: AI Analysis ═══════════════════════════════════════════════

    const culturalPrompt = buildCulturalSystemPrompt(genCtx);

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é o módulo "Offer Research" do sistema CopyEngine — um analista de mercado digital especializado em ofertas escaladas, infoprodutos e inteligência competitiva.

${culturalPrompt}

═══════════════════════════════════════
OBJETIVO
═══════════════════════════════════════
1) Analisar tendências do nicho a partir do CONTEXTO_WEB (dados de pesquisa web, Google Trends, plataformas).
2) Extrair OFFER CARDS e FUNIL exclusivamente de ANUNCIOS_META (dados oficiais da Meta Graph API).

═══════════════════════════════════════
REGRAS INVIOLÁVEIS
═══════════════════════════════════════
- NÃO invente ROAS, lucro, CPA, faturamento, volume de vendas, receita ou qualquer métrica financeira privada.
- NÃO invente URLs. Se não existir no input, use null.
- Se um campo não estiver presente no input, retorne null — NUNCA penalize por ausência de dado.
- ANUNCIOS_META é a ÚNICA fonte para o array "anuncios_encontrados". Se não houver dados de ANUNCIOS_META, retorne array vazio.
- CONTEXTO_WEB é a ÚNICA fonte para "tendencias" e "ofertas_escaladas" (somente quando houver evidência concreta).
- Mantenha os campos ad_archive_id, url_destino e url_anuncio EXATAMENTE como recebidos dos dados. Nunca os modifique.

═══════════════════════════════════════
EVIDÊNCIA FRACA
═══════════════════════════════════════
Se o CONTEXTO_WEB tiver pouca ou nenhuma informação útil sobre o nicho, ou se após filtrar não restarem anúncios relevantes:
- O veredicto DEVE incluir "evidência insuficiente" 
- Sugira 3 termos de busca alternativos que poderiam retornar melhores resultados
- Não inflacione scores artificialmente — se não há dados, score_oportunidade deve ser baixo (1-3)

═══════════════════════════════════════
TAREFAS
═══════════════════════════════════════

A) TENDÊNCIAS (fonte: CONTEXTO_WEB apenas):
   - Gere um resumo com termos relacionados ao nicho
   - Extraia de 2 a 5 insights baseados em evidências do contexto
   - Avalie interesse_crescente, sazonalidade e volume_estimado

B) PARA CADA ITEM EM ANUNCIOS_META relevante ao nicho, gere:
   
   b.1) OFFER CARD:
   - promise: benefício principal prometido (1 linha extraída do texto do anúncio)
   - mechanism: como a promessa é atingida (método, sistema, ingrediente — extraído do texto)
   - proof: array de evidências citadas no texto (números, depoimentos, garantia). Se não houver, []
   - angle: array de categorias do apelo (dor, desejo, objeção, urgência, prova social, autoridade, curiosidade)
   - format: tipo do criativo inferido (UGC, tutorial, demo, carrossel, imagem estática, antes/depois, storytelling)
   - compliance_note: "ok" ou "atenção: [motivo]"
   
   b.2) FUNIL:
   - platform_guess: inferir por heurística de URL (Shopify, Hotmart, Monetizze, Kiwify, ou null se não for possível)
   - checkout_present: "unknown" se não houver evidência, true/false somente se a URL indicar claramente
   - funnel_map: string descritiva ex: "Ad -> Landing -> Checkout" ou "Ad -> Landing"
   
   b.3) SINAIS DE ESCALA:
   - Explique usando APENAS dados disponíveis: dias_ativo, densidade_anunciante (múltiplos criativos do mesmo anunciante), variações de texto
   - NUNCA cite métricas que não existam nos dados (sem ROAS, sem CPA, sem receita)
   - scale_score (0-10) baseado em: Longevidade 40%, Densidade do anunciante 25%, Variações de criativo 20%, Recorrência de promessa 15%

═══════════════════════════════════════
FILTRO DE RELEVÂNCIA (OBRIGATÓRIO)
═══════════════════════════════════════
- Antes de incluir qualquer anúncio, verifique se o conteúdo (texto, anunciante, CTA, URL destino) é SEMANTICAMENTE RELEVANTE para o nicho "${niche}".
- Descarte anúncios que claramente não pertencem ao nicho pesquisado.
- Se após filtrar não restarem anúncios relevantes, retorne array vazio em anuncios_encontrados e ajuste o veredicto explicando a ausência.

═══════════════════════════════════════
FORMATO DE SAÍDA
═══════════════════════════════════════
Retorne SOMENTE JSON válido, sem markdown, sem backticks, sem texto antes ou depois. Apenas o JSON puro:

{
  "score_oportunidade": 1-10,
  "veredicto": "frase curta sobre viabilidade do nicho",
  "termos_alternativos_sugeridos": ["termo1", "termo2", "termo3"],
  "tendencias": {
    "interesse_crescente": true/false,
    "sazonalidade": "descrição ou null",
    "volume_estimado": "alto/médio/baixo",
    "termos_relacionados": ["termo1", "termo2", "termo3"],
    "insights": ["insight 1", "insight 2"]
  },
  "anuncios": {
    "volume_detectado": "alto/médio/baixo/não encontrado",
    "formatos_dominantes": ["formato 1", "formato 2"],
    "ganchos_populares": ["gancho 1", "gancho 2", "gancho 3"],
    "padroes_criativos": ["padrão 1", "padrão 2"],
    "ctas_frequentes": ["cta 1", "cta 2"],
    "insights": ["insight 1", "insight 2"]
  },
  "anuncios_encontrados": [
    {
      "anunciante": "nome exato do ANUNCIOS_META",
      "texto_anuncio": "texto exato do ANUNCIOS_META",
      "plataforma": "plataforma exata do ANUNCIOS_META",
      "status": "status exato",
      "data_inicio": "data exata ou null",
      "dias_ativo": 0,
      "cta": "CTA exato ou null",
      "url_destino": "URL exata ou null",
      "url_anuncio": "URL exata ou null",
      "tipo_midia": "inferido ou null",
      "gancho": "gancho extraído ou null",
      "scale_score": 0.0,
      "sinais_escala": ["longevidade: X dias", "densidade: Y anúncios do mesmo anunciante", "etc"],
      "offer_card": {
        "promise": "...",
        "mechanism": "...",
        "proof": [],
        "angle": [],
        "format": "...",
        "compliance_note": "ok"
      },
      "funnel": {
        "platform_guess": null,
        "checkout_present": "unknown",
        "funnel_map": "Ad -> Landing"
      }
    }
  ],
  "ofertas_escaladas": {
    "tipos_produto": ["tipo 1", "tipo 2"],
    "faixa_preco": "R$ X a R$ Y ou null",
    "modelos_funil": ["modelo 1", "modelo 2"],
    "diferenciais_vencedores": ["diferencial 1"],
    "exemplos": [
      {"nome": "nome da oferta", "tipo": "curso/mentoria/etc", "destaque": "por que está escalando"}
    ],
    "insights": ["insight 1"]
  },
  "recomendacao_oferta": {
    "tipo_ideal": "tipo de produto recomendado",
    "nome_sugerido": "nome criativo",
    "promessa_central": "promessa principal",
    "publico_alvo": "público ideal",
    "faixa_preco_sugerida": "R$ X",
    "modelo_funil": "tipo de funil recomendado",
    "gancho_principal": "headline principal do anúncio"
  }
}`
          },
          {
            role: "user",
            content: `Nicho pesquisado: "${niche}"\n\n═══ CONTEXTO_WEB (use APENAS para tendências e ofertas_escaladas) ═══\n\n${fullContext}\n\n═══ ANUNCIOS_META (ÚNICA fonte para anuncios_encontrados) ═══\n\n${realAds.length > 0 ? `${metaAdsContext}\n\nDADOS ESTRUTURADOS:\n${JSON.stringify(realAds.slice(0, 60), null, 2)}` : "Nenhum anúncio encontrado via Meta API. Retorne anuncios_encontrados como array vazio."}`
          }
        ],
        temperature: 0.7,
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
      let jsonStr = rawContent.trim();
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", rawContent.slice(0, 500));
      parsed = { error: "Não foi possível analisar os resultados", raw: rawContent.slice(0, 2000) };
    }

    // ═══ STEP 8: Return with full metadata ═════════════════════════════════

    return new Response(JSON.stringify({
      success: true,
      data: parsed,
      metadata: {
        queries_usadas: queryPack,
        meta_ads_count_raw: metaAdsCountRaw,
        meta_ads_count_after_filter: metaAdsCountFiltered,
        firecrawl_counts: firecrawlCounts,
        search_results_by_source: Object.fromEntries(
          Object.entries(resultsBySource).map(([k, v]) => [k, v.length])
        ),
        context_length: fullContext.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("offer-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
