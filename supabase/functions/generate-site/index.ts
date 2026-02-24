import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// PAGESPEC SYSTEM PROMPT — Step 1: Extract structured copy
// ============================================================
const PAGESPEC_SYSTEM_PROMPT = `ROLE
You are a senior conversion copywriter and content architect.
Your job: extract and structure the provided sales copy into a rich PageSpec JSON.

═══════════════════════════════════════
⚠️ FIDELITY MODE (NON-NEGOTIABLE)
═══════════════════════════════════════
You are NOT a copywriter here. You are a CONTENT EXTRACTOR.
- PRESERVE copy VERBATIM whenever possible. Use exact sentences, paragraphs, bullets from the source.
- Do NOT paraphrase, summarize, or rewrite user-provided sales copy.
- Do NOT invent numbers, statistics, results, testimonials, or brand names.
- If information is missing for a section, use honest placeholders: [INSERIR HEADLINE AQUI], [INSERIR DEPOIMENTO], etc.
- Only write microcopy (button labels, small UI text) when no copy exists for it.
- Strip internal labels ("SEÇÃO:", "BLOCO:", "HEADLINE:", "INÍCIO", "FIM", "{...}", "(insira...)", "TODO") but keep ALL actual content text.

OUTPUT FORMAT (ONLY valid JSON, no markdown fences):
{
  "meta": {
    "language": "pt-BR",
    "detectedNiche": "keyword for niche"
  },
  "hero": {
    "headline": "exact headline from copy",
    "subheadline": "exact subheadline",
    "bullets": ["exact bullet 1", "exact bullet 2", "exact bullet 3", "exact bullet 4", "exact bullet 5"],
    "ctaPrimary": "CTA text",
    "ctaSecondary": "secondary CTA or empty",
    "microcopy": "under-CTA microcopy",
    "trustItems": ["trust chip 1", "trust chip 2", "trust chip 3"]
  },
  "proof": {
    "stats": [{"value": "number or text", "label": "description"}],
    "logos": ["logo/brand name if mentioned"]
  },
  "problem": {
    "title": "section title",
    "items": [{"title": "problem", "description": "full description - ALL paragraphs", "falseSolution": "what people try", "truth": "the real insight"}]
  },
  "solution": {
    "title": "section title",
    "description": "full mechanism explanation - ALL paragraphs",
    "steps": [{"title": "step title", "description": "full detail"}],
    "differentiators": [{"title": "diff", "description": "full detail"}]
  },
  "phases": [
    {"title": "phase name", "description": "full description with ALL details", "outcome": "expected result"}
  ],
  "testimonials": [
    {"name": "person name or [NOME]", "role": "context", "text": "FULL testimonial - do NOT truncate"}
  ],
  "offer": {
    "title": "offer title",
    "includes": ["full item description 1", "full item 2"],
    "price": "price if mentioned",
    "originalPrice": "original price if mentioned",
    "urgency": "urgency text if present"
  },
  "bonuses": [
    {"title": "bonus name", "description": "full description", "value": "R$ X if mentioned"}
  ],
  "forWho": {
    "for": ["full description of ideal person 1", "person 2", "person 3", "person 4", "person 5"],
    "notFor": ["not for person 1", "not for 2", "not for 3", "not for 4", "not for 5"]
  },
  "guarantee": {
    "title": "guarantee title",
    "days": 30,
    "description": "FULL guarantee text - all paragraphs",
    "bullets": ["bullet 1", "bullet 2"]
  },
  "faq": [
    {"question": "full question", "answer": "FULL answer - do NOT truncate"}
  ],
  "finalCta": {
    "headline": "full headline",
    "description": "full description text",
    "ctaText": "CTA text"
  },
  "footer": {
    "disclaimers": ["disclaimer text"],
    "links": ["Terms", "Privacy", "Contact"]
  }
}

VALIDATION RULES:
- hero.bullets: minimum 3 items
- problem.items: minimum 3 items
- testimonials: minimum 3 items (use [NOME] placeholders if none in copy)
- bonuses: minimum 3 items (extract from copy or use [INSERIR BÔNUS] placeholders)
- forWho.for: minimum 5 items
- forWho.notFor: minimum 5 items
- faq: minimum 8 items, maximum 12 (cover: price, time, for whom, support, risk, refund, results, how it works)
- If the copy doesn't have enough FAQ items, generate realistic objection-based Q&As in the same language, but mark invented ones with [GERADO] prefix in the answer.

IMPORTANT: Every text field must contain the COMPLETE original text from the copy.
If a section has multiple paragraphs, include ALL of them joined with newlines.
Do NOT reduce rich copy to skeleton summaries.`;

