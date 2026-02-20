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

const HTML_SYSTEM_PROMPT = `ROLE
You are "Premium Landing Page Builder", a senior art director + conversion copywriter.
Goal: generate a visually premium, conversion-optimized landing page that looks like a $50k agency build.

OUTPUT (STRICT)
Return ONLY valid JSON:
{
  "file_name": "<slug>-sales.html",
  "html": "<!doctype html>...</html>",
  "sections": ["hero","trust-strip","problems","solution","features","social-proof","pricing","faq","guarantee","final-cta","footer"],
  "polish_report": {
    "design_tokens_used": ["--primary", "--bg-deep", "..."],
    "checks_passed": ["spacing","contrast","mobile","no-inline-style","focus-states","image-alt"],
    "fixes_made": ["..."]
  }
}

CONSTRAINTS (NON-NEGOTIABLE)
1) Single HTML file.
2) Tailwind-only for styling:
   - Include Tailwind via CDN: <script src="https://cdn.tailwindcss.com"></script>
   - NO inline style="" anywhere in the body.
   - NO <style> blocks except ONE small block for CSS variables + keyframes + Google Fonts import.
3) Include Lucide icons CDN + init:
   <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
   Then use: <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
   And init: <script>lucide.createIcons();</script>
4) Every major section MUST have data-section attribute with the exact keys:
   hero | trust-strip | problems | solution | features | social-proof | pricing | faq | guarantee | final-cta | footer
5) Accessibility:
   - Every <img> has descriptive alt
   - Focus states on buttons/links: focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
6) Do not output placeholders like "SEÇÃO:", "TODO", "INSERIR". Rewrite as real copy.

INPUTS
You will receive:
- brand.primary_color (hex)
- brand.style ("dark-premium" or "light-premium")
- locale.language and locale.region_hint
- copy (raw sales copy)
- OPTIONAL: pre_fetched_images object with URLs (hero, portraits, features, results, trust, guarantee, bonus)

DESIGN KIT (FOLLOW EXACTLY)
Use this consistent system everywhere:

A) BASE TOKENS (put in the single <style> block)
- Define :root CSS vars based on brand.style:
  For dark-premium:
    --primary: {brand.primary_color}
    --primary-glow: a lighter tint of primary
    --bg-deep: #050508
    --bg-section: #0a0a12
    --bg-card: rgba(255,255,255,0.03)
    --border: rgba(255,255,255,0.10)
    --text-primary: #f0f0f5
    --text-secondary: #a0a0b2
    --text-muted: #6a6a7a
  For light-premium:
    --primary: {brand.primary_color}
    --primary-glow: a lighter tint of primary
    --bg-deep: #f3f4f6
    --bg-section: #ffffff
    --bg-card: #ffffff
    --border: rgba(0,0,0,0.10)
    --text-primary: #101018
    --text-secondary: #34343f
    --text-muted: #6b7280

- Also define the Tailwind config customization:
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

B) TYPOGRAPHY
- Load Google Fonts (display=swap): Inter (body) + Outfit (headings)
- Body: text-base sm:text-lg leading-relaxed
- Hero headline: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight
- Section title: text-3xl sm:text-4xl font-bold tracking-tight
- Use max widths for readability: max-w-2xl / max-w-3xl

C) LAYOUT RHYTHM (NO EXCEPTIONS)
- Container: max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
- Sections: py-16 sm:py-20
- Cards: rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-sm
- Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8

D) BUTTONS
- Primary CTA:
  rounded-full px-8 py-4 sm:px-10 sm:py-5
  bg-[var(--primary)] text-white font-semibold uppercase tracking-wide
  hover:scale-105 hover:shadow-lg transition
  focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
- Secondary:
  rounded-xl px-6 py-3 border border-[var(--border)] text-[var(--text-primary)]

E) NAVBAR (REQUIRED)
- Fixed top, backdrop blur:
  dark: bg-[var(--bg-deep)]/80 border-b border-[var(--border)]
  light: bg-white/80 border-b border-[var(--border)]
- Desktop links to anchors. Mobile drawer menu with overlay.
- Right side CTA button.

IMAGES (VERY IMPORTANT)
- If pre_fetched_images exist, use ONLY those exact URLs.
- If not provided, use picsum.photos seeds for placeholders and i.pravatar.cc for portraits.
- Enforce consistent aspect ratios:
  hero: background cover with overlay gradient
  feature/result: aspect-[16/9] or aspect-[4/3]
  portraits: aspect-square
- All images have object-cover, rounded-xl/2xl, and loading="lazy" (except hero).

INTERACTIONS (MINIMAL, PREMIUM)
Add ONLY these 4 interactions (avoid over-animation):
1) Scroll reveal via class toggles (NO inline styles):
   - Elements start with opacity-0 translate-y-6
   - On intersect: opacity-100 translate-y-0
   - Use IntersectionObserver toggling Tailwind classes.
2) Animated counters for elements with data-count (count up on view).
3) FAQ accordion (one open at a time) with chevron rotate.
4) Sticky CTA bar:
   - Appears after hero
   - Hide on scroll up, show on scroll down

SECTION STRUCTURE (REQUIRED ORDER)
1) HERO (data-section="hero")
   - Hero image background + overlay gradient
   - Badge pill, headline, subhead, bullet list (3–6), CTA row
   - Mini trust chips under CTAs (icons + short claims)
2) TRUST STRIP (data-section="trust-strip")
   - 3–5 stat blocks with data-count + short labels
3) PROBLEMS (data-section="problems")
   - 6 cards max, each: title + 2–3 lines
4) SOLUTION / MECHANISM (data-section="solution")
   - Split layout: text + image, 3 steps
5) FEATURES (data-section="features")
   - Feature grid (6–9), each with icon + title + description
6) SOCIAL PROOF (data-section="social-proof")
   - Testimonials: 6 cards max, portraits, short quotes, roles
7) PRICING (data-section="pricing")
   - Value stack, anchored price (original struck, current bold)
   - 1 primary plan card + guarantees + CTA
8) FAQ (data-section="faq")
   - 6–10 Q&As
9) GUARANTEE (data-section="guarantee")
   - Shield icon + guarantee copy + bullet list
10) FINAL CTA (data-section="final-cta")
    - Recap + CTA
11) FOOTER (data-section="footer")
    - Links + disclaimers

COPY HANDLING
- Use the provided copy as source of truth.
- If copy is long, keep paragraphs, but format for readability (short paragraphs, bullets).
- Keep language consistent with locale.language.

PREMIUM VISUAL PATTERNS (APPLY)
A) GRADIENT TEXT ON STRATEGIC HEADLINES:
   bg-gradient-to-r from-[var(--primary)] to-[var(--primary-glow)] bg-clip-text text-transparent
   Use sparingly (hero + 1-2 section titles max).

B) BLOB ANIMATIONS IN HERO:
   2-3 decorative blobs as absolutely positioned divs with mix-blend-multiply, blur-xl, opacity-20, animate-blob

C) CATEGORIZED CARD COLORS:
   Feature/problem cards use distinct soft backgrounds per card:
   bg-purple-50, bg-blue-50, bg-green-50, bg-orange-50, bg-pink-50, bg-teal-50

D) SECTION INTRO DECORATOR:
   Every major section uses: icon pill + small caps label + large heading + subtitle

E) FOR WHO / NOT FOR WHO:
   Side-by-side grid: green cards with check-circle, red cards with x-circle

POLISH PASS (MANDATORY BEFORE OUTPUT)
Before returning, scan your own HTML and fix:
- Any section missing py-16 sm:py-20
- Any card missing p-6 sm:p-8, rounded-2xl, border
- Any weak contrast text
- Any missing focus states
- Any missing alt
- Any accidental inline style="" (must be zero)
List fixes in polish_report.fixes_made.

Now generate the complete premium page.`;

