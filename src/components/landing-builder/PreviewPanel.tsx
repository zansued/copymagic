import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, ExternalLink, Loader2, Pencil } from "lucide-react";
import { SectionEditDialog } from "./SectionEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PreviewPanelProps {
  html: string | null;
  generating: boolean;
  onHtmlUpdate?: (html: string) => void;
}

export function PreviewPanel({ html, generating, onHtmlUpdate }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Inject hover/click script into iframe for section detection
  const injectSectionInteractions = useCallback((iframe: HTMLIFrameElement) => {
    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;

      // Avoid double-injection
      if (doc.getElementById("section-interact-style")) return;

      const style = doc.createElement("style");
      style.id = "section-interact-style";
      style.textContent = `
        [data-section] {
          position: relative !important;
          transition: outline 0.2s ease;
          cursor: pointer;
        }
        [data-section]:hover {
          outline: 2px dashed rgba(124, 58, 237, 0.5);
          outline-offset: 4px;
        }
        [data-section]:hover::after {
          content: attr(data-section);
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(124, 58, 237, 0.9);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-family: Inter, sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 9999;
          pointer-events: none;
          backdrop-filter: blur(4px);
        }
        .section-edit-btn {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(124, 58, 237, 0.9);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-family: Inter, sans-serif;
          font-weight: 600;
          cursor: pointer;
          z-index: 10000;
          display: none;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .section-edit-btn:hover {
          background: rgba(124, 58, 237, 1);
          transform: scale(1.05);
        }
        [data-section]:hover .section-edit-btn {
          display: flex;
        }
      `;
      doc.head.appendChild(style);

      // Add edit buttons to each section
      const sections = doc.querySelectorAll("[data-section]");
      sections.forEach((section) => {
        const btn = doc.createElement("button");
        btn.className = "section-edit-btn";
        btn.innerHTML = '✏️ Editar';
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const sectionName = section.getAttribute("data-section");
          if (sectionName) {
            window.parent.postMessage(
              { type: "edit-section", section: sectionName },
              "*"
            );
          }
        });
        section.appendChild(btn);
      });
    } catch (err) {
      console.log("Could not inject section interaction:", err);
    }
  }, []);

  useEffect(() => {
    if (!html || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const handleLoad = () => injectSectionInteractions(iframe);

    iframe.addEventListener("load", handleLoad);

    // Also try injecting immediately in case load already fired
    const timer = setTimeout(() => injectSectionInteractions(iframe), 300);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      clearTimeout(timer);
    };
  }, [html, injectSectionInteractions]);

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "edit-section" && e.data.section) {
        setEditingSection(e.data.section);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleEditSubmit = useCallback(
    async (instruction: string) => {
      if (!html || !editingSection) return;

      setEditLoading(true);
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
              action: "edit-section",
              currentHtml: html,
              sectionName: editingSection,
              instruction,
            }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao editar seção");
        }

        const result = await res.json();
        onHtmlUpdate?.(result.html);
        toast.success(`Seção "${editingSection}" atualizada!`);
        setEditingSection(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        toast.error(msg);
      } finally {
        setEditLoading(false);
      }
    },
    [html, editingSection, onHtmlUpdate]
  );

  return (
    <>
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
            {html && (
              <span className="text-[10px] text-primary/60 ml-2 flex items-center gap-1">
                <Pencil className="h-2.5 w-2.5" />
                Passe o mouse sobre uma seção para editar
              </span>
            )}
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
              ref={iframeRef}
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

      <SectionEditDialog
        open={!!editingSection}
        onClose={() => setEditingSection(null)}
        sectionName={editingSection || ""}
        onSubmit={handleEditSubmit}
        loading={editLoading}
      />
    </>
  );
}
