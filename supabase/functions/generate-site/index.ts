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

const HTML_SYSTEM_PROMPT = `You are an elite web designer who creates STUNNING, award-winning landing pages.
Your job: generate a VISUALLY BREATHTAKING, modern, premium landing page as a single HTML file.

THE PAGE MUST LOOK LIKE A $10,000+ AGENCY-BUILT PAGE. Not a template. Not generic. PREMIUM.

CRITICAL: SECTION MARKERS
Every major section MUST have a data-section attribute for identification. Use these exact values:
- data-section="hero"
- data-section="trust-strip"
- data-section="problems"
- data-section="solution"
- data-section="features"
- data-section="social-proof"
- data-section="pricing"
- data-section="faq"
- data-section="guarantee"
- data-section="final-cta"
- data-section="footer"

Example: <section data-section="hero" class="...">...</section>

VISUAL DESIGN REQUIREMENTS (CRITICAL — THIS IS WHAT MAKES OR BREAKS THE PAGE):
- HERO: Full-viewport height. Large bold headline (48-72px). Gradient text on key words. Animated subtle background (CSS keyframes for floating orbs/glows). Clear visual hierarchy.
- TYPOGRAPHY: Use Inter + a display font from Google Fonts. Headline 48-72px bold. Body 16-18px. Strong contrast. Letter-spacing on uppercase labels.
- COLOR: Use the provided brand.primary_color as the accent. Build a full palette: dark bg (#0a0a0f to #111827 range), subtle card surfaces, gradient accents. For light themes use warm whites (#fafaf8).
- SPACING: Generous — sections with 80-120px vertical padding. Cards with 24-32px padding. Breathing room everywhere.
- CARDS & SURFACES: Rounded corners (16-24px). Subtle borders (1px rgba). Glass/frosted effects with backdrop-filter. Soft box-shadows with colored glows.
- GRADIENTS: Use gradients on buttons, text highlights, decorative elements. Radial gradient backgrounds behind sections.
- ANIMATIONS (CSS only): Fade-in on scroll (IntersectionObserver + CSS transitions). Floating glow orbs. Subtle hover lifts on cards. Smooth accordion for FAQ.
- BUTTONS: Large (48-56px height), rounded-full or rounded-xl, gradient backgrounds, hover glow effect, transform scale on hover.
- SECTIONS: Hero → Trust Strip → Problem/Pain → Solution/Mechanism → Features/Benefits → Social Proof → Pricing/Offer → FAQ → Guarantee → Final CTA → Footer.
- MOBILE: Fully responsive. Sticky CTA bar on mobile. Stack columns. Adjust font sizes.
- ICONS: Use inline SVG icons (simple geometric) for features/benefits. Do NOT use external icon libraries.

CONTENT RULES:
- NEVER output internal labels: "SEÇÃO:", "PÁGINA DE VENDAS", "{SIM...}", "(Inserir ...)", "(Espaço para ...)".
- Strip and rewrite any such labels into natural, compelling headings.
- Production-ready: no empty paragraphs, no dummy text, no TODOs.
- Write everything in the provided locale language.
- Adapt culturally to locale.region_hint.

TECHNICAL RULES:
- Single HTML file. ALL CSS inline in <style> tag. Minimal JS for scroll animations + accordion + carousel.
- Use Google Fonts (Inter + one display font) with display=swap.
- Include viewport meta tag, proper charset.
- CSS custom properties for colors (easy theming).
- Use CSS Grid and Flexbox for layouts.
- Include smooth scroll behavior.

OUTPUT FORMAT:
Return ONLY a JSON object (no markdown fences) with:
{
  "file_name": "<project-name>-<page_type>.html",
  "html": "<!doctype html>...full premium HTML here...",
  "sections": ["hero", "trust-strip", "problems", ...list of data-section values used],
  "notes": { "sections": [...], "locale_touches": [...] }
}

Generate the page now. Make it STUNNING.`;

const EDIT_SECTION_PROMPT = `You are an elite web designer. You will receive:
1) The current full HTML of a landing page
2) The name of a section to modify (identified by data-section attribute)
3) An instruction describing what to change

Your job: modify ONLY the specified section according to the instruction. Keep ALL other sections exactly as they are.

RULES:
- Return the COMPLETE modified HTML (full page, not just the section)
- Preserve all CSS, JS, and other sections untouched
- Keep the data-section attribute on the modified section
- Make the changes look professional and consistent with the rest of the page
- If the instruction asks to add elements, add them within the section
- If asked to improve styling, enhance it while keeping the design language consistent
- Write content in the same language as the existing page

OUTPUT FORMAT:
Return ONLY a JSON object (no markdown fences) with:
{
  "html": "<!doctype html>...full modified HTML...",
  "changes": "Brief description of what was changed"
}`;