// ============================================================
// HTML RENDER PROMPT — Step 2: Render PageSpec into single HTML
// ============================================================
const HTML_RENDER_PROMPT = `ROLE
You are "Premium Landing Page Builder", a senior art director + conversion-focused designer.
Goal: render a structured PageSpec JSON into a visually premium, conversion-optimized single-file HTML landing page.

═══════════════════════════════════════
⚠️ FIDELITY MODE (NON-NEGOTIABLE)
═══════════════════════════════════════
- Use ALL text from the PageSpec EXACTLY as provided. Every paragraph, bullet, testimonial must appear.
- Do NOT rewrite, paraphrase, or summarize ANY content from the PageSpec.
- Only write microcopy (button labels, small connector text between sections) when the PageSpec doesn't provide it.
- If PageSpec has placeholder markers like [INSERIR...], keep them visible so the user knows to fill them.

OUTPUT (STRICT)
Return ONLY valid JSON:
{
  "html": "<!doctype html>...</html>",
  "sections": ["hero","trust-strip","problems","solution","phases","social-proof","bonuses","offer","for-who","faq","guarantee","final-cta","footer"]
}

CONSTRAINTS (NON-NEGOTIABLE)
1) Single HTML file.
2) Tailwind-only for styling:
   - Include Tailwind via CDN: <script src="https://cdn.tailwindcss.com"></script>
   - NO inline style="" anywhere in the body.
   - ONE small <style> block for CSS variables + keyframes + Google Fonts import ONLY.
3) Include Lucide icons CDN + init:
   <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
   Then: <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
   Init: <script>lucide.createIcons();</script>
4) Every major section MUST have data-section attribute.
5) Accessibility: every <img> has descriptive alt, focus states on buttons.

DESIGN KIT (FOLLOW EXACTLY)

A) BASE TOKENS (put in the single <style> block)
Define :root CSS vars based on brand.style:
For dark-premium:
  --primary: {brand.primaryColor}
  --primary-glow: lighter tint of primary
  --bg-deep: #050508
  --bg-section: #0a0a12
  --bg-card: rgba(255,255,255,0.03)
  --border: rgba(255,255,255,0.10)
  --text-primary: #f0f0f5
  --text-secondary: #a0a0b2
  --text-muted: #6a6a7a
For light-premium:
  --primary: {brand.primaryColor}
  --primary-glow: lighter tint
  --bg-deep: #f3f4f6
  --bg-section: #ffffff
  --bg-card: #ffffff
  --border: rgba(0,0,0,0.10)
  --text-primary: #101018
  --text-secondary: #34343f
  --text-muted: #6b7280

Tailwind config customization script for these colors.

B) TYPOGRAPHY
- Google Fonts: Inter (body) + Outfit (headings)
- Hero headline: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight
- Section title: text-3xl sm:text-4xl font-bold tracking-tight
- Body: text-base sm:text-lg leading-relaxed

C) LAYOUT RHYTHM (NO EXCEPTIONS)
- Container: max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
- Sections: py-16 sm:py-20
- Cards: rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8
- Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8

D) BUTTONS
- Primary CTA: rounded-full px-8 py-4 sm:px-10 sm:py-5 bg-[var(--primary)] text-white font-semibold uppercase tracking-wide hover:scale-105 hover:shadow-lg transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
- CTA must appear in: hero, after solution, after bonuses, offer section, final-cta = minimum 5 CTAs

E) NAVBAR (REQUIRED)
- Fixed top, backdrop blur, desktop links to anchors, mobile drawer menu, right side CTA button.

IMAGES
- If pre_fetched_images exist, use ONLY those exact URLs.
- Otherwise use picsum.photos/seed/{keyword}/{w}/{h} and i.pravatar.cc for portraits.
- All images: object-cover, rounded-xl/2xl, loading="lazy" (except hero).

REQUIRED SECTIONS (IN THIS EXACT ORDER)
1) HERO (data-section="hero") — background image + overlay, badge pill, headline, subhead, bullets, CTA row, trust chips
2) TRUST STRIP (data-section="trust-strip") — stat blocks with data-count from proof.stats
3) PROBLEMS (data-section="problems") — card grid from problem.items with falseSolution + truth
4) SOLUTION / MECHANISM (data-section="solution") — split layout: text + image, steps from solution.steps
5) PHASES (data-section="phases") — visual timeline from phases array (if exists, otherwise skip)
6) SOCIAL PROOF (data-section="social-proof") — testimonial cards from testimonials array
7) BONUSES (data-section="bonuses") — gradient cards from bonuses array with value badges + CTA
8) OFFER + PRICING (data-section="offer") — value stack from offer.includes, price block + CTA
9) FOR WHO / NOT FOR WHO (data-section="for-who") — side-by-side grid: green cards with check-circle for forWho.for, red cards with x-circle for forWho.notFor
10) FAQ (data-section="faq") — accordion from faq array, 8-12 items
11) GUARANTEE (data-section="guarantee") — shield icon + guarantee text + bullets
12) FINAL CTA (data-section="final-cta") — recap + CTA
13) FOOTER (data-section="footer") — disclaimers + links

PREMIUM VISUAL PATTERNS (APPLY)
- Gradient text on hero + 1-2 section titles: bg-gradient-to-r from-[var(--primary)] to-[var(--primary-glow)] bg-clip-text text-transparent
- Blob animations in hero: 2-3 decorative absolute blobs with blur-xl, opacity-20, animate-blob
- Section intro decorator: icon pill + small caps label + heading + subtitle on every section
- Categorized card colors on problem/bonus cards: bg-purple-50/5, bg-blue-50/5, bg-green-50/5, etc.

INTERACTIONS (4 ONLY)
1) Scroll reveal: IntersectionObserver toggling opacity-0/100 and translate-y
2) Animated counters for data-count elements
3) FAQ accordion (one open at a time, chevron rotate)
4) Sticky CTA bar after hero

CHECKLIST (WHAT MAKES A GREAT SALES PAGE)
- Hero clarity in 5 seconds (headline + bullets + CTA)
- CTA present in hero AND repeated every 1-2 sections
- Proof without inventing numbers
- Explicit offer + bonuses + guarantee
- For who / not for who section
- FAQ with real objections
- No fake scarcity; ethical urgency only

POLISH PASS (MANDATORY)
Before returning, self-review: spacing py-16/20, card padding p-6/8, contrast, focus states, alt tags, zero inline styles.

Now render the PageSpec into a premium page.`;