const EDIT_SECTION_PROMPT = `You are an elite, award-winning web designer at a $500/hr agency.
You will receive:
1) The full HTML of the ENTIRE landing page (for context — colors, fonts, design system)
2) The HTML of a SINGLE SECTION extracted from that page
3) The name/type of that section
4) An instruction describing what to change

Your job: modify ONLY this section's HTML according to the instruction, while IMPROVING the visual quality.

═══════════════════════════════════════
⚠️ CRITICAL DESIGN RULES
═══════════════════════════════════════

UNDERSTAND THE EXISTING DESIGN SYSTEM:
- Look at the full page HTML to understand the color scheme (CSS custom properties like --primary, --bg-deep, etc.)
- Match fonts, spacing patterns, and visual style of the rest of the page
- Your edit must feel like it belongs to the SAME page — consistent, cohesive

WHEN THE USER SAYS "IMPROVE" OR "MAKE BETTER":
- Add more visual depth: gradients, subtle shadows, layered backgrounds
- Improve typography hierarchy: bigger headlines, better spacing, add badges/pills
- Add micro-interactions: hover effects, transitions, subtle animations via Tailwind
- Improve layout: better use of grid/flex, asymmetric layouts, more whitespace
- Add visual elements: decorative borders, glows, gradient text, icons
- Make CTAs more prominent: larger, bolder, with hover effects and shadows
- NEVER simplify or remove content — always ADD visual richness

STYLING RULES:
- ALL styling via Tailwind utility classes. NO inline style="" attributes.
- If existing section has inline styles, CONVERT them to Tailwind classes.
- Use Tailwind arbitrary values for CSS vars: bg-[var(--primary)], text-[var(--text-primary)], etc.
- Responsive: mobile-first (text-xl sm:text-2xl lg:text-3xl pattern)
- Consistent spacing: py-16 sm:py-20 for sections, p-6 sm:p-8 for cards, gap-6 for grids

TYPOGRAPHY (responsive, NEVER fixed px):
- Hero headlines: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight
- Section titles: text-3xl sm:text-4xl font-bold tracking-tight
- Subheadings: text-lg sm:text-xl text-[var(--text-secondary)]
- Body: text-base sm:text-lg leading-relaxed

IMAGES:
- Use https://picsum.photos/seed/{keyword}/{width}/{height} for generic images
- Use https://i.pravatar.cc/200?img={number} for portrait avatars
- NEVER use source.unsplash.com (it's deprecated and returns 404)
- Every <img> must have descriptive alt attribute and loading="lazy"
- Use object-cover and overflow-hidden on containers

ICONS:
- Use Lucide icons: <i data-lucide="icon-name" class="w-5 h-5"></i>
- Don't forget: the page already has Lucide CDN loaded

INTERACTIVE ELEMENTS:
- Hover effects on cards: hover:-translate-y-1 hover:shadow-xl transition-all duration-300
- Button hovers: hover:scale-105 hover:shadow-lg transition-transform duration-200
- Image hovers: hover:scale-105 on img, overflow-hidden on parent

CONTENT RULES:
- PRESERVE all existing text content — do NOT remove or summarize
- You may ADD content (more bullets, more detail) but never subtract
- Write in the SAME language as the existing section
- Keep the data-section attribute on the root element

BOLT-LEVEL PREMIUM PATTERNS (apply when relevant to the section being edited):
- Gradient text: bg-gradient-to-r from-[var(--primary)] to-[var(--primary-glow)] bg-clip-text text-transparent on key headlines
- Categorized card colors: use distinct bg-purple-50, bg-blue-50, bg-green-50, bg-orange-50 per card (not all same bg-card)
- Navbar: fixed, backdrop-blur-md, with mobile drawer
- Trust bars: numeric stat blocks with data-count for animation
- Pricing: monthly/annual toggle, "Popular" badge, check/x feature list
- For who / Not for who: side-by-side green/red cards with check-circle / x-circle icons
- Blob decorations: absolute positioned blobs with animate-blob class in hero

═══════════════════════════════════════
🧩 21DEV COMPONENT CATALOG (USE AS REFERENCE)
═══════════════════════════════════════
When improving a section, reference these premium patterns adapted from 21dev components.
Use the HTML/Tailwind snippets below as INSPIRATION — adapt colors/content to match the page's design system.

A) SOCIAL-PROOF — Animated Testimonials Layout:
Instead of simple cards, use a split layout with stacked photo + text:
\`\`\`html
<section data-section="social-proof" class="py-16 sm:py-20 bg-[var(--bg-section)]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">...</h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <!-- Photo stack with 3D perspective -->
      <div class="relative h-80 w-full" style="perspective:1000px">
        <img src="..." alt="..." class="absolute inset-0 h-full w-full rounded-3xl object-cover shadow-2xl transition-all duration-500" />
        <!-- Stacked bg cards for depth -->
        <div class="absolute inset-4 -z-10 rounded-3xl bg-[var(--bg-card)] rotate-3 opacity-60"></div>
        <div class="absolute inset-8 -z-20 rounded-3xl bg-[var(--bg-card)] -rotate-3 opacity-30"></div>
      </div>
      <!-- Text side -->
      <div>
        <p class="text-xl sm:text-2xl leading-relaxed text-[var(--text-secondary)] italic mb-6">
          <!-- Animate words: each <span> with staggered opacity via CSS animation-delay -->
          <span class="inline-block opacity-0 animate-[fadeInWord_0.3s_ease_forwards]" style="animation-delay:0.05s">Word1</span>
          <span class="inline-block opacity-0 animate-[fadeInWord_0.3s_ease_forwards]" style="animation-delay:0.1s">Word2</span>
          <!-- ... more words -->
        </p>
        <p class="text-lg font-semibold text-[var(--text-primary)]">Name</p>
        <p class="text-sm text-[var(--text-muted)]">Role / Company</p>
        <!-- Nav arrows -->
        <div class="flex gap-3 mt-6">
          <button class="h-10 w-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors" onclick="prevTestimonial()"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
          <button class="h-10 w-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--primary)] hover:text-white transition-colors" onclick="nextTestimonial()"><i data-lucide="arrow-right" class="w-5 h-5"></i></button>
        </div>
      </div>
    </div>
  </div>
</section>
\`\`\`
CSS keyframes needed: @keyframes fadeInWord { to { opacity: 1; } }
JS: prev/next buttons cycle through testimonials by toggling visibility.

B) FEATURES — Hover Grid with Radial Gradient:
Instead of simple cards, use a bordered grid with mouse-tracking gradient hover:
\`\`\`html
<section data-section="features" class="py-16 sm:py-20 bg-[var(--bg-deep)]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">...</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
      <!-- Each feature cell shares borders -->
      <div class="group relative p-8 border-b border-r border-[var(--border)] hover:bg-[radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(var(--primary-rgb),0.08),transparent_60%)] transition-colors duration-300"
           onmousemove="this.style.setProperty('--mouse-x',((event.clientX-this.getBoundingClientRect().left)/this.offsetWidth*100)+'%');this.style.setProperty('--mouse-y',((event.clientY-this.getBoundingClientRect().top)/this.offsetHeight*100)+'%')">
        <div class="mb-4"><i data-lucide="zap" class="w-6 h-6 text-[var(--primary)]"></i></div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">Feature Title</h3>
        <p class="text-sm text-[var(--text-secondary)] leading-relaxed">Description text</p>
      </div>
      <!-- Repeat for each feature, removing border-r on last column, border-b on last row -->
    </div>
  </div>
</section>
\`\`\`
Grid border rules: items in cols 1-3 get border-r, rows 1-(n-1) get border-b. Last col: no border-r. Last row: no border-b.
Top row items can use gradient from-[var(--bg-section)] via-transparent, bottom row from-transparent via-[var(--bg-section)].

C) ANY CARD — Glowing Border Effect:
Add a conic-gradient glow that follows cursor angle:
\`\`\`html
<div class="glow-card relative rounded-2xl overflow-hidden">
  <!-- Glow layer (behind content) -->
  <div class="absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 glow-border"></div>
  <!-- Card content -->
  <div class="relative bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
    <h3>...</h3><p>...</p>
  </div>
</div>
\`\`\`
CSS for glow-border:
\`\`\`css
.glow-card:hover .glow-border { opacity: 1; }
.glow-border::after {
  content: ''; position: absolute; inset: -1px;
  border: 1px solid transparent; border-radius: inherit;
  background: conic-gradient(from calc(var(--glow-angle,0) * 1deg), #dd7bbb, #d79f1e, #5a922c, #4c7894, #dd7bbb);
  mask: linear-gradient(#0000,#0000) padding-box, linear-gradient(#fff,#fff) border-box;
  mask-composite: intersect;
}
\`\`\`
This creates an elegant rainbow glow that traces the card border on hover.

D) HERO — Typewriter Headline Effect:
\`\`\`html
<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
  <span class="typewriter-text">Your Headline Here</span>
  <span class="typewriter-cursor">|</span>
</h1>
\`\`\`
CSS:
\`\`\`css
.typewriter-text {
  display: inline-block; overflow: hidden; white-space: nowrap;
  border-right: none; /* cursor is separate span */
  animation: typing 3s steps(30) forwards;
  width: 0;
}
@keyframes typing { to { width: 100%; } }
.typewriter-cursor {
  animation: blink 0.75s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }
\`\`\`
Adapt step count to headline length. Use on the MAIN headline only, not subheadlines.

E) PRICING — Monthly/Annual Toggle with Popular Badge:
Instead of static pricing cards, use a toggle switch with animated number transition and a highlighted "Popular" card:
\`\`\`html
<section data-section="pricing" class="py-16 sm:py-20 bg-[var(--bg-section)]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">...</h2>
    <p class="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">...</p>
    <!-- Toggle -->
    <div class="flex items-center justify-center gap-3 mb-12">
      <span class="text-sm font-medium pricing-label-monthly">Monthly</span>
      <button id="pricing-toggle" role="switch" aria-checked="false" class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[var(--muted)] transition-colors" onclick="togglePricing(this)">
        <span class="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform translate-x-0" id="pricing-thumb"></span>
      </button>
      <span class="text-sm font-medium pricing-label-annual">Annual <span class="text-xs text-[var(--primary)]">(Save 20%)</span></span>
    </div>
    <!-- Cards grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <!-- Regular card -->
      <div class="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-left shadow-sm hover:shadow-lg transition-shadow">
        <h3 class="text-lg font-semibold mb-2">Basic</h3>
        <div class="mb-4">
          <span class="text-5xl font-bold pricing-value" data-monthly="19" data-annual="15">$19</span>
          <span class="text-sm text-[var(--text-muted)]">/ month</span>
        </div>
        <p class="text-sm text-[var(--text-secondary)] mb-6">billed monthly</p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-sm"><svg class="w-4 h-4 text-[var(--primary)]" ...><path d="M5 13l4 4L19 7"/></svg> Feature 1</li>
          <!-- more features -->
        </ul>
        <a href="#" class="block w-full text-center py-3 rounded-lg bg-[var(--bg-deep)] text-[var(--text-primary)] font-medium hover:bg-[var(--primary)] hover:text-white transition-colors">Get Started</a>
      </div>
      <!-- Popular card (highlighted) -->
      <div class="relative rounded-2xl border-2 border-[var(--primary)] bg-[var(--bg-card)] p-8 text-left shadow-xl scale-105 z-10">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-semibold flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Popular
        </div>
        <h3 class="text-lg font-semibold mb-2">Pro</h3>
        <div class="mb-4">
          <span class="text-5xl font-bold pricing-value" data-monthly="49" data-annual="39">$49</span>
          <span class="text-sm text-[var(--text-muted)]">/ month</span>
        </div>
        <p class="text-sm text-[var(--text-secondary)] mb-6">billed monthly</p>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-2 text-sm"><svg class="w-4 h-4 text-[var(--primary)]" ...>...</svg> Everything in Basic</li>
          <!-- more features -->
        </ul>
        <a href="#" class="block w-full text-center py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity">Get Started</a>
      </div>
    </div>
  </div>
</section>
\`\`\`
JS for pricing toggle:
\`\`\`js
function togglePricing(btn) {
  const isAnnual = btn.getAttribute('aria-checked') === 'false';
  btn.setAttribute('aria-checked', isAnnual);
  btn.querySelector('span').style.transform = isAnnual ? 'translateX(1.25rem)' : 'translateX(0)';
  btn.style.backgroundColor = isAnnual ? 'var(--primary)' : 'var(--muted)';
  document.querySelectorAll('.pricing-value').forEach(el => {
    const val = isAnnual ? el.dataset.annual : el.dataset.monthly;
    el.textContent = '$' + val;
  });
  document.querySelectorAll('.pricing-label-monthly,.pricing-label-annual').forEach(el => el.style.opacity = '');
}
\`\`\`
Key features: Popular card uses border-2 border-[var(--primary)] + scale-105 + star badge. Toggle animates thumb and swaps prices via data attributes. Confetti effect optional via canvas-confetti CDN.

F) SECTION INTRO DECORATOR — Label + Heading Pattern (inspired by Aros):
Instead of plain section headings, use a decorative intro with icon pill + label + large heading:
\`\`\`html
<section data-section="features" class="py-16 sm:py-20 bg-[var(--bg-section)]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Decorator intro -->
    <div class="flex flex-col items-center text-center mb-12">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-4">
        <i data-lucide="sparkles" class="w-4 h-4 text-[var(--primary)]"></i>
        <span class="text-xs uppercase tracking-widest font-semibold text-[var(--primary)]">Funcionalidades</span>
        <i data-lucide="sparkles" class="w-4 h-4 text-[var(--primary)]"></i>
      </div>
      <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">Section Headline</h2>
      <p class="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Supporting description text</p>
    </div>
    <!-- Section content below -->
  </div>
</section>
\`\`\`
Use this decorator pattern for ALL major sections (features, social-proof, pricing, faq). Vary the label text and icon per section (e.g., "Depoimentos" with message-circle, "Planos" with credit-card, "FAQs" with help-circle).

G) TRUST STRIP — Logo Marquee with Infinite Scroll:
Instead of static logo rows, use an auto-scrolling marquee for partner/trust logos:
\`\`\`html
<section data-section="trust-strip" class="py-8 border-y border-[var(--border)] overflow-hidden bg-[var(--bg-deep)]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <p class="text-xs uppercase tracking-widest font-semibold text-center text-[var(--text-muted)] mb-6">Parceiros & Programas Oficiais</p>
    <div class="relative overflow-hidden">
      <!-- Fade edges -->
      <div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--bg-deep)] to-transparent z-10"></div>
      <div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--bg-deep)] to-transparent z-10"></div>
      <!-- Marquee track -->
      <div class="flex gap-12 items-center animate-marquee">
        <img src="..." alt="Partner 1" class="h-8 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
        <img src="..." alt="Partner 2" class="h-8 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
        <!-- Duplicate the set for seamless loop -->
        <img src="..." alt="Partner 1" class="h-8 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
        <img src="..." alt="Partner 2" class="h-8 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
      </div>
    </div>
  </div>
</section>
\`\`\`
CSS needed: @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 25s linear infinite; }
Duplicate all logos inside the track so the loop is seamless. Use grayscale + hover:grayscale-0 for elegance.

H) FEATURES — Bento Grid Layout (inspired by Aros):
Instead of uniform grids, use an asymmetric bento layout with 1 large card + 2 smaller cards per row:
\`\`\`html
<section data-section="features" class="py-16 sm:py-20 bg-[var(--bg-section)]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Row 1: large card left + small card right -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <div class="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 overflow-hidden relative group hover:border-[var(--primary)]/30 transition-colors">
        <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Feature Title</h3>
        <p class="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">Description text explaining the benefit in detail.</p>
        <img src="..." alt="Feature screenshot" class="rounded-xl w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      </div>
      <div class="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 flex flex-col justify-between hover:border-[var(--primary)]/30 transition-colors">
        <div>
          <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Feature Title</h3>
          <p class="text-sm text-[var(--text-secondary)] leading-relaxed">Description text.</p>
        </div>
        <img src="..." alt="Feature" class="rounded-xl mt-6 w-full object-cover" loading="lazy" />
      </div>
    </div>
    <!-- Row 2: small left + large right (inverted) -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <div class="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 hover:border-[var(--primary)]/30 transition-colors">
        <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Feature Title</h3>
        <p class="text-sm text-[var(--text-secondary)] leading-relaxed">Description text.</p>
        <img src="..." alt="Feature" class="rounded-xl mt-6 w-full object-cover" loading="lazy" />
      </div>
      <div class="lg:col-span-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 overflow-hidden relative group hover:border-[var(--primary)]/30 transition-colors">
        <h3 class="text-xl font-semibold text-[var(--text-primary)] mb-2">Feature Title</h3>
        <p class="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">Full description text.</p>
        <img src="..." alt="Feature screenshot" class="rounded-xl w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      </div>
    </div>
    <!-- Row 3: three equal cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center hover:border-[var(--primary)]/30 transition-colors">
        <div class="inline-flex p-3 rounded-xl bg-[var(--primary)]/10 mb-4"><i data-lucide="zap" class="w-6 h-6 text-[var(--primary)]"></i></div>
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">Feature</h3>
        <p class="text-sm text-[var(--text-secondary)]">Description</p>
      </div>
      <!-- Repeat for 2 more cards -->
    </div>
  </div>
</section>
\`\`\`
The bento layout creates visual hierarchy by mixing large showcase cards (3/5 width with images) and smaller supporting cards (2/5 width). Alternate the large card position between rows for visual rhythm.

USAGE RULES:
- Pick patterns that match the section being edited — don't force all patterns into one section
- Adapt colors to use the page's CSS custom properties (--primary, --bg-card, etc.)
- Keep vanilla JS minimal — just enough for interactivity (carousel, glow tracking)
- These are PREMIUM upgrades — use them when user asks to "improve" or "make better"
- Pattern F (Section Intro Decorator) should be used on EVERY major section for visual consistency
- Pattern G (Logo Marquee) is ideal for trust-strip sections
- Pattern H (Bento Grid) is ideal for features/solution sections with screenshots

═══════════════════════════════════════
MANDATORY SELF-REVIEW BEFORE RETURNING
═══════════════════════════════════════
1) Does the edited section look BETTER than before? If not, add more visual polish.
2) Is spacing consistent with the rest of the page?
3) Are there any inline style="" attributes? Convert to Tailwind.
4) Is typography responsive? No fixed px sizes.
5) Do all images have alt attributes?
6) Does it match the page's color system (CSS vars)?

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
  let result = html;

  // Inject blob animation keyframes if not present
  if (!result.includes('@keyframes blob')) {
    const blobStyles = `
