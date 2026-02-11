import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// SYSTEM PROMPTS
// ============================================================

const HTML_SYSTEM_PROMPT = `You are a world-class web designer + front-end engineer.
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
- Adapt examples, metaphors, microcopy, and references to locale.region_hint.
- Keep it tasteful and believable. Avoid stereotypes.

DESIGN SYSTEM (premium SaaS landing DNA):
- Use a clean 12-column feel (max-width 1100–1200px), generous spacing, clear typographic scale.
- Use modern gradients/glows subtly (premium), but keep contrast accessible.
- Use cards, separators, and icon bullets for scannability.
- Use sticky mobile CTA.
- Use <details> accordion for FAQ.
- Use a trust strip near the top.
- Include social proof section (testimonials in cards) and a guarantee/risk reversal section.
- The agent has full creative freedom to reinterpret the copy structure.

PERFORMANCE RULES:
- Single HTML file output. Inline critical CSS. Minimal JS.
- Avoid heavy images; use CSS-based abstract backgrounds.
- Use system fonts first; if Google Fonts, only 1–2 families with display=swap.

OUTPUT FORMAT:
Return ONLY a JSON object (no markdown fences, no extra text) with:
{
  "file_name": "<project-name>-<page_type>-<locale_language>.html",
  "html": "<!doctype html>...full HTML here...",
  "notes": {
    "sections": ["Hero", "Problem", ...],
    "locale_touches": ["..."],
    "performance": ["..."]
  }
}

Now generate the page using the provided inputs.`;

const NEXTJS_SYSTEM_PROMPT = `You are a world-class web designer + React/Next.js engineer.
Your job: generate a PREMIUM landing page as a Next.js App Router React component from the provided sales copy.

INPUTS: same as described below (project, page_type, brand, locale, copy).

HARD RULES (non-negotiable):
- NEVER output internal labels or placeholders such as: "SEÇÃO:", "PÁGINA DE VENDAS", "{SIM...}", "(Inserir ...)", "(Espaço para ...)".
- Rewrite those into real headings/subheadings and real UI content.
- Production-ready: no empty paragraphs, no dummy text, no TODO notes.
- Do NOT mention medical claims as guarantees.

LOCALE + CULTURAL MODELLING:
- Write everything in locale.language.
- Adapt examples, metaphors, microcopy to locale.region_hint.
- Keep tasteful, avoid stereotypes.

TECHNICAL RULES FOR NEXT.JS OUTPUT:
- Output a single default-exported React component for app/page.tsx.
- Use ONLY Tailwind CSS utility classes for ALL styling. No inline styles, no CSS modules, no styled-components.
- Use these premium Tailwind tokens: max-w-6xl, rounded-2xl, shadow-sm, spacing (p-8, py-12, py-16, gap-8), prose-like typography scale (text-4xl/5xl for hero, text-2xl/3xl for section headings, text-lg for body).
- Component must be a Server Component (no "use client" directive, no useState/useEffect).
- For FAQ accordion, use native HTML <details>/<summary> elements styled with Tailwind.
- For sticky mobile CTA, use fixed bottom-0 with Tailwind (e.g. fixed bottom-0 left-0 right-0 md:hidden).
- Do NOT import any external libraries. Only use React and HTML elements with Tailwind classes.
- Do NOT use next/image — use regular <img> tags or CSS backgrounds.
- Use semantic HTML: <header>, <main>, <section>, <footer>.

DESIGN DIRECTION:
- Clean layout with generous whitespace.
- Modern gradients/glows via Tailwind (bg-gradient-to-r, etc.).
- Cards for benefits, testimonials, and offer items.
- Trust strip near the top.
- Social proof section with testimonial cards.
- Guarantee/risk reversal section.
- Offer/pricing card with clear CTA.
- Full creative freedom to reinterpret copy structure for maximum conversion.

COLOR SYSTEM:
- Use the provided brand.primary_color as the main accent.
- Define colors using Tailwind arbitrary values like bg-[#7c3aed], text-[#7c3aed], etc.
- For dark themes: use bg-gray-950, bg-gray-900, text-white, text-gray-300.
- For light themes: use bg-white, bg-gray-50, text-gray-900, text-gray-600.

OUTPUT FORMAT:
Return ONLY a JSON object (no markdown fences) with:
{
  "page_tsx": "export default function LandingPage() { return (<>...</>); }",
  "globals_css": "@tailwind base;\\n@tailwind components;\\n@tailwind utilities;\\n\\n/* any additional global styles */",
  "notes": {
    "sections": ["Hero", "Problem", ...],
    "locale_touches": ["..."],
    "tailwind_classes_used": ["...key design tokens used..."]
  }
}

IMPORTANT: The page_tsx value must be a valid single-file React component string. Use standard JSX (className, htmlFor, etc.). No TypeScript types needed — plain JSX is fine.

Now generate the page using the provided inputs.`;

