import { motion } from "motion/react";
import { Eye, Loader2, FileArchive, Globe, Code2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadNextJsZip } from "@/lib/nextjs-zip";

interface ExportButtonsProps {
  generating: boolean;
  selectedProject: string;
  selectedProjectName: string;
  generatedHtml: string | null;
  templateKey: string;
  language: string;
  includeUpsells: boolean;
  brandingTitle: string;
  brandingLogo: string;
  brandingColor: string;
  onGenerate: () => void;
}

export function ExportButtons({
  generating,
  selectedProject,
  selectedProjectName,
  generatedHtml,
  templateKey,
  language,
  includeUpsells,
  brandingTitle,
  brandingLogo,
  brandingColor,
  onGenerate,
}: ExportButtonsProps) {
  const [generatingNextjs, setGeneratingNextjs] = useState(false);

  const handleDownloadZip = useCallback(async () => {
    if (!generatedHtml) return;
    const zip = new JSZip();
    zip.file("index.html", generatedHtml);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `landing-${templateKey}.zip`);
    toast.success("ZIP baixado!");
  }, [generatedHtml, templateKey]);

  const handleDownloadNextjs = useCallback(async () => {
    if (!selectedProject) {
      toast.error("Selecione um projeto primeiro");
      return;
    }

    setGeneratingNextjs(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-site`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            projectId: selectedProject,
            templateKey,
            format: "nextjs",
            options: {
              includeUpsells,
              language,
              branding: {
                title: brandingTitle || undefined,
                logoUrl: brandingLogo || undefined,
                primaryColor: brandingColor || undefined,
              },
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao gerar projeto Next.js");
      }

      const result = await res.json();

      await downloadNextJsZip({
        pageTsx: result.page_tsx,
        globalsCss: result.globals_css,
        projectName: selectedProjectName || "landing-page",
        primaryColor: brandingColor || "#7c3aed",
      });

      toast.success("Projeto Next.js baixado!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setGeneratingNextjs(false);
    }
  }, [selectedProject, selectedProjectName, templateKey, includeUpsells, language, brandingTitle, brandingLogo, brandingColor]);

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGenerate}
        disabled={generating || !selectedProject}
        className="premium-button w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {generating ? "Gerando..." : "Gerar Preview"}
      </motion.button>

      {generatedHtml && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownloadZip}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-secondary text-foreground flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
        >
          <FileArchive className="h-4 w-4" />
          Download HTML (ZIP)
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownloadNextjs}
        disabled={generatingNextjs || !selectedProject}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary/80 to-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
      >
        {generatingNextjs ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Code2 className="h-4 w-4" />
        )}
        {generatingNextjs ? "Gerando Next.js..." : "Exportar Next.js + Tailwind"}
      </motion.button>

      {(generatedHtml || true) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[11px] text-muted-foreground leading-relaxed p-3 rounded-lg bg-secondary/30 border border-border"
        >
          <p className="font-medium mb-1 flex items-center gap-1">
            <Globe className="h-3 w-3" /> Como publicar
          </p>
          <p>
            <strong>HTML:</strong> Descompacte o ZIP e faça upload em qualquer host estático.
          </p>
          <p className="mt-1">
            <strong>Next.js:</strong> Execute <code className="bg-secondary/60 px-1 rounded text-[10px]">npm install && npm run dev</code> ou faça deploy na Vercel com 1 clique.
          </p>
        </motion.div>
      )}
    </div>
  );
}
