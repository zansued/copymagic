import JSZip from "jszip";
import { saveAs } from "file-saver";

interface NextJsFile {
  path: string;
  content: string;
}

interface NextJsProjectOptions {
  files: NextJsFile[];
  projectName: string;
  primaryColor?: string;
}

// Boilerplate files that are always needed but the AI might not generate
const BOILERPLATE: Record<string, (opts: { projectName: string; primaryColor: string }) => string> = {
  "package.json": ({ projectName, primaryColor }) =>
    JSON.stringify(
      {
        name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
        version: "1.0.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: {
          next: "^15.1.0",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "lucide-react": "^0.462.0",
        },
        devDependencies: {
          "@types/node": "^22.0.0",
          "@types/react": "^19.0.0",
          typescript: "^5.7.0",
          tailwindcss: "^3.4.0",
          postcss: "^8.4.0",
          autoprefixer: "^10.4.0",
        },
      },
      null,
      2
    ),
  "tailwind.config.ts": ({ primaryColor }) => {
    // Convert hex to HSL-ish for Tailwind, but keep hex for simplicity
    return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "${primaryColor}",
          light: "color-mix(in srgb, ${primaryColor} 70%, white)",
          dark: "color-mix(in srgb, ${primaryColor} 70%, black)",
        },
        "bg-deep": "var(--bg-deep)",
        "bg-section": "var(--bg-section)",
        "bg-card": "var(--bg-card)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",
      },
      maxWidth: {
        "6xl": "72rem",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
`;
  },
  "postcss.config.js": () =>
    `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
  "tsconfig.json": () =>
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
        exclude: ["node_modules"],
      },
      null,
      2
    ),
  "next.config.js": () =>
    `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`,
  "app/layout.tsx": ({ projectName }) =>
    `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Landing page gerada por CopyMagic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`,
  "app/globals.css": ({ primaryColor }) =>
    `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${primaryColor};
  --primary-glow: color-mix(in srgb, ${primaryColor} 70%, white);
  --bg-deep: #EBEDF0;
  --bg-section: #FFFFFF;
  --bg-section-alt: #F8F8F8;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F0F0F5;
  --border: rgba(0, 0, 0, 0.08);
  --border-hover: rgba(0, 0, 0, 0.15);
  --text-primary: #1a1a2e;
  --text-secondary: #393939;
  --text-muted: #9F9F9F;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-deep: #050508;
    --bg-section: #0a0a12;
    --bg-card: rgba(255, 255, 255, 0.03);
    --bg-card-hover: rgba(255, 255, 255, 0.06);
    --border: rgba(255, 255, 255, 0.08);
    --border-hover: rgba(255, 255, 255, 0.15);
    --text-primary: #f0f0f5;
    --text-secondary: #8a8a9a;
    --text-muted: #5a5a6a;
  }
}

/* Scroll reveal animation */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--bg-deep);
  color: var(--text-primary);
}
`,
  "README.md": ({ projectName }) =>
    `# ${projectName}

Landing page premium gerada por **CopyEngine**.

## Como rodar

\`\`\`bash
npm install
npm run dev
\`\`\`

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

- \`app/page.tsx\` — página principal com todas as seções
- \`components/\` — componentes reutilizáveis (Hero, BentoGrid, FAQ, etc.)
- \`lib/pageSpec.ts\` — tipos TypeScript do PageSpec

## Deploy

Faça deploy na [Vercel](https://vercel.com) com um clique:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
`,
  "lib/pageSpec.ts": () =>
    `// PageSpec types for CopyEngine Landing Builder

export interface PageSpecHero {
  headline: string;
  subheadline: string;
  bullets: string[];
  ctaPrimary: string;
  ctaSecondary?: string;
  microcopy?: string;
  trustItems?: string[];
}

export interface PageSpecProof {
  stats: Array<{ value: string; label: string }>;
  logos: string[];
}

export interface PageSpecProblemItem {
  title: string;
  description: string;
  falseSolution?: string;
  truth?: string;
}

export interface PageSpecStep {
  title: string;
  description: string;
}

export interface PageSpecSolution {
  title: string;
  description: string;
  steps: PageSpecStep[];
  differentiators?: Array<{ title: string; description: string }>;
}

export interface PageSpecTestimonial {
  name: string;
  role: string;
  text: string;
}

export interface PageSpecBonus {
  title: string;
  description: string;
  value?: string;
}

export interface PageSpecOffer {
  title: string;
  includes: string[];
  price?: string;
  originalPrice?: string;
  urgency?: string;
}

export interface PageSpecForWho {
  for: string[];
  notFor: string[];
}

export interface PageSpecFAQ {
  question: string;
  answer: string;
}

export interface PageSpecGuarantee {
  title: string;
  days: number;
  description: string;
  bullets?: string[];
}

export interface PageSpecFinalCta {
  headline: string;
  description: string;
  ctaText: string;
}

export interface PageSpec {
  meta: { language: string; detectedNiche?: string };
  hero: PageSpecHero;
  proof: PageSpecProof;
  problem: { title: string; items: PageSpecProblemItem[] };
  solution: PageSpecSolution;
  phases?: Array<{ title: string; description: string; outcome: string }>;
  testimonials: PageSpecTestimonial[];
  offer: PageSpecOffer;
  bonuses: PageSpecBonus[];
  forWho: PageSpecForWho;
  guarantee: PageSpecGuarantee;
  faq: PageSpecFAQ[];
  finalCta: PageSpecFinalCta;
  footer?: { disclaimers: string[]; links: string[] };
}
`,
};

export async function downloadNextJsZip({ files, projectName, primaryColor = "#7c3aed" }: NextJsProjectOptions) {
  const zip = new JSZip();
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const opts = { projectName, primaryColor };

  // Add AI-generated files
  const aiPaths = new Set<string>();
  for (const file of files) {
    zip.file(file.path, file.content);
    aiPaths.add(file.path);
  }

  // Fill in boilerplate for any missing files
  for (const [path, generator] of Object.entries(BOILERPLATE)) {
    if (!aiPaths.has(path)) {
      zip.file(path, generator(opts));
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${safeName}-nextjs.zip`);
}
