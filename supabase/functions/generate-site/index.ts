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

const HTML_SYSTEM_PROMPT = `You are an elite, award-winning web designer AND direct-response copywriter at a $500/hr agency.
Your job: generate a VISUALLY BREATHTAKING, conversion-optimized landing page as a single HTML file.
THE PAGE MUST LOOK LIKE A $50,000 AGENCY-BUILT PAGE. Not a template. PREMIUM CRAFT.

═══════════════════════════════════════
💰 SALES PSYCHOLOGY (APPLY THROUGHOUT)
═══════════════════════════════════════
You are not just designing — you are engineering CONVERSIONS. Apply these principles:
- PATTERN INTERRUPT: Hero must stop scrolling instantly. Use bold contrast, unexpected layout, or provocative question.
- OPEN LOOPS: Create curiosity gaps that force scrolling ("The 3rd reason will surprise you...")
- SOCIAL PROOF DENSITY: Sprinkle proof elements BETWEEN sections, not just in one block. Mini-testimonials, stats, logos everywhere.
- URGENCY & SCARCITY: Visual countdown timers, "X vagas restantes", stock indicators, "Oferta encerra em..."
- ANCHORING: Always show original price before discounted price. Stack the value visually.
- RISK REVERSAL: Guarantee section must feel bulletproof — use shield imagery, seal badges, bold promises.
- MICRO-COMMITMENTS: Use interactive elements (quizzes, calculators, yes/no questions) before CTAs.
- VISUAL HIERARCHY: Guide the eye in a Z-pattern on desktop, single-column on mobile. CTAs must POP.
- EMOTIONAL TRIGGERS: Use before/after imagery, transformation language, aspirational lifestyle photos.
- MULTIPLE CTAs: Place conversion points every 2-3 scroll-lengths. Vary CTA copy ("Quero Começar", "Garantir Minha Vaga", "Sim, Eu Quero").

═══════════════════════════════════════
SECTION MARKERS (REQUIRED)
═══════════════════════════════════════
Every major section MUST have a data-section attribute:
data-section="hero" | "trust-strip" | "problems" | "solution" | "features" | "social-proof" | "pricing" | "faq" | "guarantee" | "final-cta" | "footer"
Example: <section data-section="hero" class="...">
═══════════════════════════════════════
🖼️ IMAGES (CRITICAL — THIS MAKES THE PAGE REAL)
═══════════════════════════════════════
PRIORITY: If pre-fetched image URLs are provided in the user prompt (section 7), use THOSE EXACT URLs.
They are high-quality, niche-specific images from the Unsplash API — already optimized and curated.

FALLBACK (only if no pre-fetched images are provided):
Use Unsplash Source API: https://source.unsplash.com/featured/{width}x{height}/?{keyword1},{keyword2}

REQUIRED image placements:
- HERO: Full-width background — use the provided hero image URL(s)
- TESTIMONIALS: Real-looking portrait avatars — use the provided portrait URLs (vary them)
- FEATURES/MECHANISM: Contextual photos — use provided feature image URLs
- SOCIAL PROOF / RESULTS: Achievement imagery — use provided result URLs
- ABOUT/TRUST: Team/office imagery — use provided trust URLs
- GUARANTEE: Trust and security imagery — use provided guarantee URLs
- BONUS CARDS: Relevant imagery — use provided bonus URLs

Image rules:
- Use the EXACT pre-fetched URLs without modification
- Use object-fit: cover for backgrounds and avatars
- Add subtle overlay gradients on hero images for text readability
- loading="lazy" on all images except hero
- Fallback: if an image doesn't load, use a CSS gradient background as fallback

═══════════════════════════════════════
🎨 ICONS (USE LUCIDE CDN)
═══════════════════════════════════════
Include Lucide icons via CDN for professional iconography:
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

Then use: <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
And init: <script>lucide.createIcons();</script>

REQUIRED icon placements:
- Feature cards: relevant icons (shield, zap, target, brain, heart, star, etc.)
- Benefit bullets: check-circle or check icons
- Trust strip: award, shield-check, users, clock icons  
- FAQ: chevron-down for accordion arrows
- Guarantee: shield, lock icons
- CTAs: arrow-right icon next to button text
- Social proof: quote icon for testimonials
- Navigation: menu icon for mobile

═══════════════════════════════════════
✨ INTERACTIVE COMPONENTS (REQUIRED)
═══════════════════════════════════════
The page MUST include these interactive elements (vanilla JS):

1) SCROLL REVEAL ANIMATIONS:
   - Every section fades in + slides up on scroll entry
   - Staggered children animation (cards appear one by one)
   - Use IntersectionObserver + CSS transitions
   
2) ANIMATED NUMBER COUNTERS:
   - Any number/stat in the copy should count up when scrolled into view
   - Smooth easing animation over 2 seconds

3) TESTIMONIAL CAROUSEL:
   - Auto-rotating testimonials with dots/indicators
   - Smooth CSS transitions between slides
   - Pause on hover

4) FAQ ACCORDION:
   - Smooth height animation on open/close
   - Rotate chevron icon
   - Only one open at a time

5) STICKY CTA BAR:
   - Appears after scrolling past hero
   - Slide-down animation
   - Compact with headline + CTA button
   - Hide on scroll up, show on scroll down

6) FLOATING ELEMENTS:
   - Subtle floating glow orbs in hero (CSS @keyframes)
   - Parallax effect on decorative elements
   
7) HOVER EFFECTS:
   - Cards: translateY(-8px) + enhanced shadow + border glow
   - Buttons: scale(1.05) + glow spread
   - Images: subtle zoom (scale 1.05)
   - Links: underline slide animation

8) PROGRESS BAR:
   - Reading progress bar at top of page
   - Thin line that fills as user scrolls

═══════════════════════════════════════
🎨 VISUAL DESIGN SYSTEM
═══════════════════════════════════════
TYPOGRAPHY:
- Load from Google Fonts: Inter (body) + Space Grotesk or Outfit (headings)
  For light/editorial themes: Poppins (body+headings) is also excellent.
- Hero headline: 56-80px, font-weight 800, line-height 1.05
- Section titles: 36-48px, font-weight 700  
- Body: 17-19px, line-height 1.7, font-weight 400
- Labels/badges: 11-12px, uppercase, letter-spacing 0.1em, font-weight 600

COLOR SYSTEM (CSS custom properties):
For DARK themes:
:root {
  --primary: {brand.primary_color};
  --primary-glow: {lighter version};
  --bg-deep: #050508;
  --bg-section: #0a0a12;
  --bg-card: rgba(255,255,255,0.03);
  --bg-card-hover: rgba(255,255,255,0.06);
  --border: rgba(255,255,255,0.08);
  --border-hover: rgba(255,255,255,0.15);
  --text-primary: #f0f0f5;
  --text-secondary: #8a8a9a;
  --text-muted: #5a5a6a;
  --gradient-primary: linear-gradient(135deg, var(--primary), var(--primary-glow));
  --gradient-mesh: radial-gradient(ellipse at 20% 50%, rgba(var(--primary-rgb), 0.08) 0%, transparent 50%);
}
For LIGHT themes (longform-dr):
:root {
  --primary: {brand.primary_color};
  --primary-glow: {lighter tint};
  --bg-deep: #EBEDF0;
  --bg-section: #FFFFFF;
  --bg-section-alt: #F8F8F8;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F0F0F5;
  --border: rgba(0,0,0,0.08);
  --border-hover: rgba(0,0,0,0.15);
  --text-primary: #1a1a2e;
  --text-secondary: #393939;
  --text-muted: #9F9F9F;
  --shadow-card: 0 2px 10px -1px rgba(0,0,0,0.1);
  --shadow-card-accent: 1px 1px 8px -1px var(--primary);
}

SPACING:
- Sections: 100-140px vertical padding
- Cards: 28-40px padding, 15-24px border-radius
- Content max-width: 870px for centered text-heavy pages, 1200px for wide layouts
- Generous whitespace between elements

SURFACES & CARDS:
Dark: backdrop-filter: blur(20px) saturate(1.5), border: 1px solid var(--border), glow shadows
Light: background: var(--bg-section), border-radius: 15px, box-shadow: var(--shadow-card), clean borders
- Cards on light themes: white containers on light gray background (#EBEDF0)
- Colored shadow on hover: box-shadow using primary color

GRADIENTS:
- Text gradients on key headlines: background-clip: text
- Button gradients: linear-gradient with hover shift
- Section mesh backgrounds: radial-gradient decorative blobs
- Divider lines: gradient from transparent to primary to transparent

BUTTONS:
- Height: 52-60px, padding: 16px 40px
- Border-radius: 50px (pill shape) for CTAs, 14px for secondary
- Primary: solid accent color OR gradient background + glow shadow
- Text: uppercase, font-weight 500-600, font-size 16-20px
- Micro-interaction: scale(1.05) + shadow spread on hover
- Arrow icon inside button

═══════════════════════════════════════
📐 SECTION BLUEPRINT
═══════════════════════════════════════
Generate sections in this order with these design patterns:

A) HERO (data-section="hero")
   - Full viewport height or generous padding
   - Badge/pill at top ("🔥 Método Exclusivo" etc.)
   - Massive headline with accent-colored key words (use <span> with primary color)
   - Subheadline with lighter weight
   - Video embed area (if applicable) with rounded corners and accent-colored box-shadow
   - CTA button: pill-shaped, accent color, uppercase, centered
   - Trust strip below: avatars + social proof numbers

B) TRUST STRIP (data-section="trust-strip")
   - Logos or trust badges in a row
   - Subtle separator lines

C) PROBLEMS (data-section="problems")
   - Long-form copy text with emotional engagement
   - Card grid (2-3 columns) for specific problems
   - Each card: icon + title + description
   - Alternating subtle backgrounds

D) SOLUTION/MECHANISM (data-section="solution")
   - Split layout: text left, product image right
   - Product title in accent color
   - Description text below
   - Product images displayed in a row (4 items, ~210px each)

E) FEATURES/BENEFITS (data-section="features")
   - Split layout: product image left, text right
   - Title in accent color
   - Bullet list with accent-colored checkmarks
   - Each bullet is a full descriptive sentence

F) SOCIAL PROOF (data-section="social-proof")
   - Section title in accent color, centered
   - 3-column grid of testimonial cards
   - Each card: rounded avatar (65px, border in accent color) + testimony text + before/after image + name + city
   - Cards with border-radius 12px and box-shadow

G) PRICING/OFFER (data-section="pricing")
   - "What you'll receive" section with product cards (image left, description right)
   - Bonuses section on alternate background with title + description + images
   - Pricing block: original price strikethrough + current price bold + discount headline in accent
   - Product stack image centered
   - CTA button: pill-shaped, accent color, uppercase

H) GUARANTEE (data-section="guarantee")
   - Two-column: guarantee seal/badge image left, text right
   - Light accent-tinted background (e.g., #FFEEF2 for red accent)
   - Title in accent color
   - Full guarantee text

I) FAQ (data-section="faq")
   - Title in accent color
   - Animated accordion with smooth open/close
   - Chevron rotation on toggle
   - CTA button after FAQ

J) FINAL CTA (data-section="final-cta")
   - Recap of key benefits
   - Large CTA button with pulse animation
   - Urgency element if present in copy

K) FOOTER (data-section="footer")
   - Two-column layout on accent-colored background
   - Left: anti-piracy/legal notice
   - Right: logo + copyright + terms/privacy links
   - Small text, light color on dark background

═══════════════════════════════════════
🏗️ FEW-SHOT REFERENCE SNIPPETS
═══════════════════════════════════════
Use these as STYLE REFERENCES. Do NOT copy verbatim — adapt to the copy content.

HERO EXAMPLE (light theme):
\`\`\`html
<section data-section="hero" style="background: var(--bg-section); padding: 60px 0 30px; max-width: 870px; margin: 0 auto; border-radius: 15px;">
  <div style="text-align: center; max-width: 770px; margin: 0 auto; padding: 30px 0 0;">
    <p style="color: var(--text-muted); font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Plano Inovador de</p>
    <h1 style="font-size: 30px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; margin: 0 80px;">
      <span style="color: var(--primary); font-size: 42px;">30 Dias</span> Para Você Transformar Seus Resultados!
    </h1>
    <div style="margin: 30px 50px 0; border-radius: 15px; box-shadow: 1px 1px 8px -1px var(--primary);">
      <!-- Video or hero image here -->
    </div>
    <a href="#" style="display: inline-block; margin-top: 12px; padding: 16px 40px; background: var(--primary); color: white; border-radius: 50px; font-size: 20px; font-weight: 500; text-transform: uppercase; text-decoration: none;">
      Quero Começar Hoje
    </a>
  </div>
</section>
\`\`\`

TESTIMONIAL CARD EXAMPLE:
\`\`\`html
<div style="padding: 20px 0; border-radius: 12px; box-shadow: 1px 2px 10px -1px rgba(0,0,0,0.15); margin: 10px; overflow: hidden;">
  <img src="https://source.unsplash.com/featured/200x200/?portrait,woman,professional?sig=1" 
       alt="Avatar" style="width: 65px; height: 65px; border-radius: 50%; border: 2px solid var(--primary); display: block; margin: 0 auto; object-fit: cover;">
  <p style="font-size: 14px; padding: 0 10px; color: var(--text-secondary);">Full testimonial text here...</p>
  <img src="https://source.unsplash.com/featured/400x300/?results,transformation,before-after" alt="Results" style="width: 100%;" loading="lazy">
  <p style="text-align: center; color: var(--primary); font-size: 14px; font-weight: 600; margin-bottom: -10px;">Name</p>
  <p style="text-align: center; color: var(--text-secondary); font-size: 12px;">City, State</p>
</div>
\`\`\`

GUARANTEE SECTION EXAMPLE:
\`\`\`html
<section data-section="guarantee" style="background: #FFEEF2; padding: 40px 0; border-radius: 0;">
  <div style="display: flex; align-items: center; max-width: 770px; margin: 0 auto; gap: 20px;">
    <div style="flex-shrink: 0;">
      <img src="shield-guarantee-badge.png" alt="Guarantee" style="width: 170px;">
    </div>
    <div>
      <h3 style="color: var(--primary); font-size: 24px; font-weight: 600;">Garantia Incondicional</h3>
      <p style="color: var(--text-secondary); font-size: 16px;">Full guarantee text with all details...</p>
    </div>
  </div>
</section>
\`\`\`

PRICING BLOCK EXAMPLE:
\`\`\`html
<section data-section="pricing" style="padding: 40px 0 60px; text-align: center;">
  <p style="color: var(--text-muted); font-size: 14px; text-transform: uppercase; font-weight: 600; text-decoration: line-through;">Valor total de R$ 394,00</p>
  <p style="color: var(--text-primary); font-size: 20px; font-weight: 900; text-transform: uppercase; margin-top: -10px;">Por R$ 197,00</p>
  <h2 style="color: var(--primary); font-size: 40px; font-weight: 600; margin: 0 60px;">Tenha acesso com 50% de desconto hoje</h2>
  <img src="product-stack.png" alt="Product Stack" style="width: 70%; margin: 30px auto 0;">
  <a href="#" style="display: inline-block; margin-top: 12px; padding: 16px 40px; background: var(--primary); color: white; border-radius: 50px; font-size: 20px; font-weight: 500; text-transform: uppercase; text-decoration: none;">
    Inscrever-se Agora
  </a>
</section>
\`\`\`

FOOTER EXAMPLE:
\`\`\`html
<footer data-section="footer" style="background: var(--primary); border-radius: 0 0 15px 15px; padding: 10px;">
  <div style="display: flex; gap: 20px; color: white; max-width: 770px; margin: 0 auto;">
    <div style="flex: 1;">
      <h5 style="font-size: 18px;">PIRATARIA É <span style="font-weight: 600;">CRIME</span></h5>
      <p style="font-size: 12px; font-weight: 300;">Legal disclaimer text...</p>
    </div>
    <div style="flex: 1; text-align: center;">
      <p style="font-size: 12px;">Copyright © 2024 - Company Name<br>Todos os direitos reservados.</p>
      <p style="font-size: 12px;"><a href="#" style="color: #e8e8e8;">Termos de Uso</a> | <a href="#" style="color: #e8e8e8;">Políticas de Privacidade</a></p>
    </div>
  </div>
</footer>
\`\`\`

═══════════════════════════════════════
🧹 CONTENT RULES
═══════════════════════════════════════
- NEVER output internal labels: "SEÇÃO:", "PÁGINA DE VENDAS", "{SIM...}", "(Inserir ...)"
- Strip and rewrite any such labels into natural, compelling headings
- Production-ready: no empty paragraphs, no dummy text, no TODOs
- Write everything in the provided locale language
- Adapt culturally to locale.region_hint
- Preserve ALL copy content — do NOT summarize long sections

═══════════════════════════════════════
⚙️ TECHNICAL RULES
═══════════════════════════════════════
- Single HTML file. ALL CSS in <style> tag. JS at bottom of <body>.
- Google Fonts with display=swap
- Viewport meta tag, charset UTF-8
- CSS custom properties for all colors
- CSS Grid + Flexbox layouts
- Smooth scroll behavior
- Responsive: mobile-first with breakpoints at 640px, 768px, 1024px
- Lazy loading on images: loading="lazy"
- Semantic HTML: <header>, <main>, <section>, <footer>

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
Return ONLY a JSON object (no markdown fences) with:
{
  "file_name": "<project-name>-<page_type>.html",
  "html": "<!doctype html>...full premium HTML here...",
  "sections": ["hero", "trust-strip", "problems", ...],
  "notes": { "sections": [...], "locale_touches": [...], "images_used": [...] }
}

Generate the page now. Make it ABSOLUTELY STUNNING — the kind of page that makes competitors jealous.`;