// ============================================================
// EDIT SECTION PROMPT
// ============================================================
const EDIT_SECTION_PROMPT = `You are an elite web designer at a $500/hr agency.
You will receive:
1) The current PageSpec JSON (full structured data)
2) The section key to edit (e.g. "hero", "offer", "faq")
3) An instruction describing what to change

Your job: modify ONLY the specified section's data in the PageSpec according to the instruction.

FIDELITY RULES:
- PRESERVE all existing content in OTHER sections — return them unchanged.
- For the target section: apply the user's instruction.
- If the instruction says to add content, ADD it. Never remove existing content unless explicitly asked.
- Write in the SAME language as the existing PageSpec content.
- Do NOT invent numbers, testimonials, or brand names unless the user asks for example content.

OUTPUT FORMAT (ONLY valid JSON, no markdown fences):
Return the COMPLETE updated PageSpec JSON with the modified section.`;

// ============================================================
// REVIEW/POLISH PROMPT
// ============================================================
const REVIEW_SYSTEM_PROMPT = `You are a SENIOR ART DIRECTOR performing a SURGICAL POLISH pass on an existing landing page.

⛔ ABSOLUTE RULES:
1. PRESERVE the ENTIRE <head> block character-for-character
2. PRESERVE ALL text content — zero changes to copy
3. PRESERVE ALL image URLs exactly
4. PRESERVE data-section attributes
5. PRESERVE ALL JavaScript at the bottom
6. PRESERVE page structure — same sections, same order

🎯 YOU ONLY FIX Tailwind utility classes:
A) CONTRAST: weak text → stronger color classes
B) SPACING: missing py-16/20 on sections, missing p-6/8 on cards
C) HOVER: missing hover effects on cards/buttons
D) RESPONSIVE: fixed sizes → responsive (text-xl → text-xl sm:text-2xl)
E) FOCUS: missing focus:ring on interactive elements
F) IMAGES: missing alt, loading="lazy"

OUTPUT (ONLY valid JSON):
{
  "html": "<!doctype html>...</html>",
  "fixes": ["fix 1 description", "fix 2"]
}`;

// ============================================================
// UNSPLASH & IMAGE HELPERS
// ============================================================
interface UnsplashPhoto {
  id: string;
  urls: { raw: string; full: string; regular: string; small: string; thumb: string };
  user: { name: string; links: { html: string } };
  alt_description: string | null;
}

interface FetchedImageSet {
  hero: string[];
  portraits: string[];
  features: string[];
  results: string[];
  trust: string[];
  guarantee: string[];
  bonus: string[];
}

async function fetchUnsplashImages(nicheKeywords: string[]): Promise<FetchedImageSet> {
  const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!accessKey) {
    console.warn("UNSPLASH_ACCESS_KEY not set, using fallback");
    return buildFallbackImageSet();
  }

  const imageSet: FetchedImageSet = {
    hero: [], portraits: [], features: [], results: [],
    trust: [], guarantee: [], bonus: [],
  };

  const nicheQuery = nicheKeywords.slice(0, 3).join(" ");
  try {
    const [nicheRes, portraitRes] = await Promise.all([
      fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(nicheQuery)}&per_page=15&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      ),
      fetch(
        `https://api.unsplash.com/search/photos?query=portrait+person+professional&per_page=6&orientation=squarish&content_filter=high`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      ),
    ]);

    if (nicheRes.ok) {
      const nicheData = await nicheRes.json();
      const photos = (nicheData.results || []) as UnsplashPhoto[];
      const toUrl = (p: UnsplashPhoto, w: number, h: number) =>
        `${p.urls.raw}&w=${w}&h=${h}&fit=crop&auto=format,compress&q=80`;
      imageSet.hero = photos.slice(0, 3).map(p => toUrl(p, 1920, 1080));
      imageSet.features = photos.slice(3, 7).map(p => toUrl(p, 800, 600));
      imageSet.results = photos.slice(7, 10).map(p => toUrl(p, 800, 600));
      imageSet.trust = photos.slice(10, 12).map(p => toUrl(p, 800, 400));
      imageSet.guarantee = photos.slice(12, 13).map(p => toUrl(p, 400, 400));
      imageSet.bonus = photos.slice(13, 15).map(p => toUrl(p, 500, 300));
    }

    if (portraitRes.ok) {
      const portraitData = await portraitRes.json();
      const portraitPhotos = (portraitData.results || []) as UnsplashPhoto[];
      imageSet.portraits = portraitPhotos.map(p =>
        `${p.urls.raw}&w=200&h=200&fit=crop&crop=face&auto=format,compress&q=80`
      );
    }
  } catch (err) {
    console.error("Unsplash fetch failed:", err);
    return buildFallbackImageSet();
  }

  if (imageSet.hero.length === 0) return buildFallbackImageSet();
  return imageSet;
}