// ============================================================
// HELPERS
// ============================================================
function getStyleFromTemplate(templateKey: string): "dark-premium" | "light-premium" {
  return templateKey === "longform-dr" ? "light-premium" : "dark-premium";
}

function buildUserPrompt(
  projectId: string,
  projectName: string,
  pageType: string,
  primaryColor: string,
  style: string,
  logoUrl: string | undefined,
  siteTitle: string | undefined,
  lang: string,
  culturalRegion: string,
  templateKey: string,
  fullCopy: string
): string {
  return `Here are the inputs:

1) project: { "id": "${projectId}", "name": "${projectName}" }

2) page_type: "${pageType}"

3) brand: {
  "primary_color": "${primaryColor}",
  "secondary_color": "${style === 'dark-premium' ? '#1a1a2e' : '#f5f5f0'}",
  "style": "${style}"
  ${logoUrl ? `, "logo_url": "${logoUrl}"` : ""}
  ${siteTitle ? `, "site_title": "${siteTitle}"` : ""}
}

4) locale: {
  "language": "${lang}",
  "region_hint": "${culturalRegion}"
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
    const { projectId, templateKey = "saas-premium", format = "html", options = {} } = body as {
      projectId: string;
      templateKey?: string;
      format?: "html" | "nextjs";
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
          error: "Este projeto não possui copy da Página de Vendas gerada. Gere a etapa 'Página de Vendas' primeiro.",
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

    const userPrompt = buildUserPrompt(
      projectId,
      project.name,
      pageType,
      primaryColor,
      style,
      options.branding?.logoUrl,
      options.branding?.title,
      lang,
      project.cultural_region || "auto",
      templateKey,
      fullCopy
    );

    const systemPrompt = format === "nextjs" ? NEXTJS_SYSTEM_PROMPT : HTML_SYSTEM_PROMPT;

    // Call OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    console.log(`Calling OpenAI to generate landing page (format: ${format})...`);

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 16384,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    if (format === "nextjs") {
      let parsed: { page_tsx: string; globals_css?: string; notes?: Record<string, unknown> };
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("Failed to parse Next.js JSON:", jsonStr.slice(0, 500));
        throw new Error("Failed to parse AI-generated Next.js project");
      }

      if (!parsed.page_tsx) {
        throw new Error("AI response did not contain page_tsx");
      }

      // Save to DB
      const { data: saved, error: saveError } = await supabase
        .from("site_generations")
        .insert({
          user_id: userId,
          project_id: projectId,
          template_key: templateKey,
          status: "generated",
          generated_html: parsed.page_tsx,
          generated_assets: { format: "nextjs", notes: parsed.notes || {} },
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
          format: "nextjs",
          page_tsx: parsed.page_tsx,
          globals_css: parsed.globals_css || "@tailwind base;\n@tailwind components;\n@tailwind utilities;",
          meta: {
            templateKey,
            projectId,
            generationId: saved?.id || null,
            notes: parsed.notes || null,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // HTML format (default)
    let parsed: { file_name?: string; html: string; notes?: Record<string, unknown> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI JSON, attempting HTML extraction...");
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

    const { data: saved, error: saveError } = await supabase
      .from("site_generations")
      .insert({
        user_id: userId,
        project_id: projectId,
        template_key: templateKey,
        status: "generated",
        generated_html: parsed.html,
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
        format: "html",
        html: parsed.html,
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