// Step 1: Extract structured PageSpec from copy
const PAGESPEC_SYSTEM_PROMPT = `ROLE
You are a senior conversion copywriter and content architect.
Your job: extract and structure the provided copy into a rich PageSpec JSON.

CRITICAL RULES:
1) PRESERVE ALL COPY CONTENT. Do NOT summarize or reduce sections to single phrases.
   Each section must contain the FULL text, paragraphs, bullets, and details from the original copy.
   If the copy has 5 paragraphs for a section, the PageSpec must have all 5 paragraphs.
2) Strip internal labels ("SEÇÃO:", "BLOCO:", "HEADLINE:", "INÍCIO", "FIM", "{...}", "(insira...)", "TODO")
   but keep ALL the actual content text.
3) Organize content into the correct section structure.
4) Write in the same language as the copy.

OUTPUT FORMAT (ONLY JSON, no markdown):
{
  "hero": {
    "headline": "full headline text",
    "subhead": "full subheadline text",
    "bullets": ["full bullet 1", "full bullet 2", "full bullet 3"],
    "cta_primary": "CTA text",
    "cta_secondary": "secondary CTA text",
    "trust_items": ["item1", "item2", "item3"]
  },
  "problems": [
    { "title": "problem title", "description": "full description paragraph(s)", "false_solution": "what people try", "truth": "the real insight" }
  ],
  "mechanism": {
    "title": "section title",
    "description": "full explanation text - ALL paragraphs",
    "steps": [{ "title": "step", "description": "full detail" }],
    "differentiators": [{ "title": "diff", "description": "full detail" }]
  },
  "phases": [
    { "title": "phase name", "description": "full description with ALL details from copy", "outcome": "expected result" }
  ],
  "testimonials": [
    { "name": "person", "role": "context", "text": "FULL testimonial text - do not truncate" }
  ],
  "bonuses": [
    { "title": "bonus name", "description": "full description", "value": "R$ X" }
  ],
  "offer": {
    "title": "offer title",
    "includes": ["full item description 1", "full item description 2"],
    "price": "price if mentioned",
    "original_price": "original price if mentioned",
    "for_who": ["full description 1"],
    "not_for_who": ["full description 1"],
    "urgency": "urgency text if present"
  },
  "guarantee": {
    "title": "guarantee title",
    "days": 30,
    "description": "FULL guarantee description - all paragraphs",
    "bullets": ["bullet 1", "bullet 2"]
  },
  "faqs": [
    { "category": "category if inferable", "question": "full question", "answer": "FULL answer - do not truncate" }
  ],
  "final_cta": {
    "headline": "full headline",
    "description": "full description text",
    "cta_text": "CTA text"
  },
  "footer": {
    "disclaimers": ["disclaimer text"],
    "links": ["Terms", "Privacy", "Contact"]
  }
}

IMPORTANT: Every text field must contain the COMPLETE original text from the copy. 
If a section has multiple paragraphs, include ALL of them joined with newlines.
Do NOT reduce rich copy to skeleton summaries.`;

// Step 2: Render PageSpec into Next.js project
const NEXTJS_RENDER_PROMPT = `ROLE
You are "Premium Landing Builder Agent", a senior conversion-focused web designer + front-end engineer.

INPUT: You receive a structured PageSpec JSON with ALL the copy content already extracted and organized.

YOUR JOB: Render it into a complete Next.js (App Router) + React 18 + TypeScript + Tailwind project.
Use ALL the content from the PageSpec. Do NOT shorten, summarize, or skip any text.

RULES:
1) Use ALL text from the PageSpec as-is. Every paragraph, bullet, testimonial must appear in the final page.
2) Strip any remaining internal labels but preserve the actual content.
3) Performance-first: minimal JS, CSS animations preferred, no heavy libraries.
4) Compliance: include footer disclaimers from PageSpec. Use responsible language.
5) Cultural modeling: write in the locale language, apply subtle cultural touches.
6) Design must look premium: strong typography, generous spacing, card-based scannability,
   alternating section rhythm, clear CTAs and trust cues.

REQUIRED SECTIONS (IN THIS ORDER):
A) Hero - gradient background, animated glow, headline + subhead + bullets + trust strip + dual CTA
B) Problems + False Solutions - card grid
C) Mechanism / The Big Idea - steps + differentiators
D) 6-Phase Protocol - visual timeline (desktop: horizontal, mobile: vertical)
E) Social Proof - testimonials carousel with autoplay, dots, progress
F) Bonuses - gradient cards + value stack
G) Offer + Pricing - checklist + price block + for who / not for who
H) Guarantee - highlighted card + CTA
I) FAQ - accessible accordion
J) Final CTA - recap + dual CTA
K) Footer - links + disclaimers + copyright

DESIGN TOKENS:
- Container: max-w-6xl mx-auto px-4 sm:px-6
- Spacing: py-16/py-20; Cards: rounded-2xl, shadow-sm
- Typography: H1 text-4xl sm:text-5xl font-extrabold; H2 text-2xl sm:text-3xl font-bold
- CSS variables for brand colors in globals.css

FILES TO GENERATE:
- package.json, next.config.js, tsconfig.json, tailwind.config.ts, postcss.config.js
- app/layout.tsx, app/page.tsx, app/globals.css
- components/: Hero, ProblemsTruth, Mechanism, PhasesTimeline, TestimonialsCarousel, BonusesValue, OfferBlock, Guarantee, FAQAccordion, FinalCTA, Footer, StickyCTA
- lib/: sanitize.ts, types.ts

OUTPUT FORMAT (ONLY JSON):
{
  "project_name": "<slugged-name>",
  "files": [{ "path": "package.json", "content": "..." }, ...],
  "notes": {
    "sections": [...],
    "conversion_checks": [...],
    "performance": [...]
  }
}

Now render the PageSpec into a premium Next.js project.`;

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

