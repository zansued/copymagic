import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// SANITISATION
// ============================================================
function sanitize(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "");
}

// ============================================================
// COPY PARSER — intelligent section detection
// ============================================================
interface ParsedSections {
  heroHeadline: string;
  heroSubhead: string;
  heroBullets: string[];
  sections: { title: string; content: string; type: string }[];
  cta: string;
  faq: { q: string; a: string }[];
  guarantee: string;
  offer: string;
  testimonials: string[];
  footer: string;
}

function classifySection(title: string): string {
  const t = title.toLowerCase();
  if (/hero|headline|impactante|chamada|aten[cç]/i.test(t)) return "hero";
  if (/faq|perguntas|d[úu]vidas|questions/i.test(t)) return "faq";
  if (/cta|a[cç][aã]o|bot[aã]o|button|comprar|começar/i.test(t)) return "cta";
  if (/garantia|guarantee|risco|refund/i.test(t)) return "guarantee";
  if (/oferta|offer|pre[cç]o|pricing|investimento|valor/i.test(t)) return "offer";
  if (/prova|social|depoimento|testimonial|resultado/i.test(t)) return "testimonial";
  if (/benef[ií]cio|vantage|feature|recurso|inclui|incluso/i.test(t)) return "benefits";
  if (/b[oô]nus|bonus|extra|brinde/i.test(t)) return "bonus";
  if (/urg[eê]ncia|escassez|scarcity|limit/i.test(t)) return "urgency";
  if (/mecanismo|mechanism|como funciona|how it works/i.test(t)) return "mechanism";
  if (/hist[oó]ria|story|jornada|journey/i.test(t)) return "story";
  if (/compar/i.test(t)) return "comparison";
  return "content";
}

function parseFaq(content: string): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = [];
  const lines = content.split("\n").filter((l) => l.trim());
  let currentQ = "";
  let currentA: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (/^[\d]+[.)]\s|^\*\*.*\?\*\*|^#{1,4}\s|.*\?$/.test(t)) {
      if (currentQ) faqs.push({ q: currentQ, a: currentA.join(" ") });
      currentQ = t.replace(/^[\d]+[.)]\s*/, "").replace(/^\*\*|\*\*$/g, "").replace(/^#{1,4}\s*/, "");
      currentA = [];
    } else if (currentQ) {
      currentA.push(t);
    }
  }
  if (currentQ) faqs.push({ q: currentQ, a: currentA.join(" ") });
  return faqs;
}

function parseCopy(rawCopy: string): ParsedSections {
  const lines = rawCopy.split("\n").filter((l) => l.trim());
  const result: ParsedSections = {
    heroHeadline: "",
    heroSubhead: "",
    heroBullets: [],
    sections: [],
    cta: "",
    faq: [],
    guarantee: "",
    offer: "",
    testimonials: [],
    footer: "",
  };

  let currentSection: { title: string; content: string[] } | null = null;
  const allSections: { title: string; content: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const sectionMatch = trimmed.match(
      /^\[([^\]]+)\]$|^#{1,3}\s+(.+)$|^([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s\-–—:]{5,})$/
    );

    if (sectionMatch) {
      if (currentSection) {
        allSections.push({ title: currentSection.title, content: currentSection.content.join("\n") });
      }
      currentSection = {
        title: (sectionMatch[1] || sectionMatch[2] || sectionMatch[3]).trim(),
        content: [],
      };
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    } else {
      if (!result.heroHeadline) result.heroHeadline = trimmed;
      else if (!result.heroSubhead) result.heroSubhead = trimmed;
      else {
        // Detect bullets
        if (/^[•\-✅▸✓→]/.test(trimmed)) {
          result.heroBullets.push(trimmed.replace(/^[•\-✅▸✓→]\s*/, ""));
        } else {
          currentSection = { title: "Introdução", content: [trimmed] };
        }
      }
    }
  }
  if (currentSection) {
    allSections.push({ title: currentSection.title, content: currentSection.content.join("\n") });
  }

  // Classify
  for (const s of allSections) {
    const type = classifySection(s.title);
    if (type === "hero") {
      const sLines = s.content.split("\n");
      if (!result.heroHeadline) result.heroHeadline = sLines[0] || s.title;
      if (!result.heroSubhead) result.heroSubhead = sLines.slice(1, 3).join(" ");
    } else if (type === "faq") {
      result.faq = parseFaq(s.content);
    } else if (type === "cta") {
      result.cta = s.content.split("\n")[0] || s.title;
    } else if (type === "guarantee") {
      result.guarantee = s.content;
    } else if (type === "offer") {
      result.offer = s.content;
    } else if (type === "testimonial") {
      result.testimonials = s.content.split("\n").filter((l) => l.trim().length > 20);
    } else {
      result.sections.push({ title: s.title, content: s.content, type });
    }
  }

  // Defaults
  if (!result.heroHeadline && allSections.length > 0) {
    result.heroHeadline = allSections[0].title;
    result.heroSubhead = allSections[0].content.split("\n")[0] || "";
  }
  if (!result.heroHeadline) result.heroHeadline = "Transforme sua vida hoje";
  if (!result.cta) result.cta = "Quero Começar Agora";
  if (!result.footer) result.footer = `© ${new Date().getFullYear()}`;

  return result;
}

