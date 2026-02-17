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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
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

    // Scrape Meta Ad Library for real ads
    const scrapeMetaAdLibrary = async (query: string) => {
      try {
        const encodedQuery = encodeURIComponent(query);
        const adLibraryUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=${encodedQuery}&search_type=keyword_unordered&media_type=all`;
        
        console.log("Scraping Meta Ad Library:", adLibraryUrl);
        
        const res = await fetch(`${firecrawlBaseUrl}/v1/scrape`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: adLibraryUrl,
            formats: ["markdown", "links"],
            waitFor: 3000,
          }),
        });
        
        const data = await res.json();
        if (!res.ok) {
          console.error("Meta Ad Library scrape error:", data);
          return null;
        }
        return data.data || data;
      } catch (e) {
        console.error("Meta Ad Library scrape failed:", e);
        return null;
      }
    };

    // Parallel searches based on selected sources
    const searchPromises: Record<string, Promise<any[]>> = {};
    let metaAdsPromise: Promise<any> | null = null;

    if (sources.includes("trends")) {
      searchPromises.trends = searchFirecrawl(
        `"${niche}" tendências crescimento 2025 Google Trends volume busca`,
        5
      );
    }

    if (sources.includes("ads")) {
      searchPromises.ads = searchFirecrawl(
        `"${niche}" anúncios Facebook Instagram Meta Ad Library ads escalados criativos`,
        5
      );
      metaAdsPromise = scrapeMetaAdLibrary(niche);
    }

    if (sources.includes("platforms")) {
      searchPromises.platforms = searchFirecrawl(
        `"${niche}" produto digital infoproduto Hotmart Kiwify vendas escalado oferta high ticket`,
        5
      );
    }

    const searchKeys = Object.keys(searchPromises);
    const [searchResults, metaAdsRaw] = await Promise.all([
      Promise.all(Object.values(searchPromises)),
      metaAdsPromise,
    ]);
    const resultsBySource: Record<string, any[]> = {};
    searchKeys.forEach((key, i) => {
      resultsBySource[key] = searchResults[i];
    });

    console.log("Search results collected:", Object.fromEntries(
      Object.entries(resultsBySource).map(([k, v]) => [k, v.length])
    ));

    // Build context for AI analysis
    const contextParts: string[] = [];

    if (resultsBySource.trends?.length) {
      contextParts.push("## TENDÊNCIAS DE BUSCA\n" + resultsBySource.trends
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1200)}`)
        .join("\n\n"));
    }

    if (resultsBySource.ads?.length) {
      contextParts.push("## ANÚNCIOS E CRIATIVOS\n" + resultsBySource.ads
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1200)}`)
        .join("\n\n"));
    }

    if (resultsBySource.platforms?.length) {
      contextParts.push("## PRODUTOS DIGITAIS EM PLATAFORMAS\n" + resultsBySource.platforms
        .map((r: any, i: number) => `### Fonte ${i + 1}: ${r.title || r.url}\n${(r.markdown || r.description || "").slice(0, 1200)}`)
        .join("\n\n"));
    }

    const fullContext = contextParts.join("\n\n---\n\n").slice(0, 8000);

    // AI analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const culturalPrompt = buildCulturalSystemPrompt(genCtx);

    // Extract ads from Meta Ad Library markdown
    let metaAdsContext = "";
    const extractedAds: any[] = [];
    
    if (metaAdsRaw) {
      const markdown = metaAdsRaw.markdown || "";
      const links = metaAdsRaw.links || [];
      metaAdsContext = `\n\n## ANÚNCIOS REAIS DA META AD LIBRARY\n${markdown.slice(0, 2000)}`;
      
      // Try to extract ad-like links
      const adLinks = links.filter((l: string) => 
        l && (l.includes("facebook.com/ads/library") || l.includes("facebook.com/") || l.includes("instagram.com/"))
      ).slice(0, 10);
      
      console.log("Meta Ad Library links found:", adLinks.length);
    }

    // Use AI to also extract structured ad data from the Meta Ad Library content
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um analista de mercado digital especializado em ofertas escaladas e infoprodutos. Analise os dados coletados de múltiplas fontes e forneça uma análise estratégica completa.

${culturalPrompt}

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
      "cta": "botão de ação (Saiba Mais, Comprar, etc)",
      "url_destino": "URL da página de vendas se encontrada",
      "url_anuncio": "link direto para o anúncio na Meta Ad Library se disponível",
      "tipo_midia": "vídeo/imagem/carrossel",
      "gancho": "frase de gancho principal do criativo"
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

IMPORTANTE para "anuncios_encontrados": Extraia o máximo de anúncios reais que encontrar nos dados da Meta Ad Library. Se não encontrar dados reais, gere exemplos realistas baseados no nicho pesquisado com a flag "exemplo": true. Tente extrair pelo menos 4-6 anúncios.`
          },
          {
            role: "user",
            content: `Nicho pesquisado: "${niche}"\n\nDados coletados:\n\n${fullContext}${metaAdsContext}`
          }
        ],
        temperature: 0.7,
        max_tokens: 8192,
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
      console.error("Failed to parse AI response:", rawContent);
      parsed = { error: "Não foi possível analisar os resultados", raw: rawContent };
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsed,
      sources_used: searchKeys,
      sources_count: Object.fromEntries(
        Object.entries(resultsBySource).map(([k, v]) => [k, v.length])
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
