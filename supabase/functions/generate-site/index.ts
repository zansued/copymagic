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

const HTML_SYSTEM_PROMPT = `You are an elite, award-winning web designer at a $500/hr agency.
Your job: generate a VISUALLY BREATHTAKING, modern, premium landing page as a single HTML file.
THE PAGE MUST LOOK LIKE A $50,000 AGENCY-BUILT PAGE. Not a template. PREMIUM CRAFT.

═══════════════════════════════════════
SECTION MARKERS (REQUIRED)
═══════════════════════════════════════
Every major section MUST have a data-section attribute:
data-section="hero" | "trust-strip" | "problems" | "solution" | "features" | "social-proof" | "pricing" | "faq" | "guarantee" | "final-cta" | "footer"
Example: <section data-section="hero" class="...">

═══════════════════════════════════════
🖼️ IMAGES (CRITICAL — THIS MAKES THE PAGE REAL)
═══════════════════════════════════════
Use REAL images from Unsplash via direct URL. This is what separates amateur from professional.

Pattern: https://images.unsplash.com/photo-{ID}?w={width}&h={height}&fit=crop&q=80

REQUIRED image placements:
- HERO: Full-width background or side image. Use abstract/tech/lifestyle depending on niche.
  Example: <div style="background-image: url('https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&h=1080&fit=crop&q=80')">
- TESTIMONIALS: Avatar photos for each testimonial (use portrait photos).
  Example: <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80" class="rounded-full w-12 h-12">
- FEATURES/MECHANISM: Relevant contextual images, screenshots, or abstract visuals.
- ABOUT/TRUST: Team photos, office, or professional environment images.
- GUARANTEE: Shield/trust imagery.

Image selection rules:
- Search Unsplash mentally for the BEST match to the product/niche described in the copy
- Use high-quality professional photos, NOT stock-looking generic ones
- Vary the photo IDs — never repeat the same image
- Always include w, h, fit=crop, q=80 params for performance
- Use object-fit: cover for background images
- Add subtle overlay gradients on hero images for text readability

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
  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80" 
       alt="Avatar" style="width: 65px; height: 65px; border-radius: 50%; border: 2px solid var(--primary); display: block; margin: 0 auto;">
  <p style="font-size: 14px; padding: 0 10px; color: var(--text-secondary);">Full testimonial text here...</p>
  <img src="https://images.unsplash.com/photo-XXXXX?w=400&h=300&fit=crop&q=80" alt="Results" style="width: 100%;">
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
- Use real images from Unsplash (https://images.unsplash.com/photo-{ID}?w={width}&h={height}&fit=crop&q=80)
- Use Lucide icons (<i data-lucide="icon-name">) if icons are needed
- Maintain all interactive JS (scroll animations, counters, carousel, etc.)

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
          html: postProcessHtml(parsed.html),
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