// ============================================================
// CONTENT HELPERS
// ============================================================
function contentToHtml(content: string): string {
  const lines = content.split("\n");
  let inList = false;
  const parts: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^[•\-✅▸✓→]/.test(t)) {
      if (!inList) { parts.push("<ul>"); inList = true; }
      parts.push(`<li>${sanitize(t.replace(/^[•\-✅▸✓→]\s*/, ""))}</li>`);
    } else {
      if (inList) { parts.push("</ul>"); inList = false; }
      parts.push(`<p>${sanitize(t)}</p>`);
    }
  }
  if (inList) parts.push("</ul>");
  return parts.join("\n");
}

function buildFaqHtml(faqs: { q: string; a: string }[], colors: TemplateColors): string {
  if (faqs.length === 0) return "";
  const items = faqs
    .map((f) => `
      <details class="faq-item">
        <summary>${sanitize(f.q)}</summary>
        <p>${sanitize(f.a)}</p>
      </details>`)
    .join("\n");
  return `
  <section class="faq-section" id="faq">
    <div class="container">
      <h2>Perguntas Frequentes</h2>
      <div class="faq-grid">${items}</div>
    </div>
  </section>`;
}

function buildGuaranteeHtml(guarantee: string): string {
  if (!guarantee) return "";
  return `
  <section class="guarantee-section">
    <div class="container">
      <div class="guarantee-card">
        <div class="guarantee-icon">🛡️</div>
        <h2>Garantia Total</h2>
        <div class="guarantee-body">${contentToHtml(guarantee)}</div>
      </div>
    </div>
  </section>`;
}

function buildOfferHtml(offer: string, cta: string): string {
  if (!offer) return "";
  return `
  <section class="offer-section">
    <div class="container">
      <div class="offer-card">
        <h2>Oferta Especial</h2>
        <div class="offer-body">${contentToHtml(offer)}</div>
        <a href="#" class="cta-button">${sanitize(cta)}</a>
      </div>
    </div>
  </section>`;
}

function buildTestimonialsHtml(testimonials: string[]): string {
  if (testimonials.length === 0) return "";
  const items = testimonials.slice(0, 6).map((t) => `
    <div class="testimonial-card">
      <p>"${sanitize(t)}"</p>
    </div>`).join("\n");
  return `
  <section class="testimonials-section">
    <div class="container">
      <h2>O Que Dizem Nossos Clientes</h2>
      <div class="testimonials-grid">${items}</div>
    </div>
  </section>`;
}

// ============================================================
// TEMPLATE SYSTEM
// ============================================================
interface TemplateColors {
  bg: string; bgAlt: string; text: string; textMuted: string;
  heading: string; primary: string; primaryHover: string;
  cardBg: string; cardBorder: string; heroBg: string;
}

