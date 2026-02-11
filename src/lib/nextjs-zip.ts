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
  "tailwind.config.ts": ({ primaryColor }) =>
    `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "${primaryColor}",
      },
    },
  },
  plugins: [],
};

export default config;
`,
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
  "app/globals.css": () =>
    `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  "README.md": ({ projectName }) =>
    `# ${projectName}

Landing page gerada por **CopyMagic**.

## Como rodar

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploy

Faça deploy na [Vercel](https://vercel.com) com um clique:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
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
