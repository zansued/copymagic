import { motion, AnimatePresence } from "motion/react";
import { Globe, ExternalLink, Loader2 } from "lucide-react";

interface PreviewPanelProps {
  html: string | null;
  generating: boolean;
}

export function PreviewPanel({ html, generating }: PreviewPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="premium-card overflow-hidden flex flex-col min-h-[600px]"
    >
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">Preview</span>
        </div>
        {html && (
          <button
            onClick={() => {
              const w = window.open("", "_blank");
              if (w) { w.document.write(html); w.document.close(); }
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {generating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
            >
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Gerando sua landing page...
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Parseando copy → Aplicando template → Otimizando
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {html ? (
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts"
            title="Preview da página gerada"
            style={{ minHeight: 560 }}
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[560px]">
            <div className="text-center">
              <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Selecione um projeto e clique em{" "}
                <span className="text-primary font-medium">Gerar Preview</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