const EDIT_SECTION_PROMPT = `You are an elite web designer at a premium agency. You will receive:
1) The HTML of a SINGLE SECTION extracted from a landing page
2) The name/type of that section
3) An instruction describing what to change

Your job: modify ONLY this section's HTML according to the instruction.

RULES:
- Return ONLY the modified section HTML (the <section> or element with data-section attribute)
- Do NOT return a full page — just the section element and its contents
- Keep the data-section attribute on the root element
- Make the changes look professional and consistent
- Write content in the same language as the existing section
- Use real images from Unsplash Source API (https://source.unsplash.com/featured/{width}x{height}/?{keywords}) with niche-relevant keywords
- Use Lucide icons (<i data-lucide="icon-name">) if icons are needed
- If new CSS is needed, add it as inline styles or a <style> tag inside the section

OUTPUT FORMAT:
Return ONLY a JSON object (no markdown fences) with:
{
  "section_html": "<section data-section=\\"...\\">....</section>",
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
// UNSPLASH API HELPER
// ============================================================

interface UnsplashPhoto {
  id: string;
  urls: { raw: string; full: string; regular: string; small: string; thumb: string };
  user: { name: string; links: { html: string } };
  alt_description: string | null;
  description: string | null;
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
    console.warn("UNSPLASH_ACCESS_KEY not set, falling back to source.unsplash.com");
    return buildFallbackImageSet(nicheKeywords);
  }

  const categories: { key: keyof FetchedImageSet; query: string; count: number; orientation?: string }[] = [
    { key: "hero", query: nicheKeywords.slice(0, 3).join(" "), count: 3, orientation: "landscape" },
    { key: "portraits", query: "portrait person professional smile", count: 6, orientation: "squarish" },
    { key: "features", query: `${nicheKeywords[0]} productivity`, count: 4, orientation: "landscape" },
    { key: "results", query: `${nicheKeywords[0]} achievement success celebration`, count: 3, orientation: "landscape" },
    { key: "trust", query: "team office professional collaboration", count: 2, orientation: "landscape" },
    { key: "guarantee", query: "shield security protection trust", count: 2, orientation: "squarish" },
    { key: "bonus", query: `${nicheKeywords[0]} learning digital education`, count: 3, orientation: "landscape" },
  ];

  const imageSet: FetchedImageSet = {
    hero: [], portraits: [], features: [], results: [],
    trust: [], guarantee: [], bonus: [],
  };

  await Promise.all(
    categories.map(async (cat) => {
      try {
        const params = new URLSearchParams({
          query: cat.query,
          per_page: String(cat.count),
          orientation: cat.orientation || "landscape",
          content_filter: "high",
        });
        const res = await fetch(
          `https://api.unsplash.com/search/photos?${params.toString()}`,
          { headers: { Authorization: `Client-ID ${accessKey}` } }
        );
        if (!res.ok) {
          console.error(`Unsplash API error for "${cat.key}": ${res.status}`);
          return;
        }
        const data = await res.json();
        const photos = (data.results || []) as UnsplashPhoto[];
        imageSet[cat.key] = photos.map((p) => {
          // Use Unsplash image resizing via URL params for optimal size
          const width = cat.orientation === "squarish" ? 400 : cat.key === "hero" ? 1920 : 800;
          const height = cat.orientation === "squarish" ? 400 : cat.key === "hero" ? 1080 : 600;
          return `${p.urls.raw}&w=${width}&h=${height}&fit=crop&auto=format,compress&q=80`;
        });
      } catch (err) {
        console.error(`Failed to fetch Unsplash images for "${cat.key}":`, err);
      }
    })
  );

  return imageSet;
}