const TEMPLATE_COLORS: Record<string, (p: string) => TemplateColors> = {
  "saas-premium": (p) => ({
    bg: "#0b0d12", bgAlt: "#10131a", text: "#d4d8e4", textMuted: "#8890a4",
    heading: "#ffffff", primary: p, primaryHover: p + "cc",
    cardBg: "#12151e", cardBorder: "#1e2234", heroBg: "linear-gradient(160deg, #0b0d12 0%, #141728 50%, #0b0d12 100%)",
  }),
  "vsl-page": (p) => ({
    bg: "#0a0a0f", bgAlt: "#0e0e16", text: "#ccc", textMuted: "#777",
    heading: "#fff", primary: p, primaryHover: p + "dd",
    cardBg: "#111118", cardBorder: "#222", heroBg: "linear-gradient(180deg, #0a0a0f 0%, #12121f 100%)",
  }),
  "longform-dr": (p) => ({
    bg: "#fafaf8", bgAlt: "#f0efe8", text: "#2a2a2a", textMuted: "#6b6b6b",
    heading: "#111", primary: p, primaryHover: p + "dd",
    cardBg: "#fff", cardBorder: "#e0ddd4", heroBg: "#fafaf8",
  }),
  "upsell-focus": (p) => ({
    bg: "#0d0f14", bgAlt: "#111422", text: "#d0d4e0", textMuted: "#7a7f92",
    heading: "#fff", primary: p, primaryHover: p + "cc",
    cardBg: "#13162088", cardBorder: "#1e2136", heroBg: "linear-gradient(135deg, #0d0f14, #1a1040, #0d0f14)",
  }),
};

