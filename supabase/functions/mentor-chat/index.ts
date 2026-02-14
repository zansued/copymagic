import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AVAILABLE_AGENTS = [
  { id: "icp-profile", name: "Perfil do Cliente Ideal (ICP)", category: "ideation", description: "Mapeamento detalhado do cliente ideal" },
  { id: "low-ticket-ideas", name: "Ideias de Produto Low Ticket", category: "ideation", description: "10 ideias de produtos low ticket validadas" },
  { id: "high-ticket-ideas", name: "Ideias de Produto High Ticket", category: "ideation", description: "Conceitos de ofertas premium" },
  { id: "lead-magnet-ideas", name: "Ideias de Isca Digital", category: "ideation", description: "Conceitos de iscas digitais de alta conversão" },
  { id: "big-ideas", name: "Big Ideas para Newsletter", category: "ideation", description: "Conceitos memoráveis" },
  { id: "content-ideas", name: "Ideias de Conteúdos", category: "ideation", description: "Ideação estratégica de conteúdo" },
  { id: "headlines", name: "Headlines (Títulos)", category: "ideation", description: "Títulos irresistíveis" },
  { id: "hooks", name: "Hooks", category: "ideation", description: "Ganchos de atenção" },
  { id: "ad-angles", name: "Ângulos de Anúncios", category: "ideation", description: "5 abordagens estratégicas para anúncios" },
  { id: "youtube-titles", name: "Ângulos e Títulos YouTube", category: "ideation", description: "Títulos otimizados para YouTube" },
  { id: "upsell-ideas", name: "Ideias de Upsell", category: "ideation", description: "Conceitos de upsell estratégicos" },
  { id: "monetization-plan", name: "Plano de Monetização", category: "ideation", description: "Auditoria de perfil e plano financeiro" },
  { id: "marketing-xray", name: "Raio-X de Marketing", category: "ideation", description: "Análise de estratégias de comunicação" },
  { id: "sales-page", name: "Arquiteto de Vendas", category: "copywriting", description: "Páginas de vendas de alta conversão" },
  { id: "vsl-writer", name: "Roteirista VSL", category: "copywriting", description: "Roteiros para Video Sales Letters" },
  { id: "landing-page-copy", name: "Landing Pages", category: "copywriting", description: "Copy para landing pages" },
  { id: "short-vsl", name: "Short VSL [1-3 Min]", category: "copywriting", description: "VSLs curtas para ads" },
  { id: "mini-vsl", name: "Mini VSL [3-7 Min]", category: "copywriting", description: "Mini VSLs de alta conversão" },
  { id: "email-subjects", name: "Assuntos de E-mails", category: "copywriting", description: "Títulos de e-mail de alta abertura" },
  { id: "email-generator", name: "Gerador de Email", category: "copywriting", description: "E-mails de marketing e vendas" },
  { id: "ad-generator", name: "Gerador de Anúncios", category: "copywriting", description: "Anúncios de alta conversão" },
  { id: "ad-funnel", name: "Funil de Anúncios", category: "copywriting", description: "Sequência completa de anúncios por nível de consciência" },
  { id: "content-to-ad", name: "Conteúdo em Anúncio", category: "copywriting", description: "Converte conteúdo orgânico em ads" },
  { id: "google-ads-search", name: "Google Ads Rede de Pesquisa", category: "copywriting", description: "Campanhas Google Ads Search" },
  { id: "universal-adapter", name: "Adaptador Universal", category: "copywriting", description: "Replica estrutura de criativos" },
  { id: "copy-reviewer-cub", name: "Revisor de Copy (CUB)", category: "copywriting", description: "Revisão pelo método CUB" },
  { id: "email-reviewer", name: "Revisor de E-mails", category: "copywriting", description: "Revisão de e-mails e newsletters" },
  { id: "thank-you-page", name: "Página de Obrigado", category: "copywriting", description: "Páginas de obrigado pós-compra" },
  { id: "carousel-creator", name: "Designer de Carrosséis", category: "content", description: "Roteiros de carrosséis virais" },
  { id: "carousel-generator", name: "Gerador de Carrossel", category: "content", description: "Carrosséis com scripts validados" },
  { id: "post-captions", name: "Legendas para Posts", category: "content", description: "Legendas otimizadas" },
  { id: "video-script", name: "Roteiro de Vídeos Verticais", category: "content", description: "Roteiros para Reels/TikTok" },
  { id: "newsletter-writer", name: "Escritor de Newsletter", category: "content", description: "Narrativas para newsletters" },
  { id: "content-calendar", name: "Calendário de Conteúdo", category: "content", description: "Planejamento de conteúdo" },
  { id: "youtube-script", name: "Roteiro de YouTube", category: "content", description: "Roteiros completos para YouTube" },
  { id: "youtube-thumbnails", name: "Thumbnails para YouTube", category: "content", description: "Textos e design para thumbnails" },
  { id: "instagram-stories", name: "Story para Instagram", category: "content", description: "Sequências de stories" },
  { id: "story-launch", name: "Story Launch de 14 Dias", category: "content", description: "Lançamento via stories em 14 dias" },
  { id: "low-ticket-product", name: "Gerador de Produto Low Ticket", category: "products", description: "Produtos digitais low ticket completos" },
  { id: "high-ticket-product", name: "Gerador de Produto High Ticket", category: "products", description: "Plano de entrega high ticket" },
  { id: "offer-generator", name: "Gerador de Ofertas", category: "products", description: "Blueprints de ofertas irresistíveis" },
  { id: "lead-magnet-generator", name: "Gerador de Isca Digital", category: "products", description: "Iscas digitais práticas" },
  { id: "persuasive-premise", name: "Premissa Persuasiva", category: "products", description: "Premissa única de venda" },
  { id: "unique-mechanism", name: "Mecanismo Único da Solução", category: "products", description: "Diferenciação estratégica" },
  { id: "problem-mechanism", name: "Mecanismo Único do Problema", category: "products", description: "Causa raiz surpreendente" },
  { id: "methodology", name: "Metodologia", category: "products", description: "Método proprietário memorável" },
  { id: "spin-selling", name: "SPIN Selling", category: "products", description: "Vendas consultivas método SPIN" },
  { id: "problem-promise", name: "Problema & Promessa", category: "products", description: "Posicionamento estratégico" },
  { id: "brand-voice", name: "Arquiteto de Marca", category: "branding", description: "Tom de voz e identidade verbal" },
  { id: "offer-naming", name: "Nomes para Ofertas", category: "branding", description: "Naming estratégico" },
  { id: "high-value-compass", name: "Bússola do Cliente de Alto Valor", category: "branding", description: "Segmentação high ticket" },
  { id: "brand-voice-extractor", name: "Voz do Autor/Marca", category: "branding", description: "DNA completo da voz de marca" },
  { id: "icp-profile", name: "Perfil do Cliente Ideal", category: "branding", description: "Mapeamento de cliente ideal" },
  { id: "buyer-profiles", name: "Perfis de Compra", category: "branding", description: "Arquétipos de compra" },
];

