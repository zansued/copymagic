import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um estrategista de marcas e copywriter sênior. O usuário vai descrever seu negócio, produto ou serviço em linguagem livre. Com base nisso, gere o DNA completo da marca em formato JSON.

RETORNE EXCLUSIVAMENTE um JSON válido (sem markdown, sem backticks, sem texto antes ou depois) com esta estrutura exata:

{
  "brand_identity": {
    "biography": "...",
    "mission": "...",
    "differentials": "...",
    "market_focus": "..."
  },
  "brand_voice": {
    "voice_essence": "...",
    "brand_persona": "...",
    "audience_relationship": "...",
    "personality_pillars": "...",
    "linguistic_profile": "...",
    "tone_spectrum": "...",
    "signature_expressions": "..."
  },
  "target_audience": {
    "demographics": "...",
    "avatar_description": "...",
    "central_problem": "...",
    "secondary_problems": "...",
    "emotions": "...",
    "fears": "...",
    "secret_desires": "...",
    "objections": "...",
    "powerful_words": "...",
    "powerful_phrases": "..."
  },
  "product_service": {
    "main_problem": "...",
    "unique_mechanism": "...",
    "main_promise": "...",
    "methodology": "...",
    "deliverables": "...",
    "offer_name": "...",
    "unique_value_proposition": "..."
  },
  "credentials": {
    "experience": "...",
    "specialization": "...",
    "certifications": "...",
    "results": "...",
    "authority_summary": "..."
  }
}

INSTRUÇÕES:
- Preencha TODOS os campos com conteúdo rico, estratégico e profissional
- Use linguagem persuasiva e direta
- Infira informações que façam sentido com base no que o usuário descreveu
- Campos como "certifications" ou "results": se não mencionados, escreva sugestões realistas que o usuário pode adaptar
- "powerful_words" e "powerful_phrases": gere palavras e frases que ressoam com o público-alvo descrito
- "signature_expressions": crie expressões marcantes e memoráveis para a marca
- Responda no mesmo idioma do usuário
- NÃO inclua nenhum texto fora do JSON`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const { description } = await req.json();

    if (!description?.trim()) {
      return new Response(JSON.stringify({ error: "Descrição é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (description.length > 10000) {
      return new Response(JSON.stringify({ error: "Descrição muito longa (máximo 10.000 caracteres)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 8000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: description },
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON from the AI response
    let dna;
    try {
      // Remove possible markdown code blocks
      const cleaned = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      dna = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI JSON:", content);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(dna), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
