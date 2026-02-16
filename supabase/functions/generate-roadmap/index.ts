import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { objective, brand_context } = await req.json();

    if (!objective?.trim()) {
      return new Response(JSON.stringify({ error: "Objetivo é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um estrategista digital expert em marketing, infoprodutos e negócios online. 
Sua missão é criar um ROADMAP ESTRATÉGICO personalizado — um passo-a-passo claro e acionável para quem está iniciando.

REGRAS OBRIGATÓRIAS:
1. Gere entre 6 e 12 passos estratégicos
2. Cada passo deve ser uma AÇÃO CONCRETA, não teoria
3. Os passos devem seguir uma ORDEM LÓGICA de execução
4. Cada passo deve ter conexão com um agente de IA disponível quando possível
5. Responda EXCLUSIVAMENTE em JSON válido, sem texto antes ou depois
6. O título do roadmap deve ser curto e motivacional (máx 6 palavras)

AGENTES DISPONÍVEIS (use o id exato):
- icp-profile: Perfil do Cliente Ideal
- low-ticket-ideas: Ideias de Produto Low Ticket
- high-ticket-ideas: Ideias de Produto High Ticket
- lead-magnet-ideas: Ideias de Isca Digital
- offer-generator: Gerador de Ofertas
- sales-page: Arquiteto de Vendas (página de vendas)
- vsl-writer: Roteirista VSL
- carousel-creator: Designer de Carrosséis
- ad-generator: Gerador de Anúncios
- ad-funnel: Funil de Anúncios
- content-calendar: Calendário de Conteúdo
- headlines: Headlines (Títulos)
- hooks: Hooks
- post-captions: Legendas para Posts
- video-script: Roteiro de Vídeos Verticais
- newsletter-writer: Escritor de Newsletter
- landing-page-copy: Landing Pages
- brand-voice: Arquiteto de Marca
- offer-naming: Nomes para Ofertas
- methodology: Metodologia
- unique-mechanism: Mecanismo Único
- persuasive-premise: Premissa Persuasiva
- low-ticket-product: Gerador de Produto Low Ticket
- high-ticket-product: Gerador de Produto High Ticket
- lead-magnet-generator: Gerador de Isca Digital
- content-ideas: Ideias de Conteúdos
- storytelling-adapter: Adaptador de Storytelling
- email-generator: Gerador de Email
- short-vsl: Short VSL
- mini-vsl: Mini VSL

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título curto do roadmap",
  "steps": [
    {
      "order": 1,
      "title": "Nome do passo (3-6 palavras)",
      "description": "Explicação detalhada de O QUE fazer e POR QUE (2-3 frases)",
      "tip": "Dica prática ou insight rápido",
      "agent_id": "id-do-agente-recomendado ou null",
      "agent_name": "Nome do agente ou null",
      "emoji": "emoji representativo"
    }
  ]
}

${brand_context ? `\n--- DNA DE MARCA DO USUÁRIO ---\n${brand_context}` : ""}

OBJETIVO DO USUÁRIO:
${objective}`;

    const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");

    let apiUrl: string;
    let apiKey: string;
    let model: string;

    if (DEEPSEEK_KEY) {
      apiUrl = "https://api.deepseek.com/v1/chat/completions";
      apiKey = DEEPSEEK_KEY;
      model = "deepseek-chat";
    } else if (OPENAI_KEY) {
      apiUrl = "https://api.openai.com/v1/chat/completions";
      apiKey = OPENAI_KEY;
      model = "gpt-4o-mini";
    } else {
      return new Response(JSON.stringify({ error: "Nenhuma API key configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: objective },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "Erro na geração do roadmap" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Roadmap error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