function buildAgentList(): string {
  const catNames: Record<string, string> = { ideation: "Ideação & Estratégia", copywriting: "Copywriting", content: "Conteúdo & Social", products: "Produtos & Ofertas", branding: "Branding & Posicionamento" };
  return ["ideation", "copywriting", "content", "products", "branding"].map(cat => {
    const agents = AVAILABLE_AGENTS.filter(a => a.category === cat);
    const lines = agents.map(a => "- `" + a.id + "` → " + a.name + ": " + a.description);
    return "**" + catNames[cat] + "**:\n" + lines.join("\n");
  }).join("\n\n");
}

const SYSTEM_PROMPT = `Você é o **Mentor de Riqueza** — um estrategista digital de elite que ajuda empreendedores a alcançar seus objetivos de negócio criando planos de ação práticos usando ferramentas de IA especializadas.

## SUA PERSONALIDADE
- Autoritário mas acessível, como um mentor que já faturou milhões
- Direto ao ponto, sem enrolação
- Usa analogias e exemplos práticos
- Faz perguntas incisivas para entender o contexto
- Celebra vitórias e mantém foco no resultado

## FERRAMENTAS DISPONÍVEIS (AGENTES DE IA)
Você tem acesso a ${AVAILABLE_AGENTS.length} agentes especializados. IMPORTANTE: Use EXATAMENTE o agent_id listado abaixo no campo "agent_id" do fluxo.

${buildAgentList()}

## COMO CRIAR FLUXOS
Quando o usuário descrever um objetivo, analise e crie um FLUXO — uma sequência estratégica dos agentes acima.

Para criar um fluxo, responda normalmente em texto explicando sua estratégia E inclua um bloco JSON especial no formato:

\`\`\`flow
{
  "title": "Nome do Fluxo",
  "goal": "Objetivo resumido",
  "steps": [
    { "agent_id": "id-do-agente", "title": "Título da etapa", "description": "Por que esta etapa e o que fazer" },
    { "agent_id": "outro-agente", "title": "Próxima etapa", "description": "Explicação" }
  ]
}
\`\`\`

REGRAS PARA FLUXOS:
1. Use APENAS agent_ids válidos da lista acima
2. A sequência deve ser LÓGICA — cada etapa alimenta a próxima
3. Mínimo 3 etapas, máximo 8 etapas
4. Explique POR QUE cada etapa está naquela posição
5. Sempre adapte ao contexto específico do usuário

## COMPORTAMENTO
- Se o usuário for vago, faça perguntas antes de criar o fluxo
- Se o objetivo for claro, crie o fluxo imediatamente
- Explique a lógica estratégica por trás da sequência
- Sugira variações quando relevante
- Quando o usuário completar uma etapa, parabenize e oriente sobre a próxima
- Pode criar múltiplos fluxos alternativos se fizer sentido

## EXEMPLOS DE OBJETIVOS → FLUXOS (use os agent_ids exatos)
- "Quero lançar um produto digital" → \`icp-profile\` → \`low-ticket-ideas\` → \`low-ticket-product\` → \`offer-generator\` → \`sales-page\` → \`ad-generator\`
- "Quero criar conteúdo que vende" → \`brand-voice\` → \`content-calendar\` → \`carousel-creator\` → \`post-captions\` → \`instagram-stories\`
- "Quero escalar meus anúncios" → \`marketing-xray\` → \`ad-angles\` → \`ad-funnel\` → \`ad-generator\``;

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

    const { messages, provider = "openai" } = await req.json();

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: "Messages são obrigatórias" }), {
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
        max_tokens: 4000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
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