function buildFallbackImageSet(): FetchedImageSet {
  return {
    hero: ["https://picsum.photos/seed/hero1/1920/1080", "https://picsum.photos/seed/hero2/1920/1080"],
    portraits: Array.from({ length: 6 }, (_, i) => `https://i.pravatar.cc/200?img=${i + 1}`),
    features: Array.from({ length: 4 }, (_, i) => `https://picsum.photos/seed/feat${i}/800/600`),
    results: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/result${i}/800/600`),
    trust: ["https://picsum.photos/seed/trust1/800/400", "https://picsum.photos/seed/trust2/800/400"],
    guarantee: ["https://picsum.photos/seed/guarantee/400/400"],
    bonus: ["https://picsum.photos/seed/bonus1/500/300", "https://picsum.photos/seed/bonus2/500/300"],
  };
}

function extractNicheKeywords(copy: string, productName: string): string[] {
  const keywords: string[] = [];
  if (productName) {
    keywords.push(...productName.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 2));
  }
  const nicheMap: Record<string, string[]> = {
    "emagre|peso|dieta|gordu|slim|magr": ["fitness", "healthy", "weight-loss"],
    "muscula|treino|acade|workout|gym": ["fitness", "workout", "gym"],
    "market|vendas|negóc|empreen|lucr": ["business", "entrepreneur", "marketing"],
    "saúde|médic|clínic|terapi|bem-estar": ["health", "wellness", "medical"],
    "culiná|receita|cozin|gastro|aliment": ["cooking", "food", "kitchen"],
    "invest|financ|dinheiro|renda|cripto": ["finance", "investment", "money"],
    "educa|curso|estud|aprend|concurso": ["education", "learning", "study"],
    "beleza|estétic|pele|cabelo|makeup": ["beauty", "skincare", "cosmetics"],
    "relacion|casal|amor|namoro|sex": ["relationship", "couple", "love"],
    "tecnolog|program|código|software|app": ["technology", "coding", "software"],
    "imóv|casa|apart|constru|decor": ["real-estate", "home", "interior"],
    "pet|cachorro|gato|animal|vet": ["pet", "dog", "animal"],
  };
  const lowerCopy = copy.toLowerCase().slice(0, 3000);
  for (const [pattern, kws] of Object.entries(nicheMap)) {
    if (new RegExp(pattern).test(lowerCopy)) {
      keywords.push(...kws);
      break;
    }
  }
  if (keywords.length === 0) keywords.push("business", "professional", "modern");
  return keywords.slice(0, 5);
}

// ============================================================
// HELPERS
// ============================================================
function getStyleFromTemplate(templateKey: string): "dark-premium" | "light-premium" {
  return templateKey === "longform-dr" ? "light-premium" : "dark-premium";
}

function postProcessHtml(html: string): string {
  let result = html;

  // Inject blob animation keyframes
  if (!result.includes('@keyframes blob')) {
    const blobStyles = `<style>
@keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
.animate-blob { animation: blob 7s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
</style>`;
    if (result.includes('</head>')) result = result.replace('</head>', blobStyles + '\n</head>');
  }

  if (result.includes('typewriter-text') && !result.includes('@keyframes typing')) {
    const s = `<style>.typewriter-text { display: inline-block; overflow: hidden; white-space: nowrap; width: 0; animation: typing 3s steps(30) forwards; } @keyframes typing { to { width: 100%; } } .typewriter-cursor { animation: blink 0.75s step-end infinite; } @keyframes blink { 50% { opacity: 0; } }</style>`;
    if (result.includes('</head>')) result = result.replace('</head>', s + '\n</head>');
  }

  if (result.includes('fadeInWord') && !result.includes('@keyframes fadeInWord')) {
    const s = `<style>@keyframes fadeInWord { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }</style>`;
    if (result.includes('</head>')) result = result.replace('</head>', s + '\n</head>');
  }

  if (result.includes('glow-border') && !result.includes('.glow-border::after')) {
    const s = `<style>.glow-card:hover .glow-border { opacity: 1; } .glow-border::after { content: ''; position: absolute; inset: -1px; border: 1px solid transparent; border-radius: inherit; background: conic-gradient(from calc(var(--glow-angle,0) * 1deg), #dd7bbb, #d79f1e, #5a922c, #4c7894, #dd7bbb); -webkit-mask: linear-gradient(#0000,#0000) padding-box, linear-gradient(#fff,#fff) border-box; mask: linear-gradient(#0000,#0000) padding-box, linear-gradient(#fff,#fff) border-box; -webkit-mask-composite: xor; mask-composite: intersect; }</style>`;
    if (result.includes('</head>')) result = result.replace('</head>', s + '\n</head>');
  }

  if (result.includes('animate-marquee') && !result.includes('@keyframes marquee')) {
    const s = `<style>@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 25s linear infinite; display: flex; width: max-content; } .animate-marquee:hover { animation-play-state: paused; }</style>`;
    if (result.includes('</head>')) result = result.replace('</head>', s + '\n</head>');
  }

  if (result.includes('IntersectionObserver')) return result;

  const enhancementScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('[data-section]');
  sections.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(40px)'; s.style.transition = 'opacity 0.8s ease, transform 0.8s ease'; });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  sections.forEach(s => obs.observe(s));
  
  document.querySelectorAll('[data-section] .card, [data-section] [class*="grid"] > *').forEach((el, i) => {
    el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease ' + (i * 0.1) + 's, transform 0.6s ease ' + (i * 0.1) + 's';
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; co.unobserve(e.target); } });
    }, { threshold: 0.1 });
    co.observe(el);
  });

  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'));
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) {
        let current = 0; const step = target / 60;
        const timer = setInterval(() => { current += step; if (current >= target) { current = target; clearInterval(timer); } el.textContent = Math.floor(current).toLocaleString(); }, 25);
        co.unobserve(e.target);
      }});
    }, { threshold: 0.5 });
    co.observe(el);
  });

  const prog = document.createElement('div');
  prog.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:var(--primary,#7c3aed);z-index:99999;transition:width 0.1s linear;width:0';
  document.body.appendChild(prog);
  window.addEventListener('scroll', () => { const p = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100; prog.style.width = p + '%'; });

  if (typeof lucide !== 'undefined') lucide.createIcons();

  window.togglePricing = function(btn) {
    var isAnnual = btn.getAttribute('aria-checked') === 'false';
    btn.setAttribute('aria-checked', String(isAnnual));
    var thumb = btn.querySelector('#pricing-thumb') || btn.querySelector('span');
    if (thumb) thumb.style.transform = isAnnual ? 'translateX(1.25rem)' : 'translateX(0)';
    btn.style.backgroundColor = isAnnual ? 'var(--primary, #7c3aed)' : 'var(--muted, #e5e7eb)';
    document.querySelectorAll('.pricing-value').forEach(function(el) {
      var val = isAnnual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
      if (val) el.textContent = el.textContent.replace(/[\\d,.]+/, val);
    });
  };
});
</script>`;

  if (result.includes('</body>')) return result.replace('</body>', enhancementScript + '\n</body>');
  return result + enhancementScript;
}

async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens = 16384, temperature = 0.5): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

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
      temperature,
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

// deno-lint-ignore no-explicit-any
function validatePageSpec(spec: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!spec.hero?.headline) errors.push("missing hero.headline");
  if (!spec.hero?.bullets || spec.hero.bullets.length < 3) errors.push("hero.bullets must have >=3 items");
  if (!spec.problem?.items || spec.problem.items.length < 3) errors.push("problem.items must have >=3 items");
  if (!spec.bonuses || spec.bonuses.length < 3) errors.push("bonuses must have >=3 items");
  if (!spec.forWho?.for || spec.forWho.for.length < 5) errors.push("forWho.for must have >=5 items");
  if (!spec.forWho?.notFor || spec.forWho.notFor.length < 5) errors.push("forWho.notFor must have >=5 items");
  if (!spec.faq || spec.faq.length < 8) errors.push("faq must have >=8 items");
  return { valid: errors.length === 0, errors };
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
    // ACTION: review-page
    // ============================================================
    if (action === "review-page") {
      const { currentHtml } = body;
      if (!currentHtml) {
        return new Response(JSON.stringify({ error: "currentHtml is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const headMatch = currentHtml.match(/<head[\s\S]*?<\/head>/i);
      const headBlock = headMatch ? headMatch[0] : "";

      const reviewPrompt = `IMMUTABLE HEAD BLOCK (copy exactly):
