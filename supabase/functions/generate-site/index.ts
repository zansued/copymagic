import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// AI-POWERED LANDING PAGE GENERATOR
// ============================================================

const SYSTEM_PROMPT = `You are a world-class web designer + front-end engineer.
Your job: generate a PREMIUM, modern, fast landing page (HTML/CSS/JS) from the provided sales copy.

INPUTS (you will receive):
1) project: {id, name}
2) page_type: "sales" | "upsell"
3) brand: {primary_color, secondary_color, style: "dark-premium" | "light-premium"}
4) locale: {language, region_hint}
5) copy: structured sections OR long text (may contain labels like "SEÇÃO:" that are ONLY internal guides)

HARD RULES (non-negotiable):
- NEVER output internal labels or placeholders such as: "SEÇÃO:", "PÁGINA DE VENDAS - INÍCIO/FIM", "{SIM...}", "(Inserir ...)", "(Espaço para ...)".
- If input contains those labels, you must REWRITE them into real headings/subheadings and real UI content.
- The final page must look production-ready: no empty paragraphs, no dummy text, no TODO notes.
- Do NOT mention medical claims as guarantees; keep responsible language and avoid unsafe promises.

LOCALE + CULTURAL MODELLING:
- Write everything in locale.language.
- Adapt examples, metaphors, microcopy, and references to locale.region_hint:
  - If es-ES: Spain references (cities, idioms, cultural touchpoints) and Spain-style Spanish.
  - If es-MX: Mexico references and Mexico-style Spanish.
  - If en-US: US references and idioms; if en-GB: UK references and spelling.
  - If pt-BR: Brazilian Portuguese with Brazilian cultural references.
- Keep it tasteful and believable. Avoid stereotypes. Prefer safe, mainstream references (cities, common institutions, widely-known places).
- Do not overuse references: 2–4 subtle touches across the page is enough.

DESIGN SYSTEM (premium SaaS landing DNA):
- Use a clean 12-column feel (max-width 1100–1200px), generous spacing, clear typographic scale.
- Use modern gradients/glows subtly (premium), but keep contrast accessible.
- Use cards, separators, and icon bullets for scannability.
- Use sticky mobile CTA.
- Use <details> accordion for FAQ.
- Use a trust strip near the top: "Secure checkout", "Instant access", "Support" (translated to locale).
- Include social proof section (testimonials in cards) and a guarantee/risk reversal section.
- The agent has full creative freedom to reinterpret the copy structure — it does NOT need to follow the exact section order from the copy. Reorganize, merge, or split sections as needed for maximum conversion and visual impact.

PERFORMANCE RULES:
- Single HTML file output.
- Inline critical CSS (in <style>).
- Minimal JS (only for small interactions: smooth scroll, optional sticky CTA behavior).
- Avoid heavy images; if you need a hero visual, generate a CSS-based abstract background.
- Use system fonts first; if using Google Fonts, only 1–2 families, with display=swap.

CONTENT MAPPING LOGIC:
- Parse the copy into these sections:
  Hero (big promise + subhead + 3 bullets + CTA)
  Problem agitation (without fearmongering)
  Mechanism (how it works, clearly)
  Benefits (3–6 cards)
  Proof (testimonials + credibility cues)
  Offer (what's included + bonuses)
  Guarantee (risk reversal)
  FAQ
  Final CTA (summary + CTA)
- If page_type = "upsell": focus on "protect results / accelerate / shortcut", add comparison table and "one-time offer" tone.

OUTPUT FORMAT:
Return ONLY a JSON object (no markdown fences, no extra text) with:
{
  "file_name": "<project-name>-<page_type>-<locale_language>.html",
  "html": "<!doctype html>...full HTML here...",
  "notes": {
    "sections": ["Hero", "Problem", "Mechanism", "Benefits", "Proof", "Offer", "FAQ", "Final CTA"],
    "locale_touches": ["...2-4 examples of cultural adaptation you applied..."],
    "performance": ["what you did for speed and accessibility"]
  }
}

Now generate the page using the provided inputs.`;

