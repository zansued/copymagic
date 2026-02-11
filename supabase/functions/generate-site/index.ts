import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// HTML TEMPLATES
// ============================================================

function sanitize(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "");
}

interface ParsedSections {
  heroHeadline: string;
  heroSubhead: string;
  sections: { title: string; content: string }[];
  cta: string;
  faq: string;
  footer: string;
}

function parseCopy(rawCopy: string): ParsedSections {
  const lines = rawCopy.split("\n").filter((l) => l.trim());
  const result: ParsedSections = {
    heroHeadline: "",
    heroSubhead: "",
    sections: [],
    cta: "",
    faq: "",
    footer: "",
  };

  let currentSection: { title: string; content: string[] } | null = null;
  const allSections: { title: string; content: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headings
    const sectionMatch = trimmed.match(
      /^\[([^\]]+)\]$|^#{1,3}\s+(.+)$|^([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s\-–—:]{5,})$/
    );

    if (sectionMatch) {
      if (currentSection) {
        allSections.push({
          title: currentSection.title,
          content: currentSection.content.join("\n"),
        });
      }
      currentSection = {
        title: (sectionMatch[1] || sectionMatch[2] || sectionMatch[3]).trim(),
        content: [],
      };
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    } else {
      // Before any section heading
      if (!result.heroHeadline) {
        result.heroHeadline = trimmed;
      } else if (!result.heroSubhead) {
        result.heroSubhead = trimmed;
      } else {
        // Create implicit first section
        currentSection = { title: "Introdução", content: [trimmed] };
      }
    }
  }

  if (currentSection) {
    allSections.push({
      title: currentSection.title,
      content: currentSection.content.join("\n"),
    });
  }

  // Classify sections
  for (const s of allSections) {
    const titleLow = s.title.toLowerCase();
    if (
      titleLow.includes("hero") ||
      titleLow.includes("headline") ||
      titleLow.includes("impactante")
    ) {
      if (!result.heroHeadline) result.heroHeadline = s.content.split("\n")[0];
      if (!result.heroSubhead)
        result.heroSubhead = s.content.split("\n").slice(1).join(" ");
    } else if (titleLow.includes("faq") || titleLow.includes("perguntas")) {
      result.faq = s.content;
    } else if (titleLow.includes("cta") || titleLow.includes("chamada")) {
      result.cta = s.content;
    } else if (
      titleLow.includes("garantia") ||
      titleLow.includes("footer") ||
      titleLow.includes("rodapé")
    ) {
      result.footer = s.content;
    } else {
      result.sections.push(s);
    }
  }

  // Defaults
  if (!result.heroHeadline && allSections.length > 0) {
    result.heroHeadline = allSections[0].title;
    result.heroSubhead = allSections[0].content.split("\n")[0] || "";
  }
  if (!result.heroHeadline) result.heroHeadline = "Transforme sua vida hoje";
  if (!result.cta) result.cta = "Quero Começar Agora";
  if (!result.footer) result.footer = "© " + new Date().getFullYear();

  return result;
}

function contentToHtml(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";
      if (t.startsWith("•") || t.startsWith("-") || t.startsWith("✅") || t.startsWith("▸")) {
        return `<li>${sanitize(t.replace(/^[•\-✅▸]\s*/, ""))}</li>`;
      }
      return `<p>${sanitize(t)}</p>`;
    })
    .join("\n");
}

function buildSectionsHtml(
  sections: { title: string; content: string }[],
  templateKey: string
): string {
  const altClass = templateKey === "clean-light" ? "section-alt-light" : "section-alt";
  return sections
    .map(
      (s, i) => `
    <section class="content-section ${i % 2 !== 0 ? altClass : ""}">
      <div class="container">
        <h2>${sanitize(s.title)}</h2>
        <div class="section-body">${contentToHtml(s.content)}</div>
      </div>
    </section>`
    )
    .join("\n");
}

function buildFaqHtml(faq: string): string {
  if (!faq) return "";
  return `
  <section class="faq-section">
    <div class="container">
      <h2>Perguntas Frequentes</h2>
      <div class="faq-body">${contentToHtml(faq)}</div>
    </div>
  </section>`;
}

// ============================================================
// CSS PER TEMPLATE
// ============================================================