function buildFallbackImageSet(keywords: string[]): FetchedImageSet {
  const kw = keywords.join(",");
  return {
    hero: [`https://source.unsplash.com/featured/1920x1080/?${kw}`],
    portraits: [
      "https://source.unsplash.com/featured/200x200/?portrait,woman,smile?sig=1",
      "https://source.unsplash.com/featured/200x200/?portrait,man,professional?sig=2",
      "https://source.unsplash.com/featured/200x200/?portrait,person,happy?sig=3",
    ],
    features: [`https://source.unsplash.com/featured/800x600/?${kw},productivity`],
    results: [`https://source.unsplash.com/featured/800x600/?achievement,results`],
    trust: [`https://source.unsplash.com/featured/800x400/?team,office`],
    guarantee: [`https://source.unsplash.com/featured/400x400/?shield,security`],
    bonus: [`https://source.unsplash.com/featured/500x300/?ebook,learning`],
  };
}

function extractNicheKeywords(copy: string, productName: string): string[] {
  // Extract meaningful keywords from the copy for better image search
  const keywords: string[] = [];
  
  // Use product name
  if (productName) {
    keywords.push(...productName.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 2));
  }

  // Common niche detection from copy
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

  if (keywords.length === 0) {
    keywords.push("business", "professional", "modern");
  }

  return keywords.slice(0, 5);
}

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
  fullCopy: string,
  imageSet?: FetchedImageSet
): string {
  let imageBlock = "";
  if (imageSet && imageSet.hero.length > 0) {
    imageBlock = `

7) PRE-FETCHED REAL IMAGES (USE THESE EXACT URLs — do NOT use source.unsplash.com):
   HERO backgrounds (pick the best one):
${imageSet.hero.map((u, i) => `   - hero_${i + 1}: ${u}`).join("\n")}
   
   PORTRAIT AVATARS for testimonials:
${imageSet.portraits.map((u, i) => `   - portrait_${i + 1}: ${u}`).join("\n")}
   
   FEATURE/MECHANISM images:
${imageSet.features.map((u, i) => `   - feature_${i + 1}: ${u}`).join("\n")}
   
   RESULTS/ACHIEVEMENT images:
${imageSet.results.map((u, i) => `   - result_${i + 1}: ${u}`).join("\n")}
   
   TRUST/TEAM images:
${imageSet.trust.map((u, i) => `   - trust_${i + 1}: ${u}`).join("\n")}
   
   GUARANTEE images:
${imageSet.guarantee.map((u, i) => `   - guarantee_${i + 1}: ${u}`).join("\n")}
   
   BONUS images:
${imageSet.bonus.map((u, i) => `   - bonus_${i + 1}: ${u}`).join("\n")}

   IMPORTANT: Use these EXACT URLs in the HTML. Do NOT modify them. Do NOT use source.unsplash.com.
   Place each image in the most contextually appropriate section.`;
  }

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
${imageBlock}

Generate the premium landing page now. Return ONLY valid JSON.`;
}

// Post-process generated HTML to ensure scroll animations and enhancements
function postProcessHtml(html: string): string {
  // If the HTML already has IntersectionObserver, skip injection
  if (html.includes('IntersectionObserver')) return html;

  const enhancementScript = `
<script>
// Scroll Reveal
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('[data-section]');
  sections.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(40px)'; s.style.transition = 'opacity 0.8s ease, transform 0.8s ease'; });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  sections.forEach(s => obs.observe(s));
  
  // Staggered children
  document.querySelectorAll('[data-section] .card, [data-section] [class*="grid"] > *').forEach((el, i) => {
    el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease ' + (i * 0.1) + 's, transform 0.6s ease ' + (i * 0.1) + 's';
    const co = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; co.unobserve(e.target); } });
    }, { threshold: 0.1 });
    co.observe(el);
  });

  // Animated counters
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

  // Reading progress bar
  const prog = document.createElement('div');
  prog.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:var(--primary,#7c3aed);z-index:99999;transition:width 0.1s linear;width:0';
  document.body.appendChild(prog);
  window.addEventListener('scroll', () => { const p = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100; prog.style.width = p + '%'; });

  // Init Lucide icons if loaded
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
</script>`;

  // Inject before </body>
  if (html.includes('</body>')) {
    return html.replace('</body>', enhancementScript + '\n</body>');
  }
  return html + enhancementScript;
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

      // Extract only the target section HTML using regex
      const sectionRegex = new RegExp(
        `(<(?:section|div|header|footer|main)[^>]*data-section="${sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?)(?=<(?:section|div|header|footer|main)[^>]*data-section="|</body>|</main>|$)`,
        "i"
      );
      const sectionMatch = currentHtml.match(sectionRegex);

      if (!sectionMatch) {
        return new Response(
          JSON.stringify({ error: `Section "${sectionName}" not found in HTML` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const originalSectionHtml = sectionMatch[1].trim();
      console.log(`Editing section "${sectionName}" (${originalSectionHtml.length} chars) with instruction: ${instruction.slice(0, 100)}...`);

      const editPrompt = `Section type: data-section="${sectionName}"

Current section HTML:
\`\`\`html
${originalSectionHtml}
\`\`\`

Instruction: ${instruction}

Modify this section according to the instruction. Return ONLY the modified section element. Return ONLY valid JSON.`;

      const rawContent = await callOpenAI(EDIT_SECTION_PROMPT, editPrompt);
      const jsonStr = parseJsonFromAI(rawContent);

      let newSectionHtml: string;
      try {
        const parsed = JSON.parse(jsonStr);
        newSectionHtml = parsed.section_html || parsed.html;
      } catch {
        // Try extracting section HTML directly
        const sectionExtract = rawContent.match(/<(?:section|div|header|footer|main)[^>]*data-section[\s\S]*$/i);
        if (sectionExtract) {
          newSectionHtml = sectionExtract[0];
        } else {
          throw new Error("Failed to parse edited section HTML");
        }
      }

      if (!newSectionHtml) {
        throw new Error("AI response did not contain section HTML");
      }

      // Splice: replace the original section in the full HTML
      const finalHtml = currentHtml.replace(originalSectionHtml, newSectionHtml.trim());

      return new Response(
        JSON.stringify({
          html: postProcessHtml(finalHtml),
          changes: "Section modified",
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

    // Fetch real images from Unsplash API based on niche
    console.log("Fetching niche-specific images from Unsplash API...");
    const nicheKeywords = extractNicheKeywords(fullCopy, project.name);
    console.log("Detected niche keywords:", nicheKeywords.join(", "));
    const imageSet = await fetchUnsplashImages(nicheKeywords);
    console.log(`Fetched images: hero=${imageSet.hero.length}, portraits=${imageSet.portraits.length}, features=${imageSet.features.length}`);

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
      fullCopy,
      imageSet
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

Brand: { "primary_color": "${primaryColor}", "style": "${style}" ${options.branding?.logoUrl ? `, "logo_url": "${options.branding.logoUrl}"` : ""} ${options.branding?.title ? `, "site_title": "${options.branding.title}"` : ""} }
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

    // Post-process: inject scroll animations, counters, progress bar
    parsed.html = postProcessHtml(parsed.html);

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