---HEAD BLOCK START---
${headBlock}
---HEAD BLOCK END---

Review the FULL PAGE below. Apply ONLY Tailwind class fixes.

FULL PAGE HTML:
${currentHtml}`;

      const rawContent = await callOpenAI(REVIEW_SYSTEM_PROMPT, reviewPrompt, 16384, 0.2);
      const jsonStr = parseJsonFromAI(rawContent);

      let reviewedHtml: string;
      let fixes: string[] = [];
      try {
        const parsed = JSON.parse(jsonStr);
        reviewedHtml = parsed.html;
        fixes = parsed.fixes || [];
      } catch {
        const htmlMatch = rawContent.match(/<!doctype html[\s\S]*<\/html>/i);
        if (htmlMatch) reviewedHtml = htmlMatch[0];
        else throw new Error("Failed to parse reviewed HTML");
      }

      if (!reviewedHtml) throw new Error("AI review did not return HTML");

      // Safety: re-inject original <head> if Tailwind CDN was stripped
      if (headBlock && !reviewedHtml.includes("cdn.tailwindcss.com")) {
        const reviewedHeadMatch = reviewedHtml.match(/<head[\s\S]*?<\/head>/i);
        if (reviewedHeadMatch) reviewedHtml = reviewedHtml.replace(reviewedHeadMatch[0], headBlock);
      }

      // Safety: re-inject missing scripts
      const originalScripts = currentHtml.match(/<script(?!.*tailwindcss)(?!.*tailwind\.config)[^>]*>[\s\S]*?<\/script>/gi) || [];
      const reviewedScripts = reviewedHtml.match(/<script(?!.*tailwindcss)(?!.*tailwind\.config)[^>]*>[\s\S]*?<\/script>/gi) || [];
      if (originalScripts.length > reviewedScripts.length) {
        const missingScripts = originalScripts.filter(s => !reviewedHtml.includes(s.slice(0, 60)));
        if (missingScripts.length > 0) reviewedHtml = reviewedHtml.replace('</body>', missingScripts.join('\n') + '\n</body>');
      }

      return new Response(
        JSON.stringify({ html: postProcessHtml(reviewedHtml), fixes }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // ACTION: edit-section (legacy HTML splice)
    // ============================================================
    if (action === "edit-section") {
      const { currentHtml, sectionName, instruction } = body;
      if (!currentHtml || !sectionName || !instruction) {
        return new Response(JSON.stringify({ error: "currentHtml, sectionName, and instruction are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const sectionRegex = new RegExp(
        `(<(?:section|div|header|footer|main)[^>]*data-section="${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?)(?=<(?:section|div|header|footer|main)[^>]*data-section="|</body>|</main>|$)`,
        "i"
      );
      const sectionMatch = currentHtml.match(sectionRegex);
      if (!sectionMatch) {
        return new Response(JSON.stringify({ error: `Section "${sectionName}" not found` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const originalSectionHtml = sectionMatch[1].trim();
      const styleMatch = currentHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const tailwindConfigMatch = currentHtml.match(/<script>\s*tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*<\/script>/i);
      const designContext = [
        styleMatch ? `CSS vars:\n${styleMatch[1].trim()}` : "",
        tailwindConfigMatch ? `Tailwind Config:\n${tailwindConfigMatch[1].trim()}` : "",
      ].filter(Boolean).join("\n\n");

      const EDIT_HTML_PROMPT = `You are an elite web designer. Modify ONLY this section's HTML according to the instruction.
