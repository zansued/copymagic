import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateGenerationContext, buildCulturalSystemPrompt } from "../_shared/cultural-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const firecrawlBaseUrl = Deno.env.get("FIRECRAWL_SELF_HOSTED_KEY")
      ? "https://firecrawl.techstorebrasil.com"
      : "https://api.firecrawl.dev";

    const searchFirecrawl = async (query: string, limit = 5) => {
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
        return [];
      }
      return data.data || [];
    };

    const scrapeFirecrawl = async (url: string): Promise<string> => {
      try {
        const res = await fetch(`${firecrawlBaseUrl}/v1/scrape`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(`Scrape error for ${url}:`, data);
          return "";
        }
        const md = data.data?.markdown || data.markdown || "";
        return md.slice(0, 2000);
      } catch (e) {
        console.error(`Scrape failed for ${url}:`, e);
        return "";
      }
    };

    // Fetch real ads from Meta Graph API (Ad Library)
    const fetchMetaAds = async (query: string) => {
      const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN");
      if (!META_ACCESS_TOKEN) {
        console.warn("META_ACCESS_TOKEN not configured, skipping Meta Ad Library API");
        return [];
      }

      try {
        // Use broad matching to capture more scaled offers (synonyms, variations)
        const params = new URLSearchParams({
          search_terms: query,
          ad_type: "ALL",
          ad_reached_countries: '["BR"]',
          ad_active_status: "ACTIVE",
          fields: "id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,byline,page_id,page_name,publisher_platforms,languages,ad_creative_link_url",
          limit: "50",
          access_token: META_ACCESS_TOKEN,
        });

        const apiUrl = `https://graph.facebook.com/v22.0/ads_archive?${params.toString()}`;
        console.log("Fetching Meta Graph API ads_archive for:", query);

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!res.ok || data.error) {
          console.error("Meta Graph API error:", JSON.stringify(data.error || data));
          return [];
        }

        const ads = data.data || [];
        console.log(`Meta Graph API returned ${ads.length} ads`);

        // Calculate longevity (days running) and sort by it — longer = more scaled
        const now = new Date();
        const mapped = ads.map((ad: any) => {
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

        // Sort by longevity descending — ads running longer are likely more scaled
        mapped.sort((a: any, b: any) => b.dias_ativo - a.dias_ativo);
        return mapped;
      } catch (e) {
        console.error("Meta Graph API fetch failed:", e);
        return [];
      }
    };

    // Parallel searches and scraping based on selected sources
    const searchPromises: Record<string, Promise<any[]>> = {};
    const scrapePromises: Record<string, Promise<string>> = {};
    let metaAdsPromise: Promise<any[]> | null = null;

    if (sources.includes("trends")) {
      searchPromises.trends = searchFirecrawl(
        `"${niche}" tendências crescimento 2025 Google Trends volume busca`,
        5
      );
      // Direct Google Trends scraping
      const encodedNiche = encodeURIComponent(niche);
      scrapePromises.google_trends = scrapeFirecrawl(
        `https://trends.google.com.br/trending?geo=BR&q=${encodedNiche}&hours=168`
      );
      // Scrape Google Trends explore for related queries
      scrapePromises.google_trends_explore = scrapeFirecrawl(
        `https://trends.google.com.br/trends/explore?q=${encodedNiche}&geo=BR`
      );
    }

    if (sources.includes("ads")) {
      searchPromises.ads = searchFirecrawl(
        `"${niche}" anúncios Facebook Instagram Meta Ad Library ads escalados criativos`,
        5
      );
      metaAdsPromise = fetchMetaAds(niche);
    }

    if (sources.includes("platforms")) {
      searchPromises.platforms = searchFirecrawl(
        `"${niche}" produto digital infoproduto Hotmart Kiwify vendas escalado oferta high ticket`,
        5
      );
      // Direct platform scraping for real product data
      const encodedNiche = encodeURIComponent(niche);
      scrapePromises.hotmart = scrapeFirecrawl(
        `https://hotmart.com/pt-br/marketplace?q=${encodedNiche}&sort=RELEVANCE`
      );
      scrapePromises.kiwify = scrapeFirecrawl(
        `https://dashboard.kiwify.com.br/marketplace?search=${encodedNiche}`
      );
      scrapePromises.clickbank = scrapeFirecrawl(
        `https://www.clickbank.com/marketplace?query=${encodedNiche}&sortField=GRAVITY&sortOrder=DESC`
      );
    }

    const searchKeys = Object.keys(searchPromises);
    const scrapeKeys = Object.keys(scrapePromises);
    const [searchResults, metaAdsRaw, scrapeResults] = await Promise.all([
      Promise.all(Object.values(searchPromises)),
      metaAdsPromise,
      Promise.all(Object.values(scrapePromises)),
    ]);
    const resultsBySource: Record<string, any[]> = {};
    searchKeys.forEach((key, i) => {
      resultsBySource[key] = searchResults[i];
    });
    const scrapesBySource: Record<string, string> = {};
    scrapeKeys.forEach((key, i) => {
      scrapesBySource[key] = scrapeResults[i];
    });

    console.log("Search results collected:", Object.fromEntries(
      Object.entries(resultsBySource).map(([k, v]) => [k, v.length])
    ));
    console.log("Scrape results collected:", Object.fromEntries(
      Object.entries(scrapesBySource).map(([k, v]) => [k, v ? `${v.length} chars` : "empty"])
    ));

    // Build context for AI analysis
    const contextParts: string[] = [];

    if (resultsBySource.trends?.length) {
      contextParts.push("## TENDÊNCIAS DE BUSCA (via pesquisa web)\n" + resultsBySource.trends
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1200)}`)
        .join("\n\n"));
    }

    // Add direct Google Trends scraped data
    if (scrapesBySource.google_trends) {
      contextParts.push("## GOOGLE TRENDS - DADOS DIRETOS (scraping)\n" + scrapesBySource.google_trends);
    }
    if (scrapesBySource.google_trends_explore) {
      contextParts.push("## GOOGLE TRENDS - CONSULTAS RELACIONADAS (scraping)\n" + scrapesBySource.google_trends_explore);
    }

    if (resultsBySource.ads?.length) {
      contextParts.push("## ANÚNCIOS E CRIATIVOS (via pesquisa web)\n" + resultsBySource.ads
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1200)}`)
        .join("\n\n"));
    }

    if (resultsBySource.platforms?.length) {
      contextParts.push("## PRODUTOS DIGITAIS EM PLATAFORMAS (via pesquisa web)\n" + resultsBySource.platforms
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1200)}`)
        .join("\n\n"));
    }

    // Add direct platform scraped data
    if (scrapesBySource.hotmart) {
      contextParts.push("## HOTMART MARKETPLACE - DADOS DIRETOS (scraping)\n" + scrapesBySource.hotmart);
    }
    if (scrapesBySource.kiwify) {
      contextParts.push("## KIWIFY MARKETPLACE - DADOS DIRETOS (scraping)\n" + scrapesBySource.kiwify);
    }
    if (scrapesBySource.clickbank) {
      contextParts.push("## CLICKBANK MARKETPLACE - DADOS DIRETOS (scraping)\n" + scrapesBySource.clickbank);
    }

    const fullContext = contextParts.join("\n\n---\n\n").slice(0, 12000);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

    const culturalPrompt = buildCulturalSystemPrompt(genCtx);

    // Build Meta ads context from real API data
    let metaAdsContext = "";
    const realAds = metaAdsRaw || [];
    
    if (realAds.length > 0) {
      metaAdsContext = `\n\n## ANÚNCIOS REAIS DA META AD LIBRARY (${realAds.length} encontrados via API oficial, ordenados por longevidade)\n` +
        realAds.map((ad: any, i: number) => 
          `### Anúncio ${i + 1}: ${ad.anunciante}\n` +
          `- Texto: ${ad.texto_anuncio || "N/A"}\n` +
          `- Plataforma: ${ad.plataforma}\n` +
          `- Status: ${ad.status}\n` +
          `- Data início: ${ad.data_inicio || "N/A"}\n` +
          `- Dias ativo: ${ad.dias_ativo || 0} dias (quanto mais dias = maior sinal de escala)\n` +
          `- CTA: ${ad.cta || "N/A"}\n` +
          `- URL destino: ${ad.url_destino || "N/A"}\n` +
          `- URL anúncio: ${ad.url_anuncio || "N/A"}\n` +
          `- Gancho: ${ad.gancho || "N/A"}`
        ).join("\n\n");
      
      console.log(`Meta API: ${realAds.length} real ads added to context`);
    }

    // Use AI to also extract structured ad data from the Meta Ad Library content
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