// ============================================================
// TEMPLATE STYLE MAPPING
// ============================================================
function getStyleFromTemplate(templateKey: string): "dark-premium" | "light-premium" {
  return templateKey === "longform-dr" ? "light-premium" : "dark-premium";
}

// ============================================================
// HANDLER
// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { projectId, templateKey = "saas-premium", options = {} } = body as {
      projectId: string;
      templateKey?: string;
      options?: {
        includeUpsells?: boolean;
        branding?: { title?: string; logoUrl?: string; primaryColor?: string };
        language?: string;
      };
    };

    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const copyResults =
      typeof project.copy_results === "string"
        ? JSON.parse(project.copy_results)
        : project.copy_results || {};

    const salesCopy = copyResults.pagina_vendas || "";
    if (!salesCopy) {
      return new Response(
        JSON.stringify({
          error:
            "Este projeto não possui copy da Página de Vendas gerada. Gere a etapa 'Página de Vendas' primeiro.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let fullCopy = salesCopy;
    const pageType = options.includeUpsells ? "upsell" : "sales";
    if (options.includeUpsells) {
      const upsellCopy = copyResults.pagina_upsell || "";
      if (upsellCopy) fullCopy += "\n\n---\n\n" + upsellCopy;
    }

    const lang = options.language || project.language_code || "pt-BR";
    const primaryColor = options.branding?.primaryColor || "#7c3aed";
    const style = getStyleFromTemplate(templateKey);

    // Build the user prompt with all inputs
    const userPrompt = `Here are the inputs:

1) project: { "id": "${projectId}", "name": "${project.name}" }

2) page_type: "${pageType}"

3) brand: {
  "primary_color": "${primaryColor}",
  "secondary_color": "${style === 'dark-premium' ? '#1a1a2e' : '#f5f5f0'}",
  "style": "${style}"
  ${options.branding?.logoUrl ? `, "logo_url": "${options.branding.logoUrl}"` : ""}
  ${options.branding?.title ? `, "site_title": "${options.branding.title}"` : ""}
}

4) locale: {
  "language": "${lang}",
  "region_hint": "${project.cultural_region || 'auto'}"
}

5) template_style: "${templateKey}" — use this as creative direction:
  - "saas-premium": Dark, sleek SaaS aesthetic. Hero + features + proof + pricing + FAQ. Gradient glows, glass cards.
  - "vsl-page": Dark, video-first. Hero com vídeo placeholder + bullets + proof + sticky CTA.
  - "longform-dr": Light, editorial. Headline forte + storytelling + mechanism + offer. Warm tones, serif accents.
  - "upsell-focus": Dark with purple accents. Comparison table + bonuses + urgency + guarantee.

6) copy:
"""
${fullCopy}
"""

Generate the premium landing page now. Return ONLY valid JSON.`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling Lovable AI to generate landing page...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 32000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (handle markdown fences)
    let parsed: { file_name?: string; html: string; notes?: Record<string, unknown> };
    try {
      // Remove markdown code fences if present
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON response, attempting to extract HTML...");
      // Fallback: try to extract HTML directly
      const htmlMatch = rawContent.match(/<!doctype html[\s\S]*<\/html>/i);
      if (htmlMatch) {
        parsed = { html: htmlMatch[0] };
      } else {
        console.error("Raw AI response:", rawContent.slice(0, 500));
        throw new Error("Failed to parse AI-generated page");
      }
    }

    if (!parsed.html) {
      throw new Error("AI response did not contain HTML");
    }

    const html = parsed.html;

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("site_generations")
      .insert({
        user_id: userId,
        project_id: projectId,
        template_key: templateKey,
        status: "generated",
        generated_html: html,
        generated_assets: parsed.notes || {},
        language_code: lang,
        cultural_region: project.cultural_region,
        branding: options.branding || {},
        include_upsells: options.includeUpsells || false,
      })
      .select()
      .single();

    if (saveError) console.error("Save error:", saveError);

    return new Response(
      JSON.stringify({
        html,
        assets: {},
        meta: {
          templateKey,
          projectId,
          generationId: saved?.id || null,
          notes: parsed.notes || null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-site error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
