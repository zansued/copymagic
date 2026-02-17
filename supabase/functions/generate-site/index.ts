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
⚠️ STYLING MODE — MANDATORY RULES
═══════════════════════════════════════
You MUST use **Tailwind-only mode**:
- Include Tailwind via Play CDN: <script src="https://cdn.tailwindcss.com"></script>
- ALL styling through Tailwind utility classes. NO inline style="" attributes. NO <style> blocks (except a small block for CSS custom properties, @keyframes, and Google Fonts @import).
- NEVER mix Tailwind classes with inline styles. Pick Tailwind and commit 100%.
- You may define CSS custom properties (--primary, etc.) and @keyframes in a single <style> block at the top, but ALL layout/spacing/color/typography MUST use Tailwind classes referencing those vars where needed.
- Use Tailwind's arbitrary value syntax when needed: bg-[var(--primary)], text-[var(--text-primary)], etc.

Tailwind config customization (inside the Play CDN script):
\`\`\`html
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-glow': 'var(--primary-glow)',
        'bg-deep': 'var(--bg-deep)',
        'bg-section': 'var(--bg-section)',
        'bg-card': 'var(--bg-card)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      }
    }
  }
}
</script>
\`\`\`

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
Example: <section data-section="hero" class="py-16 sm:py-20">

═══════════════════════════════════════
🖼️ IMAGES (CRITICAL — THIS MAKES THE PAGE REAL)
═══════════════════════════════════════
PRIORITY: If pre-fetched image URLs are provided in the user prompt (section 7), use THOSE EXACT URLs.
They are high-quality, niche-specific images from the Unsplash API — already optimized and curated.

FALLBACK (only if no pre-fetched images are provided):
Use https://picsum.photos/seed/{keyword}/{width}/{height} for generic placeholders, or https://i.pravatar.cc/200?img={number} for portrait avatars.

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
- Use object-fit: cover via Tailwind: class="object-cover"
- Add overlay gradients on hero images via an absolutely positioned div with bg-gradient-to-b
- loading="lazy" on all images except hero
- Always include a descriptive alt="" attribute on every <img>
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
   - Use IntersectionObserver + Tailwind transition classes

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
   - Subtle floating glow orbs in hero (CSS @keyframes in the allowed <style> block)
   - Parallax effect on decorative elements

7) HOVER EFFECTS (all via Tailwind):
   - Cards: hover:-translate-y-2 hover:shadow-xl hover:border-[var(--primary)]/30 transition-all duration-300
   - Buttons: hover:scale-105 hover:shadow-lg transition-transform duration-200
   - Images: hover:scale-105 transition-transform duration-300 overflow-hidden on parent
   - Links: underline animation via pseudo-elements in @keyframes

8) PROGRESS BAR:
   - Reading progress bar at top of page
   - Thin line that fills as user scrolls

═══════════════════════════════════════
📐 PREMIUM LAYOUT SYSTEM (MANDATORY)
═══════════════════════════════════════
These layout patterns are REQUIRED. Follow them exactly:

CONTAINER: max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
SECTIONS: py-16 sm:py-20 (consistent vertical rhythm)
CARDS: rounded-2xl border border-[var(--border)] p-6 (single consistent pattern)
GRID: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

RESPONSIVE TYPOGRAPHY (no fixed px sizes for headings!):
- Hero headline: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight
- Section titles: text-3xl sm:text-4xl font-bold tracking-tight
- Subheadings: text-lg sm:text-xl text-[var(--text-secondary)]
- Body: text-base sm:text-lg leading-relaxed
- Labels/badges: text-xs uppercase tracking-widest font-semibold

BUTTONS:
- Primary CTA: px-8 py-4 sm:px-10 sm:py-5 rounded-full text-base sm:text-lg font-semibold uppercase tracking-wide bg-[var(--primary)] text-white hover:scale-105 transition-transform duration-200 shadow-lg
- Secondary: px-6 py-3 rounded-xl border border-[var(--border)] text-sm font-medium

SPACING RULES:
- Between sections: py-16 sm:py-20 (never less)
- Card internal: p-6 sm:p-8
- Between heading and content: mb-4 sm:mb-6
- Between cards in grid: gap-6 sm:gap-8

═══════════════════════════════════════
🎨 VISUAL DESIGN SYSTEM
═══════════════════════════════════════
TYPOGRAPHY:
- Load from Google Fonts: Inter (body) + Space Grotesk or Outfit (headings)
  For light/editorial themes: Poppins (body+headings) is also excellent.
- Use the responsive classes defined above. NEVER use fixed px font sizes like font-size:70px.

COLOR SYSTEM (CSS custom properties — defined in the single <style> block):
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
}

SURFACES & CARDS (via Tailwind classes):
- Dark: backdrop-blur-xl saturate-150 border border-[var(--border)] shadow-lg
- Light: bg-white rounded-2xl shadow-md border border-[var(--border)]
- Hover: hover:shadow-xl hover:border-[var(--primary)]/20 transition-all duration-300

═══════════════════════════════════════
♿ ACCESSIBILITY (REQUIRED)
═══════════════════════════════════════
- Every <img> MUST have a descriptive alt attribute
- Color contrast: text must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Buttons and links must have visible focus states: focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
- Interactive elements must be keyboard accessible
- Use semantic HTML: <header>, <main>, <section>, <nav>, <footer>

═══════════════════════════════════════
📐 SECTION BLUEPRINT
═══════════════════════════════════════
Generate sections in this order with these design patterns:

A) HERO (data-section="hero")
   - Full viewport or generous padding: min-h-screen or py-20 sm:py-32
   - Badge/pill at top: inline-flex px-4 py-1.5 rounded-full text-xs uppercase tracking-widest
   - Massive headline: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight
   - Subheadline: text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto
   - CTA button: rounded-full, accent color, uppercase
   - Trust strip below: flex items-center gap-4

B) TRUST STRIP (data-section="trust-strip")
   - Logos or trust badges in a flex row with gap-8
   - py-8 border-y border-[var(--border)]

C) PROBLEMS (data-section="problems")
   - max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20
   - Card grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
   - Each card: rounded-2xl border p-6

D) SOLUTION/MECHANISM (data-section="solution")
   - grid grid-cols-1 lg:grid-cols-2 gap-8 items-center
   - Image on one side, text on the other

E) FEATURES/BENEFITS (data-section="features")
   - grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
   - Each card with icon + title + description

F) SOCIAL PROOF (data-section="social-proof")
   - grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
   - Each card: rounded-2xl avatar (w-16 h-16 rounded-full object-cover border-2 border-[var(--primary)]) + quote + name

G) PRICING/OFFER (data-section="pricing")
   - Centered layout, max-w-3xl mx-auto
   - Price anchoring: line-through on original + bold current price
   - CTA button prominent

H) GUARANTEE (data-section="guarantee")
   - grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center
   - Shield/badge image + guarantee text

I) FAQ (data-section="faq")
   - max-w-3xl mx-auto, accordion pattern
   - Each item: border-b, cursor-pointer, transition

J) FINAL CTA (data-section="final-cta")
   - Centered, py-16 sm:py-20
   - Large CTA with pulse animation

K) FOOTER (data-section="footer")
   - bg-[var(--primary)] text-white py-8
   - grid grid-cols-1 md:grid-cols-2 gap-6

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
- Single HTML file. Tailwind via Play CDN. Minimal <style> block only for CSS vars and @keyframes.
- Google Fonts with display=swap
- Viewport meta tag, charset UTF-8
- CSS custom properties for colors (defined in <style>), applied via Tailwind arbitrary values
- Responsive: mobile-first
- Lazy loading on images: loading="lazy" (except hero)
- Semantic HTML: <header>, <main>, <section>, <footer>
- All JS at bottom of <body>

═══════════════════════════════════════
🔍 MANDATORY CRITIQUE PASS
═══════════════════════════════════════
After generating the full page, you MUST perform a self-review and fix these issues BEFORE returning the output:

1) SPACING CONSISTENCY: Are all sections using py-16 sm:py-20? Are cards using consistent p-6? Fix any inconsistency.
2) CONTRAST CHECK: Is body text readable against its background? Are CTAs clearly visible? Fix weak contrast.
3) ALIGNMENT: Are elements properly aligned in grids? Any orphaned elements? Fix misalignment.
4) MOBILE RESPONSIVENESS: Will the layout break on 375px screens? Are font sizes responsive (text-4xl sm:text-5xl, not fixed px)? Fix any breakage.
5) TEXT BREATHING: Is there enough whitespace between paragraphs, headings, and sections? Add spacing if text feels cramped.
6) INLINE STYLE CHECK: Search for any style="" attributes. If found, convert to Tailwind classes. Zero tolerance.
7) IMAGE ALT CHECK: Every <img> must have a descriptive alt. Fix any missing ones.
8) FOCUS STATES: Interactive elements must have focus:ring styles. Add if missing.

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
Return ONLY a JSON object (no markdown fences) with:
{
  "file_name": "<project-name>-<page_type>.html",
  "html": "<!doctype html>...full premium HTML here...",
  "sections": ["hero", "trust-strip", "problems", ...],
  "notes": { "sections": [...], "locale_touches": [...], "images_used": [...], "critique_fixes": [...] }
}

The "critique_fixes" array must list what you found and fixed during the critique pass.

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
- ALL styling via Tailwind utility classes. NO inline style="" attributes.
- If the existing section uses inline styles, convert them to Tailwind classes.
- Every <img> must have a descriptive alt attribute.
- Use responsive typography: text-4xl sm:text-5xl, NOT fixed px sizes.
- Maintain consistent spacing: py-16 sm:py-20 for sections, p-6 for cards, gap-6 for grids.

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

═══════════════════════════════════════
⚠️ STYLING MODE — TAILWIND-ONLY (MANDATORY)
═══════════════════════════════════════
- ALL styling MUST use Tailwind utility classes. NO inline style="" attributes anywhere.
- The only allowed <style> content is inside globals.css for CSS custom properties (:root vars) and @keyframes.
- NEVER mix Tailwind with inline styles. Zero tolerance.
- Use Tailwind's arbitrary value syntax for CSS vars: bg-[var(--primary)], text-[var(--text-primary)], etc.
- If you need a color not in the Tailwind config, use arbitrary values: bg-[#1a1a2e], NOT style="background:#1a1a2e".

═══════════════════════════════════════
📐 PREMIUM LAYOUT SYSTEM (MANDATORY)
═══════════════════════════════════════
CONTAINER: max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
SECTIONS: py-16 sm:py-20 (consistent vertical rhythm for ALL sections)
CARDS: rounded-2xl border border-border p-6 sm:p-8 (single consistent pattern)
GRID: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8

RESPONSIVE TYPOGRAPHY (no fixed px sizes!):
- Hero headline: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight
- Section titles: text-3xl sm:text-4xl font-bold tracking-tight
- Subheadings: text-lg sm:text-xl text-secondary
- Body: text-base sm:text-lg leading-relaxed
- Labels/badges: text-xs uppercase tracking-widest font-semibold

BUTTONS:
- Primary CTA: px-8 py-4 sm:px-10 sm:py-5 rounded-full text-base sm:text-lg font-semibold uppercase tracking-wide bg-brand text-white hover:scale-105 transition-transform duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
- Secondary: px-6 py-3 rounded-xl border text-sm font-medium

═══════════════════════════════════════
♿ ACCESSIBILITY (REQUIRED)
═══════════════════════════════════════
- Every <img> MUST have a descriptive alt attribute
- Color contrast: WCAG AA minimum (4.5:1 body, 3:1 large text)
- Buttons/links: visible focus states with focus:ring-2
- Semantic HTML: <header>, <main>, <section>, <nav>, <footer>

═══════════════════════════════════════
RULES
═══════════════════════════════════════
1) Use ALL text from the PageSpec as-is. Every paragraph, bullet, testimonial must appear.
2) Strip any remaining internal labels but preserve actual content.
3) Performance-first: Server Components by default. Only add "use client" for interactive elements (accordion, carousel, sticky CTA).
4) CSS animations preferred over JS animations. Use Tailwind's animate-* or @keyframes in globals.css.
5) Compliance: include footer disclaimers from PageSpec.
6) Cultural modeling: write in the locale language.
7) Use lucide-react for icons (already in dependencies).
8) Images: use <Image> from next/image with proper alt, width, height. Use priority on hero image.

REQUIRED SECTIONS (IN THIS ORDER):
A) Hero - gradient background, headline + subhead + bullets + trust strip + CTA
B) Problems + False Solutions - card grid
C) Mechanism / The Big Idea - steps + differentiators
D) Phases Protocol - visual timeline (desktop: horizontal, mobile: vertical)
E) Social Proof - testimonials (carousel or grid)
F) Bonuses - gradient cards + value stack
G) Offer + Pricing - checklist + price block + for who / not for who
H) Guarantee - highlighted card + CTA
I) FAQ - accessible accordion ("use client" component)
J) Final CTA - recap + CTA
K) Footer - links + disclaimers + copyright

FILES TO GENERATE:
- package.json, next.config.js, tsconfig.json, tailwind.config.ts, postcss.config.js
- app/layout.tsx, app/page.tsx, app/globals.css
- components/: Hero, ProblemsTruth, Mechanism, PhasesTimeline, TestimonialsCarousel, BonusesValue, OfferBlock, Guarantee, FAQAccordion, FinalCTA, Footer, StickyCTA
- lib/: types.ts

═══════════════════════════════════════
🔍 MANDATORY CRITIQUE PASS
═══════════════════════════════════════
Before returning, self-review and fix:
1) SPACING: All sections py-16 sm:py-20? Cards p-6? Fix inconsistencies.
2) CONTRAST: Text readable? CTAs visible? Fix weak contrast.
3) ALIGNMENT: Grids aligned? No orphaned elements? Fix misalignment.
4) MOBILE: Works on 375px? Font sizes responsive? Fix breakage.
5) INLINE STYLES: Any style=""? Convert to Tailwind. Zero tolerance.
6) IMAGE ALT: Every <img>/<Image> has descriptive alt? Fix missing.
7) FOCUS STATES: Interactive elements have focus:ring? Add if missing.

OUTPUT FORMAT (ONLY JSON):
{
  "project_name": "<slugged-name>",
  "files": [{ "path": "package.json", "content": "..." }, ...],
  "notes": {
    "sections": [...],
    "conversion_checks": [...],
    "performance": [...],
    "critique_fixes": [...]
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
    console.warn("UNSPLASH_ACCESS_KEY not set, using placeholder images");
    return buildFallbackImageSet(nicheKeywords);
  }

  const imageSet: FetchedImageSet = {
    hero: [], portraits: [], features: [], results: [],
    trust: [], guarantee: [], bonus: [],
  };

  const nicheQuery = nicheKeywords.slice(0, 3).join(" ");
  
  // Use /search/photos instead of /photos/random — more reliable and same rate limits
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

    console.log(`Unsplash niche response: ${nicheRes.status}, portrait response: ${portraitRes.status}`);

    if (nicheRes.ok) {
      const nicheData = await nicheRes.json();
      const nichePhotos = (nicheData.results || []) as UnsplashPhoto[];
      const toUrl = (p: UnsplashPhoto, w: number, h: number) =>
        `${p.urls.raw}&w=${w}&h=${h}&fit=crop&auto=format,compress&q=80`;

      imageSet.hero = nichePhotos.slice(0, 3).map(p => toUrl(p, 1920, 1080));
      imageSet.features = nichePhotos.slice(3, 7).map(p => toUrl(p, 800, 600));
      imageSet.results = nichePhotos.slice(7, 10).map(p => toUrl(p, 800, 600));
      imageSet.trust = nichePhotos.slice(10, 12).map(p => toUrl(p, 800, 400));
      imageSet.guarantee = nichePhotos.slice(12, 13).map(p => toUrl(p, 400, 400));
      imageSet.bonus = nichePhotos.slice(13, 15).map(p => toUrl(p, 500, 300));
      console.log(`Unsplash: got ${nichePhotos.length} niche photos`);
    } else {
      const errBody = await nicheRes.text();
      console.error(`Unsplash niche fetch error: ${nicheRes.status} - ${errBody}`);
    }

    if (portraitRes.ok) {
      const portraitData = await portraitRes.json();
      const portraitPhotos = (portraitData.results || []) as UnsplashPhoto[];
      imageSet.portraits = portraitPhotos.map(p =>
        `${p.urls.raw}&w=200&h=200&fit=crop&crop=face&auto=format,compress&q=80`
      );
      console.log(`Unsplash: got ${portraitPhotos.length} portrait photos`);
    } else {
      const errBody = await portraitRes.text();
      console.error(`Unsplash portrait fetch error: ${portraitRes.status} - ${errBody}`);
    }
  } catch (err) {
    console.error("Unsplash API fetch failed, using fallback:", err);
    return buildFallbackImageSet(nicheKeywords);
  }

  // If we got no hero images, use fallback
  if (imageSet.hero.length === 0) {
    return buildFallbackImageSet(nicheKeywords);
  }

  return imageSet;
}

function buildFallbackImageSet(keywords: string[]): FetchedImageSet {
  // Use picsum.photos as fallback — reliable and no auth required
  return {
    hero: [
      "https://picsum.photos/seed/hero1/1920/1080",
      "https://picsum.photos/seed/hero2/1920/1080",
      "https://picsum.photos/seed/hero3/1920/1080",
    ],
    portraits: [
      "https://i.pravatar.cc/200?img=1",
      "https://i.pravatar.cc/200?img=5",
      "https://i.pravatar.cc/200?img=8",
      "https://i.pravatar.cc/200?img=12",
      "https://i.pravatar.cc/200?img=15",
      "https://i.pravatar.cc/200?img=20",
    ],
    features: [
      "https://picsum.photos/seed/feat1/800/600",
      "https://picsum.photos/seed/feat2/800/600",
      "https://picsum.photos/seed/feat3/800/600",
      "https://picsum.photos/seed/feat4/800/600",
    ],
    results: [
      "https://picsum.photos/seed/result1/800/600",
      "https://picsum.photos/seed/result2/800/600",
      "https://picsum.photos/seed/result3/800/600",
    ],
    trust: [
      "https://picsum.photos/seed/trust1/800/400",
      "https://picsum.photos/seed/trust2/800/400",
    ],
    guarantee: ["https://picsum.photos/seed/guarantee/400/400"],
    bonus: [
      "https://picsum.photos/seed/bonus1/500/300",
      "https://picsum.photos/seed/bonus2/500/300",
    ],
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
