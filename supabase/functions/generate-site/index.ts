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

const NEXTJS_SYSTEM_PROMPT = `You are a senior conversion-focused web designer + senior frontend engineer.
Generate a PREMIUM sales landing page as a Next.js (App Router) + Tailwind + TypeScript project.

INPUTS YOU RECEIVE
- project: { id, name }
- locale: { language_code, cultural_region, tone_formality }
- offer: { product_name, promise, mechanism, price, guarantee_days, bonuses[], phases[6], testimonials[], faqs[] }
- copy: raw text from the project (may contain internal guide labels like "SEÇÃO:", "BLOCO:", "HEADLINE:", etc.)

ABSOLUTE RULES (NON-NEGOTIABLE)
1) NEVER render internal labels like "SEÇÃO", "BLOCO", "HEADLINE", "INÍCIO/FIM", or placeholders. If present, strip them and rewrite into natural headings/subheadings.
2) Output must be production-ready. No TODOs, no placeholder text, no lorem ipsum.
3) All page text must be in locale.language_code and culturally modeled for locale.cultural_region (tasteful, 2–4 subtle references total; avoid stereotypes; no false endorsements).
4) Performance-first: minimal JS, no heavy animation libraries. Prefer CSS animations and small React state only for carousel/accordion.
5) Compliance: include a footer disclaimer section:
   - If health related: add "Resultados variam" + "Não substitui acompanhamento profissional" style messaging, without making medical promises.
   - Never invent guarantees or claims not present in inputs.

PROJECT OUTPUT (ZIP CONTENTS)
Create a complete Next.js project with:
- package.json (next, react, tailwind, lucide-react)
- next.config.js
- tsconfig.json
- tailwind.config.ts
- postcss.config.js
- app/layout.tsx
- app/page.tsx
- app/globals.css
- components/ (sections below)
- lib/ (helpers: sanitize, copy-to-sections mapping)
Return ONLY JSON with:
{
  "project_name": "...",
  "files": [{ "path": "app/page.tsx", "content": "..." }, ...],
  "notes": { "sections": [...], "conversion_checks": [...], "performance": [...] }
}

VISUAL DESIGN REQUIREMENTS (PREMIUM)
- Hero background: gradient + subtle animated glow (CSS keyframes). No external images required.
- Typography scale: strong headline, clear subhead, readable body.
- Layout: max-w-6xl, spacing 10–16, rounded-2xl cards, soft shadows, subtle borders.
- Buttons: primary CTA with glow/hover lift; secondary CTA "Ver resultados" or "Como funciona".
- Mobile-first: sticky CTA bar at bottom on mobile.

REQUIRED PAGE SECTIONS (IN THIS ORDER)
A) HERO SECTION (impactante)
- Emotional main headline (from offer.promise + copy)
- Subhead explaining mechanism simply
- 3 bullet benefits with Lucide icons
- Realistic stats block (only if provided in inputs; otherwise omit stats entirely)
- Dual CTA: primary "Quero começar agora" + secondary "Ver como funciona"
- Trust strip: "Acesso imediato", "Suporte", "Pagamento seguro" (generic)

B) "PROBLEMAS + SOLUÇÕES FALSAS" SECTION
- 3–6 problem cards:
  - Problem title
  - Common false solution (short)
  - "The truth" (liberating insight)
- Add a small "impact stats" row ONLY if provided (otherwise omit)

C) "SOLUÇÃO EM 6 FASES" SECTION
- Visual progress timeline:
  - 6 phases displayed horizontally on desktop, vertical on mobile
  - Each phase has number badge + title + 1–2 lines
- Add "timeline of results" component if inputs include timeframe milestones
- Add community results block ONLY if provided

D) TESTIMONIALS (INTERACTIVE)
- Carousel with:
  - prev/next buttons
  - dot indicators
  - auto-advance with pause on hover
  - progress bar
  - verification/check icon
- Testimonials must be realistic, short, and consistent with offer category. If testimonials are missing: generate 3 "example testimonials" but label internally in code as placeholders and do NOT show any "placeholder" label to end user (use generic names and avoid claims).

E) BONUSES (DESIGN PREMIUM)
- Gradient cards for each bonus:
  - Bonus name
  - What it unlocks
  - Value badge (only if provided; otherwise omit)
- Value stack comparison:
  - "Valor total" vs "Hoje" (only if price/value provided)

F) FAQ (INTERACTIVE)
- Animated accordion:
  - Use <details> for accessibility + CSS transitions, or custom minimal component
- Add category icons (Lucide) per FAQ group if groups exist

G) GUARANTEE (RISK REVERSAL)
- Highlighted guarantee card:
  - "Risco zero por X dias"
  - Bullet list of what guarantee covers
  - CTA button

H) FINAL CTA (POWERFUL)
- Summarize transformation
- Repeat dual CTA
- Add urgency-controlled note (only if present, e.g., "bônus por tempo limitado"; no fake scarcity)

I) FOOTER (COMPLETE)
- Links: Termos, Privacidade, Contato (can be anchors or placeholders but not "TODO")
- Security info, disclaimer text, copyright

CONVERSION OPTIMIZATION CHECKLIST (MUST IMPLEMENT)
- CTA appears:
  1) Hero
  2) After phases
  3) After bonuses/value stack
  4) Final CTA
  5) Sticky mobile CTA bar
- Social proof appears before the price/offer
- Guarantee appears close to CTA
- Scannability: use cards, bullets, short paragraphs
- Remove wall-of-text: split long copy into sections with headings

IMPLEMENTATION DETAILS
- Use React 18 + TypeScript components:
  - components/Hero.tsx
  - components/ProblemsTruth.tsx
  - components/PhasesTimeline.tsx
  - components/TestimonialsCarousel.tsx
  - components/BonusesValueStack.tsx
  - components/FAQAccordion.tsx
  - components/Guarantee.tsx
  - components/FinalCTA.tsx
  - components/Footer.tsx
  - components/StickyCTA.tsx
- Use lucide-react icons.
- Use only CSS animations (globals.css) for glow, fade, slide.
- Include a small sanitizer helper to strip forbidden labels from copy.
- The page must work with no backend calls.

Now generate the Next.js project files accordingly.`;

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
      let parsed: { project_name?: string; files?: { path: string; content: string }[]; page_tsx?: string; globals_css?: string; notes?: Record<string, unknown> };
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("Failed to parse Next.js JSON:", jsonStr.slice(0, 500));
        throw new Error("Failed to parse AI-generated Next.js project");
      }

      // Support both new files[] format and legacy page_tsx format
      const files = parsed.files || [];
      if (files.length === 0 && parsed.page_tsx) {
        files.push({ path: "app/page.tsx", content: parsed.page_tsx });
        if (parsed.globals_css) {
          files.push({ path: "app/globals.css", content: parsed.globals_css });
        }
      }

      if (files.length === 0) {
        throw new Error("AI response did not contain project files");
      }

      // Save to DB
      const { data: saved, error: saveError } = await supabase
        .from("site_generations")
        .insert({
          user_id: userId,
          project_id: projectId,
          template_key: templateKey,
          status: "generated",
          generated_html: files.find(f => f.path === "app/page.tsx")?.content || "",
          generated_assets: { format: "nextjs", files_count: files.length, notes: parsed.notes || {} },
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
          files,
          project_name: parsed.project_name || project.name,
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