RULES: ALL styling via Tailwind. NO inline style="". PRESERVE all text content. Keep data-section attribute.
OUTPUT: ONLY valid JSON: { "section_html": "<section...>...</section>", "changes": "description" }`;

      const editPrompt = `Section: data-section="${sectionName}"
${designContext ? `Design context:\n${designContext}\n` : ""}
Current HTML:\n${originalSectionHtml}\n
Instruction: ${instruction}`;

      const rawContent = await callOpenAI(EDIT_HTML_PROMPT, editPrompt, 16384, 0.5);
      const jsonStr = parseJsonFromAI(rawContent);

      let newSectionHtml: string;
      try {
        const parsed = JSON.parse(jsonStr);
        newSectionHtml = parsed.section_html || parsed.html;
      } catch {
        const sectionExtract = rawContent.match(/<(?:section|div|header|footer|main)[^>]*data-section[\s\S]*$/i);
        if (sectionExtract) newSectionHtml = sectionExtract[0];
        else throw new Error("Failed to parse edited section");
      }

      if (!newSectionHtml) throw new Error("AI did not return section HTML");
      const finalHtml = currentHtml.replace(originalSectionHtml, newSectionHtml.trim());

      return new Response(
        JSON.stringify({ html: postProcessHtml(finalHtml), changes: "Section modified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // ACTION: edit-pagespec-section (NEW — structured editing)
    // ============================================================
    if (action === "edit-pagespec-section") {
      const { generationId, sectionKey, instruction } = body;
      if (!generationId || !sectionKey || !instruction) {
        return new Response(JSON.stringify({ error: "generationId, sectionKey, and instruction are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Load existing generation
      const { data: gen, error: genErr } = await supabase
        .from("site_generations")
        .select("*")
        .eq("id", generationId)
        .single();

      if (genErr || !gen) {
        return new Response(JSON.stringify({ error: "Generation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const pageSpec = gen.page_spec;
      if (!pageSpec) {
        return new Response(JSON.stringify({ error: "This generation has no PageSpec. Re-generate the page first." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`Editing PageSpec section "${sectionKey}" for generation ${generationId}`);

      const editPrompt = `Current PageSpec:
${JSON.stringify(pageSpec, null, 2)}

Section to edit: "${sectionKey}"

Instruction: ${instruction}

