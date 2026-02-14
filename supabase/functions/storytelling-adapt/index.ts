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

    const { original_content, framework_structure, framework_name, brand_context, extra_instructions, provider } = await req.json();

    if (!original_content?.trim()) {
      return new Response(JSON.stringify({ error: "Conteúdo original é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(framework_structure, framework_name, brand_context, extra_instructions);

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
        max_tokens: 8000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Aqui está o conteúdo original que preciso que você transforme:\n\n---\n${original_content}\n---` },
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

function buildSystemPrompt(
  frameworkStructure: string,
  frameworkName: string,
  brandContext?: string,
  extraInstructions?: string,
): string {
  const lines: string[] = [];

  lines.push(`Você é o Adaptador de Storytelling — um especialista em narrativa persuasiva e reestruturação de conteúdo.

Sua missão é TRANSFORMAR o conteúdo fornecido pelo usuário em uma versão mais poderosa e persuasiva, aplicando o framework narrativo "${frameworkName}".

REGRAS FUNDAMENTAIS:
1. MANTENHA o formato original do conteúdo (se é e-mail, mantenha como e-mail; se é post, mantenha como post; se é roteiro, mantenha como roteiro).
2. PRESERVE a mensagem central e os dados/fatos do conteúdo original.
3. REESTRUTURE a narrativa para seguir o framework selecionado.
4. ELEVE o impacto emocional e a persuasão sem alterar o propósito do texto.
5. Use linguagem vívida, sensorial e emocionalmente ressonante.
6. Mantenha o tom e a voz da marca se um DNA de Marca for fornecido.`);

  lines.push(`\n--- FRAMEWORK NARRATIVO: ${frameworkName} ---\n${frameworkStructure}`);

  if (brandContext?.trim()) {
    lines.push(`\n--- DNA DE MARCA (use como referência de voz, tom e identidade) ---\n${brandContext}`);
  }

  if (extraInstructions?.trim()) {
    lines.push(`\n--- INSTRUÇÕES EXTRAS DO USUÁRIO ---\n${extraInstructions}`);
  }

  lines.push(`\nAGORA transforme o conteúdo do usuário seguindo rigorosamente este framework. Entregue o resultado final pronto para uso, sem comentários meta ou explicações sobre o processo.`);

  return lines.join("\n");
}
