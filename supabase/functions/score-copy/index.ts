import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { copy, agent_name } = await req.json();
    if (!copy || typeof copy !== "string" || copy.length < 50) {
      return new Response(JSON.stringify({ error: "Copy muito curta para avaliar" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um avaliador especialista em copywriting de alta conversão. Avalie a copy fornecida em 5 critérios, dando uma nota de 0 a 100 para cada.

Critérios:
1. **Clareza** — A mensagem é clara e fácil de entender?
2. **Persuasão** — Utiliza gatilhos mentais, prova social, urgência e escassez de forma eficaz?
3. **CTA** — O call-to-action é forte, específico e gera desejo de ação?
4. **Estrutura** — A organização do texto facilita a leitura e mantém a atenção?
5. **Originalidade** — Evita clichês e traz ângulos únicos e memoráveis?

Você DEVE responder usando a ferramenta fornecida. Não adicione texto extra.`;

    const userPrompt = `${agent_name ? `[Agente: ${agent_name}]\n\n` : ""}Avalie esta copy:\n\n${copy.slice(0, 6000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_copy",
              description: "Return copy evaluation scores and suggestions",
              parameters: {
                type: "object",
                properties: {
                  clarity: { type: "number", description: "Score 0-100 for clarity" },
                  persuasion: { type: "number", description: "Score 0-100 for persuasion" },
                  cta: { type: "number", description: "Score 0-100 for CTA strength" },
                  structure: { type: "number", description: "Score 0-100 for structure" },
                  originality: { type: "number", description: "Score 0-100 for originality" },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 concise improvement suggestions in pt-BR",
                  },
                },
                required: ["clarity", "persuasion", "cta", "structure", "originality", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_copy" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao avaliar copy" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scores = JSON.parse(toolCall.function.arguments);
    const overall = Math.round(
      (scores.clarity + scores.persuasion + scores.cta + scores.structure + scores.originality) / 5
    );

    return new Response(
      JSON.stringify({ ...scores, overall }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("score-copy error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