Return the COMPLETE updated PageSpec JSON with ONLY the "${sectionKey}" section modified. All other sections must remain EXACTLY as they are.`;

      const rawContent = await callOpenAI(EDIT_SECTION_PROMPT, editPrompt, 16384, 0.4);
      const jsonStr = parseJsonFromAI(rawContent);

      let updatedSpec: Record<string, unknown>;
      try {
        updatedSpec = JSON.parse(jsonStr);
      } catch {
        console.error("Failed to parse updated PageSpec");
        throw new Error("Failed to parse AI response for section edit");
      }

      // Re-render HTML from updated PageSpec
      const style = getStyleFromTemplate(gen.template_key);
      const branding = (gen.branding || {}) as Record<string, string>;

      // Fetch images again (or use cached from generation)
      const renderPrompt = buildRenderPrompt(updatedSpec, {
        primaryColor: branding.primaryColor || "#7c3aed",
        style,
        logoUrl: branding.logoUrl,
        siteTitle: branding.title,
        lang: gen.language_code || "pt-BR",
        culturalRegion: gen.cultural_region || "auto",
        templateKey: gen.template_key,
        images: null, // Will use picsum fallbacks in render
      });

      console.log("Re-rendering HTML from updated PageSpec...");
      const rawHtml = await callOpenAI(HTML_RENDER_PROMPT, renderPrompt, 16384, 0.5);
      const htmlJson = parseJsonFromAI(rawHtml);

      let newHtml: string;
      try {
        const parsed = JSON.parse(htmlJson);
        newHtml = parsed.html;
      } catch {
        const htmlMatch = rawHtml.match(/<!doctype html[\s\S]*<\/html>/i);
        if (htmlMatch) newHtml = htmlMatch[0];
        else throw new Error("Failed to parse re-rendered HTML");
      }

      newHtml = postProcessHtml(newHtml);

      // Save updated PageSpec + HTML
      await supabase
        .from("site_generations")
        .update({
          page_spec: updatedSpec,
          generated_html: newHtml,
          updated_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      return new Response(
        JSON.stringify({ html: newHtml, pageSpec: updatedSpec, changes: `Section "${sectionKey}" updated` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // ACTION: generate (default) — PageSpec → HTML
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
      return new Response(JSON.stringify({ error: "projectId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const copyResults = typeof project.copy_results === "string"
      ? JSON.parse(project.copy_results)
      : project.copy_results || {};

    const salesCopy = copyResults.pagina_vendas || "";
    if (!salesCopy) {
      return new Response(
        JSON.stringify({ error: "Este projeto não possui copy da Página de Vendas gerada. Gere a etapa 'Página de Vendas' primeiro." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build comprehensive copy context from all available Lab steps
    let fullCopy = salesCopy;
    const copyParts: string[] = [];
    if (copyResults.avatar) copyParts.push(`=== AVATAR/PERSONA ===\n${copyResults.avatar}`);
    if (copyResults.usp) copyParts.push(`=== USP ===\n${copyResults.usp}`);
    if (copyResults.oferta) copyParts.push(`=== OFERTA ===\n${copyResults.oferta}`);
    if (copyResults.proofs) copyParts.push(`=== PROVAS ===\n${copyResults.proofs}`);
    if (copyParts.length > 0) {
      fullCopy = copyParts.join("\n\n") + "\n\n=== PÁGINA DE VENDAS ===\n" + salesCopy;
    }

    if (options.includeUpsells) {
      const upsellCopy = copyResults.pagina_upsell || "";
      if (upsellCopy) fullCopy += "\n\n=== PÁGINA DE UPSELL ===\n" + upsellCopy;
    }

    const lang = options.language || project.language_code || "pt-BR";
    const primaryColor = options.branding?.primaryColor || "#7c3aed";
    const style = getStyleFromTemplate(templateKey);

    // Step 0: Fetch images
    console.log("Fetching niche-specific images...");
    const nicheKeywords = extractNicheKeywords(fullCopy, project.name);
    const imageSet = await fetchUnsplashImages(nicheKeywords);
    console.log(`Images: hero=${imageSet.hero.length}, portraits=${imageSet.portraits.length}`);

    // ========== STEP 1: Generate PageSpec ==========
    console.log("Step 1/2: Generating PageSpec from copy...");
    const pageSpecPrompt = `Project: "${project.name}"
Language: ${lang}
Region: ${project.cultural_region || "auto"}
Tone: ${project.tone_formality || "neutral"}
Avoid real names: ${project.avoid_real_names}

Copy to extract and structure (USE VERBATIM — do NOT summarize):
"""
${fullCopy}
"""

Extract ALL content into PageSpec JSON. Return ONLY valid JSON.`;

    const rawPageSpec = await callOpenAI(PAGESPEC_SYSTEM_PROMPT, pageSpecPrompt, 16384, 0.3);
    const pageSpecJson = parseJsonFromAI(rawPageSpec);

    let pageSpec: Record<string, unknown>;
    try {
      pageSpec = JSON.parse(pageSpecJson);
    } catch {
      console.error("Failed to parse PageSpec:", pageSpecJson.slice(0, 500));
      throw new Error("Failed to parse PageSpec from copy");
    }

    // Validate PageSpec
    const validation = validatePageSpec(pageSpec);
    if (!validation.valid) {
      console.warn("PageSpec validation issues:", validation.errors.join(", "));
      // Try to fix with a retry
      console.log("Retrying PageSpec with fix instructions...");
      const fixPrompt = `The PageSpec below has validation issues: ${validation.errors.join("; ")}