const CSS_TEMPLATES: Record<string, (primary: string) => string> = {
  "modern-dark": (primary) => `
    :root { --primary: ${primary}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #0d0f14; color: #e4e8ef; line-height: 1.7; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
    .hero { padding: 100px 0 80px; text-align: center; background: linear-gradient(180deg, #13151d 0%, #0d0f14 100%); }
    .hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: 2.8rem; font-weight: 700; background: linear-gradient(135deg, var(--primary), #c45aff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; line-height: 1.2; }
    .hero p { font-size: 1.15rem; color: #a0a8b8; max-width: 600px; margin: 0 auto; }
    .content-section { padding: 60px 0; }
    .section-alt { background: #111320; }
    h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; color: #fff; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid ${primary}33; }
    .section-body p { margin-bottom: 14px; color: #c8cdd8; }
    .section-body li { margin-bottom: 10px; padding-left: 20px; position: relative; color: #c8cdd8; list-style: none; }
    .section-body li::before { content: "▸"; position: absolute; left: 0; color: var(--primary); font-weight: bold; }
    .cta-section { padding: 80px 0; text-align: center; background: linear-gradient(180deg, #0d0f14, #13151d); }
    .cta-button { display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, var(--primary), #c45aff); color: #fff; font-weight: 700; font-size: 1.1rem; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 24px ${primary}44; transition: transform 0.2s, box-shadow 0.2s; }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 8px 32px ${primary}66; }
    .faq-section { padding: 60px 0; background: #111320; }
    .faq-section h2 { text-align: center; }
    .faq-body p { margin-bottom: 14px; color: #c8cdd8; }
    .footer { padding: 40px 0; text-align: center; color: #555; font-size: 0.85rem; border-top: 1px solid #1a1d2e; }
    @media (max-width: 640px) { .hero h1 { font-size: 1.8rem; } .hero { padding: 60px 0 40px; } }
  `,
  "clean-light": (primary) => `
    :root { --primary: ${primary}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #fafbfc; color: #1a1d2e; line-height: 1.7; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
    .hero { padding: 100px 0 80px; text-align: center; background: #fff; }
    .hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: 2.8rem; font-weight: 700; color: #111; margin-bottom: 20px; line-height: 1.2; }
    .hero p { font-size: 1.15rem; color: #666; max-width: 600px; margin: 0 auto; }
    .content-section { padding: 60px 0; }
    .section-alt-light { background: #f0f2f5; }
    h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; color: #111; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid ${primary}33; }
    .section-body p { margin-bottom: 14px; color: #444; }
    .section-body li { margin-bottom: 10px; padding-left: 20px; position: relative; color: #444; list-style: none; }
    .section-body li::before { content: "▸"; position: absolute; left: 0; color: var(--primary); font-weight: bold; }
    .cta-section { padding: 80px 0; text-align: center; background: #fff; }
    .cta-button { display: inline-block; padding: 16px 48px; background: var(--primary); color: #fff; font-weight: 700; font-size: 1.1rem; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 16px ${primary}33; transition: transform 0.2s; }
    .cta-button:hover { transform: translateY(-2px); }
    .faq-section { padding: 60px 0; background: #f0f2f5; }
    .faq-section h2 { text-align: center; }
    .faq-body p { margin-bottom: 14px; color: #444; }
    .footer { padding: 40px 0; text-align: center; color: #999; font-size: 0.85rem; border-top: 1px solid #e0e0e0; }
    @media (max-width: 640px) { .hero h1 { font-size: 1.8rem; } .hero { padding: 60px 0 40px; } }
  `,
  "premium-gradient": (primary) => `
    :root { --primary: ${primary}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #0a0a0f; color: #e4e8ef; line-height: 1.7; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
    .hero { padding: 120px 0 80px; text-align: center; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 50%, ${primary}15, transparent 60%); }
    .hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: 3rem; font-weight: 700; background: linear-gradient(135deg, #fff, ${primary}, #c45aff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px; line-height: 1.2; position: relative; }
    .hero p { font-size: 1.15rem; color: #a0a8c8; max-width: 600px; margin: 0 auto; position: relative; }
    .content-section { padding: 60px 0; }
    .section-alt { background: #0e0e18; }
    h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; background: linear-gradient(90deg, #fff, ${primary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid ${primary}22; }
    .section-body p { margin-bottom: 14px; color: #c0c4d4; }
    .section-body li { margin-bottom: 10px; padding-left: 20px; position: relative; color: #c0c4d4; list-style: none; }
    .section-body li::before { content: "✦"; position: absolute; left: 0; color: ${primary}; }
    .cta-section { padding: 80px 0; text-align: center; background: linear-gradient(135deg, #0f0c29, #302b63); }
    .cta-button { display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, ${primary}, #c45aff, ${primary}); background-size: 200% auto; color: #fff; font-weight: 700; font-size: 1.15rem; border-radius: 14px; text-decoration: none; box-shadow: 0 6px 32px ${primary}55; transition: all 0.3s; animation: shimmer 3s linear infinite; }
    @keyframes shimmer { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
    .cta-button:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 10px 40px ${primary}77; }
    .faq-section { padding: 60px 0; background: #0e0e18; }
    .faq-section h2 { text-align: center; }
    .faq-body p { margin-bottom: 14px; color: #c0c4d4; }
    .footer { padding: 40px 0; text-align: center; color: #444; font-size: 0.85rem; border-top: 1px solid #1a1a2e; }
    @media (max-width: 640px) { .hero h1 { font-size: 2rem; } .hero { padding: 80px 0 50px; } }
  `,
  minimalist: (primary) => `
    :root { --primary: ${primary}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #fff; color: #222; line-height: 1.8; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 24px; }
    .hero { padding: 120px 0 60px; text-align: left; }
    .hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: 2.4rem; font-weight: 700; color: #111; margin-bottom: 16px; line-height: 1.2; }
    .hero p { font-size: 1.1rem; color: #666; }
    .content-section { padding: 48px 0; }
    .section-alt { border-top: 1px solid #eee; }
    h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; color: #111; margin-bottom: 16px; font-weight: 600; }
    .section-body p { margin-bottom: 12px; color: #444; }
    .section-body li { margin-bottom: 8px; padding-left: 16px; position: relative; color: #444; list-style: none; }
    .section-body li::before { content: "—"; position: absolute; left: 0; color: ${primary}; }
    .cta-section { padding: 80px 0; text-align: center; }
    .cta-button { display: inline-block; padding: 14px 40px; background: #111; color: #fff; font-weight: 600; font-size: 1rem; border-radius: 8px; text-decoration: none; transition: background 0.2s; }
    .cta-button:hover { background: ${primary}; }
    .faq-section { padding: 48px 0; border-top: 1px solid #eee; }
    .faq-body p { margin-bottom: 12px; color: #444; }
    .footer { padding: 40px 0; text-align: center; color: #bbb; font-size: 0.85rem; }
    @media (max-width: 640px) { .hero h1 { font-size: 1.8rem; } .hero { padding: 60px 0 40px; } }
  `,
};