async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens = 16384): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

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
      temperature: 0.75,
      max_tokens: maxTokens,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI API error:", aiResponse.status, errText);
    throw new Error(`AI generation failed: ${aiResponse.status}`);
  }

  const aiResult = await aiResponse.json();
  return aiResult.choices?.[0]?.message?.content || "";
}

function parseJsonFromAI(rawContent: string): string {
  let jsonStr = rawContent.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return jsonStr;
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
    const action = body.action || "generate";

    // ============================================================
    // ACTION: edit-section
    // ============================================================
    if (action === "edit-section") {
      const { currentHtml, sectionName, instruction } = body as {
        action: string;
        currentHtml: string;
        sectionName: string;
        instruction: string;
      };

      if (!currentHtml || !sectionName || !instruction) {
        return new Response(
          JSON.stringify({ error: "currentHtml, sectionName, and instruction are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Editing section "${sectionName}" with instruction: ${instruction.slice(0, 100)}...`);

      const editPrompt = `Current full HTML of the page:
\`\`\`html
${currentHtml}
\`\`\`

Section to modify: data-section="${sectionName}"

Instruction: ${instruction}

Apply the instruction to ONLY the section identified by data-section="${sectionName}". Return the COMPLETE page HTML with the modification applied. Return ONLY valid JSON.`;

      const rawContent = await callOpenAI(EDIT_SECTION_PROMPT, editPrompt);
      const jsonStr = parseJsonFromAI(rawContent);

      let parsed: { html: string; changes?: string };
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // Try extracting HTML directly
        const htmlMatch = rawContent.match(/<!doctype html[\s\S]*<\/html>/i);
        if (htmlMatch) {
          parsed = { html: htmlMatch[0], changes: "Section modified" };
        } else {
          throw new Error("Failed to parse edited HTML");
        }
      }

      if (!parsed.html) {
        throw new Error("AI response did not contain HTML");
      }

      return new Response(
        JSON.stringify({
          html: parsed.html,
          changes: parsed.changes || "Section modified",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // ACTION: generate (default)
    // ============================================================
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

    if (format === "nextjs") {
      // 2-STEP FLOW: PageSpec → Render
      console.log("Step 1/2: Generating PageSpec from copy...");
      const pageSpecPrompt = `Here are the inputs:

project: { "id": "${projectId}", "name": "${project.name}" }
locale: { "language": "${lang}", "region": "${project.cultural_region || 'auto'}" }

Copy to extract and structure:
"""
${fullCopy}
"""

Extract ALL the copy content into the PageSpec JSON structure. Preserve every paragraph, bullet, and detail. Return ONLY valid JSON.`;

      const rawPageSpec = await callOpenAI(PAGESPEC_SYSTEM_PROMPT, pageSpecPrompt);
      const pageSpecJson = parseJsonFromAI(rawPageSpec);
      
      let pageSpec: Record<string, unknown>;
      try {
        pageSpec = JSON.parse(pageSpecJson);
      } catch {
        console.error("Failed to parse PageSpec:", pageSpecJson.slice(0, 500));
        throw new Error("Failed to parse PageSpec from copy");
      }
      
      console.log("Step 2/2: Rendering PageSpec into Next.js project...");
      const renderPrompt = `PageSpec (structured copy):
${JSON.stringify(pageSpec, null, 2)}

Brand: { "primary_color": "${primaryColor}", "style": "${style}" ${logoUrl ? `, "logo_url": "${logoUrl}"` : ""} ${siteTitle ? `, "site_title": "${siteTitle}"` : ""} }
Locale: { "language": "${lang}", "region": "${project.cultural_region || 'auto'}" }
Template style: "${templateKey}"

Render this PageSpec into a premium Next.js project. Use ALL the content — do not summarize or shorten any text. Return ONLY valid JSON.`;

      const rawContent = await callOpenAI(NEXTJS_RENDER_PROMPT, renderPrompt);
      const jsonStr = parseJsonFromAI(rawContent);
      let parsed: { project_name?: string; files?: { path: string; content: string }[]; page_tsx?: string; globals_css?: string; notes?: Record<string, unknown> };
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("Failed to parse Next.js JSON:", jsonStr.slice(0, 500));
        throw new Error("Failed to parse AI-generated Next.js project");
      }

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
    console.log("Calling OpenAI to generate landing page (format: html)...");
    const rawContent = await callOpenAI(HTML_SYSTEM_PROMPT, userPrompt);
    const jsonStr = parseJsonFromAI(rawContent);

    let parsed: { file_name?: string; html: string; sections?: string[]; notes?: Record<string, unknown> };
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
        sections: parsed.sections || [],
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
