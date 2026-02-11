import JSZip from "jszip";
import { saveAs } from "file-saver";

interface NextJsProjectOptions {
  pageTsx: string;
  globalsCss: string;
  projectName: string;
  primaryColor?: string;
}

export async function downloadNextJsZip({
  pageTsx,
  globalsCss,
  projectName,
  primaryColor = "#7c3aed",
}: NextJsProjectOptions) {
  const zip = new JSZip();

  const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  // package.json
  zip.file(
    "package.json",
    JSON.stringify(
      {
        name: safeName,
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
        },
        dependencies: {
          next: "^15.1.0",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
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
    )
  );

  // tailwind.config.ts
  zip.file(
    "tailwind.config.ts",
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
`
  );

  // postcss.config.js
  zip.file(
    "postcss.config.js",
    `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`
  );

  // tsconfig.json
  zip.file(
    "tsconfig.json",
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
    )
  );

  // next.config.js
  zip.file(
    "next.config.js",
    `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`
  );

  // app/globals.css
  zip.file("app/globals.css", globalsCss);

  // app/layout.tsx
  zip.file(
    "app/layout.tsx",
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
`
  );

  // app/page.tsx
  zip.file("app/page.tsx", pageTsx);

  // README.md
  zip.file(
    "README.md",
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

Ou use qualquer plataforma compatível com Next.js (Netlify, Railway, etc.).
`
  );

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${safeName}-nextjs.zip`);
}