function buildCSS(templateKey: string, primary: string): string {
  const cf = TEMPLATE_COLORS[templateKey] || TEMPLATE_COLORS["saas-premium"];
  const c = cf(primary);
  const isDark = templateKey !== "longform-dr";

  return `
    :root { --primary: ${primary}; --primary-rgb: ${hexToRgb(primary)}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: ${c.bg}; color: ${c.text}; line-height: 1.75; -webkit-font-smoothing: antialiased; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }

    /* HERO */
    .hero { padding: 100px 0 80px; text-align: center; background: ${c.heroBg}; position: relative; overflow: hidden; }
    ${isDark ? `.hero::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(var(--primary-rgb),0.12), transparent 70%); pointer-events: none; }` : ""}
    .hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 700; color: ${c.heading}; margin-bottom: 20px; line-height: 1.15; position: relative; max-width: 800px; margin-left: auto; margin-right: auto; }
    ${isDark ? `.hero h1 { background: linear-gradient(135deg, #fff, ${primary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }` : ""}
    .hero .subhead { font-size: 1.15rem; color: ${c.textMuted}; max-width: 640px; margin: 0 auto 32px; position: relative; }
    .hero .hero-bullets { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 24px; margin-bottom: 36px; position: relative; }
    .hero .hero-bullets span { display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: ${c.text}; }
    .hero .hero-bullets span::before { content: "✓"; color: ${primary}; font-weight: 700; }

    /* CTA BUTTON */
    .cta-button { display: inline-block; padding: 16px 48px; background: ${primary}; color: #fff; font-weight: 700; font-size: 1.05rem; border-radius: 12px; text-decoration: none; transition: all 0.25s; box-shadow: 0 4px 20px rgba(var(--primary-rgb),0.35); }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(var(--primary-rgb),0.5); }
    .cta-mid { padding: 60px 0; text-align: center; background: ${c.bgAlt}; }

    /* SECTIONS */
    .content-section { padding: 64px 0; }
    .content-section.alt { background: ${c.bgAlt}; }
    h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; color: ${c.heading}; margin-bottom: 24px; font-weight: 600; }
    .section-body p { margin-bottom: 14px; }
    .section-body ul { padding: 0; list-style: none; margin: 16px 0; }
    .section-body li { padding: 8px 0 8px 24px; position: relative; }
    .section-body li::before { content: "▸"; position: absolute; left: 0; color: ${primary}; font-weight: 700; }

    /* CARDS GRID (for benefits/features) */
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 24px; }
    .feature-card { background: ${c.cardBg}; border: 1px solid ${c.cardBorder}; border-radius: 16px; padding: 28px; }
    .feature-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; color: ${c.heading}; margin-bottom: 8px; }
    .feature-card p { font-size: 0.95rem; color: ${c.textMuted}; }

    /* FAQ */
    .faq-section { padding: 64px 0; background: ${c.bgAlt}; }
    .faq-section h2 { text-align: center; margin-bottom: 32px; }
    .faq-grid { max-width: 720px; margin: 0 auto; }
    .faq-item { border-bottom: 1px solid ${c.cardBorder}; }
    .faq-item summary { padding: 18px 0; font-weight: 600; cursor: pointer; color: ${c.heading}; list-style: none; display: flex; justify-content: space-between; align-items: center; }
    .faq-item summary::after { content: "+"; font-size: 1.4rem; color: ${primary}; transition: transform 0.2s; }
    .faq-item[open] summary::after { transform: rotate(45deg); }
    .faq-item p { padding: 0 0 18px; color: ${c.textMuted}; }

    /* GUARANTEE */
    .guarantee-section { padding: 64px 0; }
    .guarantee-card { max-width: 640px; margin: 0 auto; text-align: center; background: ${c.cardBg}; border: 1px solid ${c.cardBorder}; border-radius: 20px; padding: 48px 32px; }
    .guarantee-icon { font-size: 3rem; margin-bottom: 16px; }
    .guarantee-card h2 { margin-bottom: 16px; }

    /* OFFER */
    .offer-section { padding: 80px 0; background: ${c.bgAlt}; }
    .offer-card { max-width: 640px; margin: 0 auto; text-align: center; background: ${c.cardBg}; border: 2px solid ${primary}33; border-radius: 20px; padding: 48px 32px; }
    .offer-card h2 { color: ${primary}; margin-bottom: 20px; }
    .offer-card .cta-button { margin-top: 28px; }

    /* TESTIMONIALS */
    .testimonials-section { padding: 64px 0; }
    .testimonials-section h2 { text-align: center; margin-bottom: 32px; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .testimonial-card { background: ${c.cardBg}; border: 1px solid ${c.cardBorder}; border-radius: 16px; padding: 24px; font-style: italic; color: ${c.textMuted}; font-size: 0.95rem; }

    /* COMPARISON (upsell) */
    .comparison-section { padding: 64px 0; }
    .comparison-section h2 { text-align: center; }

    /* CTA FINAL */
    .cta-section { padding: 80px 0; text-align: center; background: ${c.bgAlt}; }
    .cta-section h2 { margin-bottom: 12px; }
    .cta-section p { color: ${c.textMuted}; margin-bottom: 32px; }

    /* STICKY MOBILE CTA */
    .sticky-cta { display: none; position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: ${isDark ? "rgba(11,13,18,0.95)" : "rgba(255,255,255,0.95)"}; backdrop-filter: blur(12px); border-top: 1px solid ${c.cardBorder}; z-index: 100; text-align: center; }
    .sticky-cta .cta-button { width: 100%; padding: 14px; font-size: 1rem; }

    /* FOOTER */
    .footer { padding: 40px 0; text-align: center; color: ${c.textMuted}; font-size: 0.85rem; border-top: 1px solid ${c.cardBorder}; }

    @media (max-width: 768px) {
      .hero { padding: 64px 0 48px; }
      .hero h1 { font-size: 1.8rem; }
      .sticky-cta { display: block; }
      body { padding-bottom: 72px; }
      .cards-grid { grid-template-columns: 1fr; }
    }
  `;
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

// ============================================================
// BUILD FULL HTML
// ============================================================
function buildFullHtml(
  parsed: ParsedSections,
  templateKey: string,
  branding: { title?: string; logoUrl?: string; primaryColor?: string },
  lang: string
): string {
  const primary = branding.primaryColor || "#7c3aed";
  const title = sanitize(branding.title || parsed.heroHeadline || "Landing Page");
  const css = buildCSS(templateKey, primary);

  const logoHtml = branding.logoUrl
    ? `<img src="${sanitize(branding.logoUrl)}" alt="Logo" style="height:36px;margin-bottom:24px;" loading="lazy" />`
    : "";

  const bulletsHtml = parsed.heroBullets.length > 0
    ? `<div class="hero-bullets">${parsed.heroBullets.map((b) => `<span>${sanitize(b)}</span>`).join("")}</div>`
    : "";

  // Build sections HTML with alternating backgrounds
  const sectionsHtml = parsed.sections.map((s, i) => {
    if (s.type === "benefits") {
      // Render as card grid
      const bullets = s.content.split("\n").filter((l) => /^[•\-✅▸✓→]/.test(l.trim()));
      if (bullets.length >= 3) {
        const cards = bullets.map((b) => {
          const text = b.trim().replace(/^[•\-✅▸✓→]\s*/, "");
          const parts = text.split(/[:\-–—]\s*/);
          return `<div class="feature-card"><h3>${sanitize(parts[0])}</h3>${parts[1] ? `<p>${sanitize(parts[1])}</p>` : ""}</div>`;
        }).join("\n");
        return `<section class="content-section ${i % 2 !== 0 ? "alt" : ""}"><div class="container"><h2>${sanitize(s.title)}</h2><div class="cards-grid">${cards}</div></div></section>`;
      }
    }
    return `<section class="content-section ${i % 2 !== 0 ? "alt" : ""}"><div class="container"><h2>${sanitize(s.title)}</h2><div class="section-body">${contentToHtml(s.content)}</div></div></section>`;
  }).join("\n");

  // Mid CTA after ~40% of sections
  const midPoint = Math.max(1, Math.floor(parsed.sections.length * 0.4));
  const sectionsArray = sectionsHtml.split("</section>");
  if (sectionsArray.length > 2) {
    sectionsArray.splice(midPoint, 0, `<section class="cta-mid"><div class="container"><a href="#" class="cta-button">${sanitize(parsed.cta)}</a></div></section>`);
  }
  const finalSectionsHtml = sectionsArray.join("</section>");

  const cf = TEMPLATE_COLORS[templateKey] || TEMPLATE_COLORS["saas-premium"];
  const c = cf(primary);
  const faqHtml = buildFaqHtml(parsed.faq, c);
  const guaranteeHtml = buildGuaranteeHtml(parsed.guarantee);
  const offerHtml = buildOfferHtml(parsed.offer, parsed.cta);
  const testimonialsHtml = buildTestimonialsHtml(parsed.testimonials);

  return `<!DOCTYPE html>
<html lang="${lang || "pt-BR"}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="${sanitize(parsed.heroSubhead || title).slice(0, 160)}"/>
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
      <p class="subhead">${sanitize(parsed.heroSubhead)}</p>
      ${bulletsHtml}
      <a href="#" class="cta-button">${sanitize(parsed.cta)}</a>
    </div>
  </header>

  ${finalSectionsHtml}

  ${testimonialsHtml}
  ${guaranteeHtml}
  ${offerHtml}
  ${faqHtml}

  <section class="cta-section">
    <div class="container">
      <h2>${sanitize(parsed.heroHeadline)}</h2>
      <p>${sanitize(parsed.heroSubhead)}</p>
      <a href="#" class="cta-button">${sanitize(parsed.cta)}</a>
    </div>
  </section>

  <footer class="footer">
    <div class="container">${sanitize(parsed.footer)}</div>
  </footer>

  <div class="sticky-cta">
    <a href="#" class="cta-button">${sanitize(parsed.cta)}</a>
  </div>
</body>
</html>`;
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects").select("*").eq("id", projectId).single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const copyResults = typeof project.copy_results === "string"
      ? JSON.parse(project.copy_results) : project.copy_results || {};

    const salesCopy = copyResults.pagina_vendas || "";
    if (!salesCopy) {
      return new Response(JSON.stringify({
        error: "Este projeto não possui copy da Página de Vendas gerada. Gere a etapa 'Página de Vendas' primeiro.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let fullCopy = salesCopy;
    if (options.includeUpsells) {
      const upsellCopy = copyResults.pagina_upsell || "";
      if (upsellCopy) fullCopy += "\n\n" + upsellCopy;
    }

    const lang = options.language || project.language_code || "pt-BR";
    const parsed = parseCopy(fullCopy);
    const html = buildFullHtml(parsed, templateKey, options.branding || {}, lang);

    // Save
    const { data: saved, error: saveError } = await supabase
      .from("site_generations")
      .insert({
        user_id: userId,
        project_id: projectId,
        template_key: templateKey,
        status: "generated",
        generated_html: html,
        generated_assets: {},
        language_code: lang,
        cultural_region: project.cultural_region,
        branding: options.branding || {},
        include_upsells: options.includeUpsells || false,
      })
      .select().single();

    if (saveError) console.error("Save error:", saveError);

    return new Response(JSON.stringify({
      html,
      assets: {},
      meta: { templateKey, projectId, generationId: saved?.id || null },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("generate-site error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
