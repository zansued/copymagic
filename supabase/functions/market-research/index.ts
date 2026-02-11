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
    const { query, provider = "deepseek", generation_context } = await req.json();
    const genCtx = validateGenerationContext(generation_context);
    if (!query) {
      return new Response(JSON.stringify({ error: "Query é obrigatória" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY não configurada");

    // Step 1: Search the web for trends/pains related to the query
    console.log("Searching for:", query);
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${query} dores problemas tendências mercado produto digital`,
        limit: 5,
        lang: "pt-br",
        country: "BR",
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    const searchData = await searchResponse.json();
    if (!searchResponse.ok) {
      console.error("Firecrawl search error:", searchData);
      throw new Error(`Firecrawl error: ${searchData.error || searchResponse.status}`);
    }

    // Extract content from search results
    const searchContent = (searchData.data || [])
      .map((r: any, i: number) => {
        const md = r.markdown || r.description || "";
        return `### Fonte ${i + 1}: ${r.title || r.url}\n${md.slice(0, 1500)}`;
      })
      .join("\n\n---\n\n");

    console.log("Search results collected, sending to AI for analysis...");

    // Step 2: Use AI to analyze and extract structured product data
    let aiApiUrl: string;
    let aiApiKey: string;
    let aiModel: string;

    if (provider === "openai") {
      aiApiKey = Deno.env.get("OPENAI_API_KEY") || "";
      if (!aiApiKey) throw new Error("OPENAI_API_KEY não configurada");
      aiApiUrl = "https://api.openai.com/v1/chat/completions";
      aiModel = "gpt-4o";
    } else {
      aiApiKey = Deno.env.get("DEEPSEEK_API_KEY") || "";
      if (!aiApiKey) throw new Error("DEEPSEEK_API_KEY não configurada");
      aiApiUrl = "https://api.deepseek.com/chat/completions";
      aiModel = "deepseek-chat";
    }

    const culturalPrompt = buildCulturalSystemPrompt(genCtx);

    const aiResponse = await fetch(aiApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `Você é um especialista em pesquisa de mercado digital. Analise os dados de pesquisa fornecidos e extraia insights para criar um produto digital.

${culturalPrompt}

RESPONDA EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem backticks, apenas o JSON puro:

{
  "nicho": "nome do nicho identificado",
  "tendencias": ["tendência 1", "tendência 2", "tendência 3"],
  "dores": ["dor 1", "dor 2", "dor 3", "dor 4", "dor 5"],
  "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "produto_sugerido": {
    "nome": "Nome criativo do produto",
    "publico_alvo": "descrição detalhada do público",
    "dor_principal": "a dor mais urgente e lucrativa",
    "solucao": "como o produto resolve a dor",
    "como_funciona": "formato e entrega do produto",
    "diferencial_unico": "o que torna único no mercado"
  },
  "produto_formatado": "The product \\"NOME\\" is for people who \\"PUBLICO\\" suffer from \\"DOR\\", solves it through \\"SOLUÇÃO\\", works as \\"COMO FUNCIONA\\", and stands out for \\"DIFERENCIAL\\"."
}`
          },
          {
            role: "user",
            content: `Pesquisa sobre: "${query}"\n\nDados coletados da web:\n\n${searchContent}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (handle possible markdown wrapping)
    let parsed;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      parsed = { error: "Não foi possível analisar os resultados", raw: rawContent };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("market-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