Fix the JSON to match the schema exactly. Add missing items with content from the copy or [INSERIR...] placeholders.

Current PageSpec:
${JSON.stringify(pageSpec, null, 2)}

Return ONLY the fixed valid JSON.`;
      const fixedRaw = await callOpenAI(PAGESPEC_SYSTEM_PROMPT, fixPrompt, 16384, 0.3);
      try {
        const fixedSpec = JSON.parse(parseJsonFromAI(fixedRaw));
        pageSpec = fixedSpec;
        console.log("PageSpec fixed successfully");
      } catch {
        console.warn("Fix retry failed, proceeding with original PageSpec");
      }
    }

    // ========== STEP 2: Render PageSpec → HTML ==========
    console.log("Step 2/2: Rendering PageSpec into HTML...");
    const renderPrompt = buildRenderPrompt(pageSpec, {
      primaryColor,
      style,
      logoUrl: options.branding?.logoUrl,
      siteTitle: options.branding?.title,
      lang,
      culturalRegion: project.cultural_region || "auto",
      templateKey,
      images: imageSet,
    });

    const rawContent = await callOpenAI(HTML_RENDER_PROMPT, renderPrompt, 16384, 0.5);
    const jsonStr = parseJsonFromAI(rawContent);

    let parsedHtml: string;
    let sections: string[] = [];
    try {
      const parsed = JSON.parse(jsonStr);
      parsedHtml = parsed.html;
      sections = parsed.sections || [];
    } catch {
      const htmlMatch = rawContent.match(/<!doctype html[\s\S]*<\/html>/i);
      if (htmlMatch) parsedHtml = htmlMatch[0];
      else throw new Error("Failed to parse AI-generated page");
    }

    if (!parsedHtml) throw new Error("AI response did not contain HTML");
    parsedHtml = postProcessHtml(parsedHtml);

    // Save to DB with PageSpec
    const { data: saved, error: saveError } = await supabase
      .from("site_generations")
      .insert({
        user_id: userId,
        project_id: projectId,
        template_key: templateKey,
        status: "generated",
        generated_html: parsedHtml,
        page_spec: pageSpec,
        generated_assets: {},
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
        html: parsedHtml,
        pageSpec,
        sections,
        meta: {
          templateKey,
          projectId,
          generationId: saved?.id || null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-site error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    const status = msg.includes("credits insufficient") ? 402 : msg.includes("Rate limit") ? 429 : 500;
    return new Response(
      JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// Build render prompt from PageSpec + options
// ============================================================
function buildRenderPrompt(
  pageSpec: Record<string, unknown>,
  opts: {
    primaryColor: string;
    style: string;
    logoUrl?: string;
    siteTitle?: string;
    lang: string;
    culturalRegion: string;
    templateKey: string;
    images: FetchedImageSet | null;
  }
): string {
  let imageBlock = "";
  if (opts.images && opts.images.hero.length > 0) {
    imageBlock = `

PRE-FETCHED REAL IMAGES (USE THESE EXACT URLs):
HERO: ${opts.images.hero.map((u, i) => `hero_${i + 1}: ${u}`).join("\n")}
PORTRAITS: ${opts.images.portraits.map((u, i) => `portrait_${i + 1}: ${u}`).join("\n")}
FEATURES: ${opts.images.features.map((u, i) => `feature_${i + 1}: ${u}`).join("\n")}
RESULTS: ${opts.images.results.map((u, i) => `result_${i + 1}: ${u}`).join("\n")}
TRUST: ${opts.images.trust.map((u, i) => `trust_${i + 1}: ${u}`).join("\n")}
GUARANTEE: ${opts.images.guarantee.map((u, i) => `guarantee_${i + 1}: ${u}`).join("\n")}
BONUS: ${opts.images.bonus.map((u, i) => `bonus_${i + 1}: ${u}`).join("\n")}
IMPORTANT: Use these EXACT URLs. Do NOT use source.unsplash.com.`;
  }

  return `PageSpec (structured copy — use ALL content verbatim):
${JSON.stringify(pageSpec, null, 2)}

Brand: {
  "primary_color": "${opts.primaryColor}",
  "style": "${opts.style}"
  ${opts.logoUrl ? `, "logo_url": "${opts.logoUrl}"` : ""}
  ${opts.siteTitle ? `, "site_title": "${opts.siteTitle}"` : ""}
}
Locale: { "language": "${opts.lang}", "region": "${opts.culturalRegion}" }
Template style: "${opts.templateKey}"
${imageBlock}

Render this PageSpec into a premium single-file HTML landing page. Use ALL the content — do NOT summarize. Return ONLY valid JSON.`;
}