REGRAS GERAIS:
1) Use apenas dados públicos fornecidos na entrada.
2) Não invente métricas privadas (ROAS, lucro, CPA real). Se não existir, diga "indisponível".
3) Se um campo não existir, retorne null — não penalize por falta de dado.

Para cada anúncio encontrado, extraia um OFFER CARD estruturado:
- promise: benefício principal (1 linha)
- mechanism: como a promessa é atingida (método, sistema, ingrediente)
- proof: evidências citadas (números, depoimentos, garantia)
- cta: chamada para ação
- angle: categoria do apelo (dor, desejo, objeção, urgência, prova social, autoridade, curiosidade)
- format: tipo do criativo (UGC, tutorial, demo, carrossel, imagem estática, antes/depois, storytelling)

Para cada anúncio com link, mapeie o FUNIL:
- url_destino: link do anúncio
- platform_guess: Shopify, Hotmart, Monetizze, Kiwify ou null
- checkout_present: true/false/unknown
- funnel_map: "Ad -> Landing -> Checkout"

Calcule um SCALE SCORE (0-10) baseado em SINAIS DE ESCALA REAIS:
- Longevidade (dias_ativo): anúncios rodando há 14+ dias provavelmente são lucrativos — ninguém paga por anúncio que não converte. Este é o SINAL MAIS FORTE de escala. Peso: 40%
- Densidade do anunciante: se o mesmo anunciante tem múltiplos anúncios ativos, está escalando. Peso: 25%
- Variações de criativo: diferentes textos/imagens para o mesmo produto indicam testes A/B e escala. Peso: 20%
- Recorrência da promessa/mecanismo: mesma promessa aparecendo em múltiplos anunciantes indica nicho validado. Peso: 15%

