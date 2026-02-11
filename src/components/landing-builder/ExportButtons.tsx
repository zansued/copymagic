import { motion } from "motion/react";
import { Eye, Loader2, FileArchive, Globe } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useCallback } from "react";
import { toast } from "sonner";

interface ExportButtonsProps {
  generating: boolean;
  selectedProject: string;
  generatedHtml: string | null;
  templateKey: string;
  onGenerate: () => void;
}

export function ExportButtons({
  generating,
  selectedProject,
  generatedHtml,
  templateKey,
  onGenerate,
}: ExportButtonsProps) {
  const handleDownloadZip = useCallback(async () => {
    if (!generatedHtml) return;
    const zip = new JSZip();
    zip.file("index.html", generatedHtml);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `landing-${templateKey}.zip`);
    toast.success("ZIP baixado!");
  }, [generatedHtml, templateKey]);

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
        <>
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-muted-foreground leading-relaxed p-3 rounded-lg bg-secondary/30 border border-border"
          >
            <p className="font-medium mb-1 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Como publicar
            </p>
            <p>
              Descompacte o ZIP e faça upload em qualquer host estático:
              Vercel, Netlify, Cloudflare Pages ou GitHub Pages.
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