function buildFullHtml(
  parsed: ParsedSections,
  templateKey: string,
  branding: { title?: string; logoUrl?: string; primaryColor?: string }
): string {
  const primary = branding.primaryColor || "#7c3aed";
  const title = sanitize(branding.title || parsed.heroHeadline || "Landing Page");
  const cssGen = CSS_TEMPLATES[templateKey] || CSS_TEMPLATES["modern-dark"];
  const css = cssGen(primary);
  const sectionsHtml = buildSectionsHtml(parsed.sections, templateKey);
  const faqHtml = buildFaqHtml(parsed.faq);
  const logoHtml = branding.logoUrl
    ? `<img src="${sanitize(branding.logoUrl)}" alt="Logo" style="height:40px;margin-bottom:24px;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="${sanitize(parsed.heroSubhead || title)}"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>${css}</style>
</head>
<body>
  <header class="hero">
    <div class="container">
      ${logoHtml}
      <h1>${sanitize(parsed.heroHeadline)}</h1>
      <p>${sanitize(parsed.heroSubhead)}</p>
    </div>
  </header>

  ${sectionsHtml}

  ${faqHtml}

  <section class="cta-section">
    <div class="container">
      <a href="#" class="cta-button">${sanitize(parsed.cta)}</a>
    </div>
  </section>

  <footer class="footer">
    <div class="container">${sanitize(parsed.footer)}</div>
  </footer>
</body>
</html>`;
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
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
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Parse body
    const body = await req.json();
    const {
      projectId,
      templateKey = "modern-dark",
      options = {},
    } = body as {
      projectId: string;
      templateKey?: string;
      options?: {
        includeUpsells?: boolean;
        branding?: {
          title?: string;
          logoUrl?: string;
          primaryColor?: string;
        };
      };
    };

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Load project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract copy
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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let fullCopy = salesCopy;
    if (options.includeUpsells) {
      const upsellCopy = copyResults.pagina_upsell || "";
      if (upsellCopy) {
        fullCopy += "\n\n" + upsellCopy;
      }
    }

    // Parse and build
    const parsed = parseCopy(fullCopy);
    const html = buildFullHtml(parsed, templateKey, options.branding || {});

    // Save to DB
    const { data: saved, error: saveError } = await supabase
      .from("site_generations")
      .insert({
        user_id: userId,
        project_id: projectId,
        template_key: templateKey,
        status: "generated",
        generated_html: html,
        generated_assets: {},
        language_code: project.language_code || "pt-BR",
        cultural_region: project.cultural_region,
        branding: options.branding || {},
        include_upsells: options.includeUpsells || false,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
    }

    return new Response(
      JSON.stringify({
        html,
        assets: {},
        meta: {
          templateKey,
          projectId,
          generationId: saved?.id || null,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("generate-site error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