PRIORIZE anúncios com mais dias ativos. Um anúncio rodando há 30+ dias é muito mais valioso que um de 2 dias.

RESPONDA EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem backticks, apenas o JSON puro:

{
  "score_oportunidade": 1-10,
  "veredicto": "frase curta sobre viabilidade do nicho",
  "tendencias": {
    "interesse_crescente": true/false,
    "sazonalidade": "descrição da sazonalidade se houver",
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
      "anunciante": "nome do anunciante ou página",
      "texto_anuncio": "texto principal do anúncio (primeiras linhas)",
      "plataforma": "Facebook/Instagram",
      "status": "Ativo",
      "data_inicio": "data estimada se disponível",
      "dias_ativo": 0,
      "cta": "botão de ação",
      "url_destino": "URL da página de vendas",
      "url_anuncio": "link para o anúncio na Meta Ad Library",
      "tipo_midia": "vídeo/imagem/carrossel",
      "gancho": "frase de gancho principal",
      "scale_score": 0.0,
      "sinais_escala": ["longevidade: X dias", "múltiplos criativos", "etc"],
      "offer_card": {
        "promise": "...",
        "mechanism": "...",
        "proof": ["..."],
        "angle": ["..."],
        "format": "...",
        "compliance_note": "ok | atenção: ..."
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
    "faixa_preco": "R$ X a R$ Y",
    "modelos_funil": ["modelo 1", "modelo 2"],
    "diferenciais_vencedores": ["diferencial 1", "diferencial 2"],
    "exemplos": [
      {"nome": "nome da oferta", "tipo": "curso/mentoria/etc", "destaque": "por que está escalando"}
    ],
    "insights": ["insight 1", "insight 2"]
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
}

IMPORTANTE para "anuncios_encontrados": 
- Os dados de anúncios reais foram obtidos pela Meta Graph API oficial. USE EXATAMENTE os dados fornecidos (anunciante, texto, URLs, datas).
- NÃO invente URLs nem links. Se o campo url_destino ou url_anuncio estiver como "N/A" ou null, retorne null.
- Para cada anúncio real, gere o offer_card e funnel baseado no texto e dados fornecidos.
- Se não houver anúncios reais nos dados, retorne array vazio em anuncios_encontrados. NÃO gere exemplos fictícios.
- Mantenha os campos ad_archive_id, url_destino e url_anuncio exatamente como recebidos dos dados.
- FILTRO DE RELEVÂNCIA OBRIGATÓRIO: Antes de incluir qualquer anúncio, verifique se o conteúdo (texto, anunciante, CTA, URL destino) é SEMANTICAMENTE RELEVANTE para o nicho "${niche}". Descarte anúncios que claramente não pertencem ao nicho pesquisado — por exemplo, se o nicho é "Agentes de IA" e o anúncio é sobre novelas, romance ou entretenimento não relacionado, EXCLUA-O do resultado. Inclua apenas anúncios que tenham relação direta com o tema pesquisado.
- Se após filtrar não restarem anúncios relevantes, retorne array vazio e ajuste o veredicto explicando que não foram encontrados anúncios relevantes para o nicho.`
          },
          {
            role: "user",
            content: `Nicho pesquisado: "${niche}"\n\nDados coletados:\n\n${fullContext}${metaAdsContext}\n\n${realAds.length > 0 ? `DADOS ESTRUTURADOS DOS ANÚNCIOS (use estes dados exatos):\n${JSON.stringify(realAds, null, 2)}` : "Nenhum anúncio real encontrado via Meta API."}`
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
      // Extract JSON: try brace extraction first (most reliable), then strip markdown
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

    return new Response(JSON.stringify({
      success: true,
      data: parsed,
      sources_used: searchKeys,
      sources_count: Object.fromEntries(
        Object.entries(resultsBySource).map(([k, v]) => [k, v.length])
      ),
      scrape_sources: Object.fromEntries(
        Object.entries(scrapesBySource).map(([k, v]) => [k, v ? "ok" : "empty"])
      ),
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