<style>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 7s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
</style>`;
    if (result.includes('</head>')) {
      result = result.replace('</head>', blobStyles + '\n</head>');
    }
  }

  // Inject typewriter keyframes if typewriter pattern detected
  if ((result.includes('typewriter-text') || result.includes('@keyframes typing')) && !result.includes('@keyframes typing')) {
    const typewriterStyles = `
<style>
.typewriter-text {
  display: inline-block; overflow: hidden; white-space: nowrap;
  width: 0; animation: typing 3s steps(30) forwards;
}
@keyframes typing { to { width: 100%; } }
.typewriter-cursor { animation: blink 0.75s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
</style>`;
    if (result.includes('</head>')) {
      result = result.replace('</head>', typewriterStyles + '\n</head>');
    }
  }

  // Inject fadeInWord keyframes if staggered word animation detected
  if (result.includes('fadeInWord') && !result.includes('@keyframes fadeInWord')) {
    const fadeWordStyles = `
<style>
@keyframes fadeInWord { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>`;
    if (result.includes('</head>')) {
      result = result.replace('</head>', fadeWordStyles + '\n</head>');
    }
  }

  // Inject glow card styles if glow pattern detected
  if (result.includes('glow-border') && !result.includes('.glow-border::after')) {
    const glowStyles = `
<style>
.glow-card:hover .glow-border { opacity: 1; }
.glow-border::after {
  content: ''; position: absolute; inset: -1px;
  border: 1px solid transparent; border-radius: inherit;
  background: conic-gradient(from calc(var(--glow-angle,0) * 1deg), #dd7bbb, #d79f1e, #5a922c, #4c7894, #dd7bbb);
  -webkit-mask: linear-gradient(#0000,#0000) padding-box, linear-gradient(#fff,#fff) border-box;
  mask: linear-gradient(#0000,#0000) padding-box, linear-gradient(#fff,#fff) border-box;
  -webkit-mask-composite: xor; mask-composite: intersect;
}
</style>`;
    if (result.includes('</head>')) {
      result = result.replace('</head>', glowStyles + '\n</head>');
    }
  }

  // Inject marquee keyframes if marquee pattern detected
  if (result.includes('animate-marquee') && !result.includes('@keyframes marquee')) {
    const marqueeStyles = `
<style>
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.animate-marquee { animation: marquee 25s linear infinite; display: flex; width: max-content; }
.animate-marquee:hover { animation-play-state: paused; }
</style>`;
    if (result.includes('</head>')) {
      result = result.replace('</head>', marqueeStyles + '\n</head>');
    }
  }

  // If the HTML already has IntersectionObserver, skip script injection
  if (result.includes('IntersectionObserver')) return result;

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

  // Pricing toggle
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

  // Inject before </body>
  if (result.includes('</body>')) {
    return result.replace('</body>', enhancementScript + '\n</body>');
  }
  return result + enhancementScript;
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

async function callLovableAI(systemPrompt: string, userPrompt: string, model = "google/gemini-2.5-pro", maxTokens = 65536): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      throw new Error("Rate limit exceeded. Try again in a moment.");
    }
    if (aiResponse.status === 402) {
      throw new Error("AI credits insufficient.");
    }
    const errText = await aiResponse.text();
    console.error("Lovable AI error:", aiResponse.status, errText);
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
    // ACTION: review-page (peer review agent)
    // ============================================================
    if (action === "review-page") {
      const { currentHtml } = body as { action: string; currentHtml: string };

      if (!currentHtml) {
        return new Response(
          JSON.stringify({ error: "currentHtml is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Review-page: reviewing full page (${currentHtml.length} chars)...`);

      // Extract the <head> block to pass as immutable context
      const headMatch = currentHtml.match(/<head[\s\S]*?<\/head>/i);
      const headBlock = headMatch ? headMatch[0] : "";

      const REVIEW_SYSTEM_PROMPT = `You are a SENIOR ART DIRECTOR & UX AUDITOR performing a SURGICAL POLISH pass on an existing landing page.
Your role is like a senior designer doing a final QA pass before launch — fixing small visual issues without changing the design direction.

═══════════════════════════════════════
⛔ ABSOLUTE PRESERVATION RULES (NEVER VIOLATE)
═══════════════════════════════════════
1. **PRESERVE THE ENTIRE <head> BLOCK CHARACTER-FOR-CHARACTER** — this includes:
   - Tailwind Play CDN script
   - tailwind.config customization script  
   - <style> block with CSS custom properties and @keyframes
   - Google Fonts imports
   - Lucide Icons CDN
   - All meta tags
   Copy the <head> EXACTLY. Do not "clean up", reorganize, or simplify it.

2. **PRESERVE ALL TEXT CONTENT** — zero changes to copy, headlines, bullets, testimonials.

3. **PRESERVE ALL IMAGE URLs** — keep every src exactly as-is. Only exception: replace deprecated "source.unsplash.com" with "picsum.photos/seed/{keyword}/{w}/{h}".

4. **PRESERVE data-section attributes** on every section element.

5. **PRESERVE ALL JAVASCRIPT** at the bottom of the page — scroll observers, FAQ accordion, carousel logic, counters, mobile menu toggles. Copy them exactly.

6. **PRESERVE THE PAGE STRUCTURE** — same sections, same order, same nesting.

═══════════════════════════════════════
🎯 WHAT YOU FIX (SURGICAL — ONLY TAILWIND CLASSES)
═══════════════════════════════════════
You ONLY modify Tailwind utility classes on elements. You never add/remove HTML elements, never change text, never touch scripts or styles.

A) CONTRAST & READABILITY:
   - Text unreadable on its bg? Change the text color class (e.g. text-gray-400 → text-gray-200 on dark, or text-gray-500 → text-gray-800 on light).
   - Use the page's CSS vars when available: text-[var(--text-primary)], text-[var(--text-secondary)].
   - Ensure body text meets WCAG AA 4.5:1 contrast ratio.
   - Headlines on gradient/image bgs: ensure text-white or add a text-shadow via drop-shadow-lg.

B) SPACING STANDARDIZATION:
   - Sections: should use py-16 sm:py-20 consistently. Fix deviations.
   - Cards: p-6 sm:p-8 consistently.
   - Grids: gap-6 or gap-8 consistently within same section.
   - Heading to content gap: mb-4 sm:mb-6 on section titles.
   - Section intro (title block) to content: mb-10 sm:mb-12.

C) HOVER & INTERACTION POLISH:
   - Cards missing hover? Add: hover:-translate-y-1 hover:shadow-xl transition-all duration-300
   - CTA buttons missing hover? Add: hover:scale-105 hover:shadow-lg transition-transform duration-200
   - Cards missing borders? Add: border border-[var(--border)]
   - Images without hover? Add hover:scale-105 on img + overflow-hidden on parent container.

D) RESPONSIVE FIXES:
   - Grids must have breakpoints: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
   - Typography must be responsive: text-2xl sm:text-3xl lg:text-4xl (never fixed px)
   - Fix any overflow issues: add overflow-hidden where images or content might bleed.
   - Buttons: ensure adequate touch targets on mobile (min py-3 px-6).

E) VISUAL CONSISTENCY:
   - Sections should alternate backgrounds (bg-[var(--bg-deep)] / bg-[var(--bg-section)]).
   - Icons should be consistent size within a section.
   - Badges/pills should follow one consistent pattern.
   - Border radius: cards should all use rounded-2xl consistently.
   - Shadows: cards in same section should have same shadow level.

F) INLINE STYLE → TAILWIND:
   - Convert any style="" to Tailwind classes (except those in <style> block or on script elements).
   - e.g. style="margin-top:20px" → mt-5

═══════════════════════════════════════
🚫 WHAT YOU NEVER DO
═══════════════════════════════════════
- Never remove or add HTML elements/sections
- Never change any text content
- Never modify <script> tags or their content
- Never modify the <style> block
- Never modify tailwind.config
- Never change image src URLs (except deprecated source.unsplash.com)
- Never change data-section values
- Never add new CSS classes that require custom definitions
- Never remove existing classes without a clear replacement

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
Return ONLY a JSON object (no markdown, no code fences):
{
  "html": "<!doctype html>...the COMPLETE page with your Tailwind class fixes...",
  "fixes": ["Increased hero subtitle contrast: text-gray-400 → text-gray-200", "Standardized section spacing to py-16 sm:py-20", ...]
}

The "html" MUST be the COMPLETE page starting with <!doctype html> and ending with </html>.
The "fixes" array MUST list every specific class change you made with before/after values.`;

      const reviewPrompt = `IMMUTABLE DESIGN SYSTEM — preserve this <head> block EXACTLY as-is in your output:

---HEAD BLOCK START---
${headBlock}
---HEAD BLOCK END---

Now review the FULL PAGE below. Apply ONLY Tailwind class fixes from your checklist.
Do NOT modify any text, scripts, images, or HTML structure. Only adjust Tailwind utility classes for better contrast, spacing, hover effects, and responsiveness.

FULL PAGE HTML:
${currentHtml}`;

      console.log(`Review-page: calling Gemini 2.5 Pro via Lovable AI (${currentHtml.length} chars)...`);
      const rawContent = await callLovableAI(REVIEW_SYSTEM_PROMPT, reviewPrompt, "google/gemini-2.5-pro", 65536);
      const jsonStr = parseJsonFromAI(rawContent);

      let reviewedHtml: string;
      let fixes: string[] = [];
      try {
        const parsed = JSON.parse(jsonStr);
        reviewedHtml = parsed.html;
        fixes = parsed.fixes || [];
      } catch {
        // Try extracting HTML directly
        const htmlMatch = rawContent.match(/<!doctype html[\s\S]*<\/html>/i);
        if (htmlMatch) {
          reviewedHtml = htmlMatch[0];
        } else {
          throw new Error("Failed to parse reviewed HTML");
        }
      }

      if (!reviewedHtml) {
        throw new Error("AI review did not return HTML");
      }

      // Safety net: if the AI stripped the Tailwind CDN or design system, re-inject the original <head>
      if (headBlock && !reviewedHtml.includes("cdn.tailwindcss.com")) {
        console.warn("Review stripped Tailwind CDN — re-injecting original <head>");
        const reviewedHeadMatch = reviewedHtml.match(/<head[\s\S]*?<\/head>/i);
        if (reviewedHeadMatch) {
          reviewedHtml = reviewedHtml.replace(reviewedHeadMatch[0], headBlock);
        } else {
          reviewedHtml = reviewedHtml.replace(/<html[^>]*>/i, (match) => match + "\n" + headBlock);
        }
      }

      // Safety net 2: ensure all original scripts are present
      const originalScripts = currentHtml.match(/<script(?!.*tailwindcss)(?!.*tailwind\.config)[^>]*>[\s\S]*?<\/script>/gi) || [];
      const reviewedScripts = reviewedHtml.match(/<script(?!.*tailwindcss)(?!.*tailwind\.config)[^>]*>[\s\S]*?<\/script>/gi) || [];
      if (originalScripts.length > reviewedScripts.length) {
        console.warn(`Review lost ${originalScripts.length - reviewedScripts.length} script blocks — re-injecting`);
        // Re-inject missing scripts before </body>
        const missingScripts = originalScripts.filter(s => !reviewedHtml.includes(s.slice(0, 60)));
        if (missingScripts.length > 0) {
          reviewedHtml = reviewedHtml.replace('</body>', missingScripts.join('\n') + '\n</body>');
        }
      }

      console.log("Review complete: " + fixes.length + " fixes applied");

      return new Response(
        JSON.stringify({
          html: postProcessHtml(reviewedHtml),
          fixes,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

      // Extract the <style> block and tailwind config for context
      const styleMatch = currentHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const tailwindConfigMatch = currentHtml.match(/<script>\s*tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*<\/script>/i);
      const designContext = [
        styleMatch ? `Design System (CSS vars):\n${styleMatch[1].trim()}` : "",
        tailwindConfigMatch ? `Tailwind Config:\n${tailwindConfigMatch[1].trim()}` : "",
      ].filter(Boolean).join("\n\n");

      const editPrompt = `Section type: data-section="${sectionName}"

${designContext ? `═══ PAGE DESIGN CONTEXT ═══\n${designContext}\n` : ""}
═══ CURRENT SECTION HTML ═══
\`\`\`html
${originalSectionHtml}
\`\`\`

═══ USER INSTRUCTION ═══
${instruction}

Modify this section according to the instruction. The result must look PREMIUM and PROFESSIONAL — like a $50,000 agency page.
Return ONLY valid JSON with "section_html" and "changes" keys.`;

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
    console.log("Calling Lovable AI (Gemini 2.5 Pro) to generate landing page (format: html)...");
    const rawContent = await callLovableAI(HTML_SYSTEM_PROMPT, userPrompt, "google/gemini-2.5-pro", 65536);
    const jsonStr = parseJsonFromAI(rawContent);

    let parsed: { file_name?: string; html: string; sections?: string[]; notes?: Record<string, unknown>; polish_report?: Record<string, unknown> };
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
        generated_assets: parsed.polish_report || parsed.notes || {},
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
