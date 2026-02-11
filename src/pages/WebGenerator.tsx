import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/TopNav";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Download,
  Eye,
  Loader2,
  Search,
  Palette,
  Moon,
  Sun,
  Sparkles,
  Minus,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  FileArchive,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Template definitions
const TEMPLATES = [
  {
    key: "modern-dark",
    label: "Modern Dark",
    icon: Moon,
    description: "Escuro premium com gradientes e glow",
    preview: "linear-gradient(135deg, #0d0f14, #1a1d2e)",
  },
  {
    key: "clean-light",
    label: "Clean Light",
    icon: Sun,
    description: "Limpo e profissional, fundo claro",
    preview: "linear-gradient(135deg, #fafbfc, #e8eaed)",
  },
  {
    key: "premium-gradient",
    label: "Premium Gradient",
    icon: Sparkles,
    description: "Gradientes animados e efeitos premium",
    preview: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
  },
  {
    key: "minimalist",
    label: "Minimalist",
    icon: Minus,
    description: "Limpo, tipografia forte, sem distrações",
    preview: "linear-gradient(135deg, #ffffff, #f5f5f5)",
  },
];

interface ProjectOption {
  id: string;
  name: string;
  hasSalesCopy: boolean;
  hasUpsellCopy: boolean;
}

export default function WebGenerator() {
  const { user } = useAuth();

  // State
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [templateKey, setTemplateKey] = useState("modern-dark");
  const [includeUpsells, setIncludeUpsells] = useState(false);
  const [brandingTitle, setBrandingTitle] = useState("");
  const [brandingLogo, setBrandingLogo] = useState("");
  const [brandingColor, setBrandingColor] = useState("#7c3aed");
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load projects
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, copy_results")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) {
        setProjects(
          data.map((p) => {
            const cr =
              typeof p.copy_results === "string"
                ? JSON.parse(p.copy_results as string)
                : (p.copy_results as Record<string, unknown>) || {};
            return {
              id: p.id,
              name: p.name,
              hasSalesCopy: !!cr.pagina_vendas,
              hasUpsellCopy: !!cr.pagina_upsell,
            };
          })
        );
      }
    })();
  }, [user]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!selectedProject) {
      toast.error("Selecione um projeto primeiro");
      return;
    }
    if (!selectedProjectData?.hasSalesCopy) {
      toast.error(
        "Este projeto não tem Página de Vendas gerada. Gere primeiro."
      );
      return;
    }

    setGenerating(true);
    setGeneratedHtml(null);
    setShowPreview(false);

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
            options: {
              includeUpsells,
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
        throw new Error(err.error || "Erro ao gerar página");
      }

      const result = await res.json();
      setGeneratedHtml(result.html);
      setShowPreview(true);
      toast.success("Página gerada com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [
    selectedProject,
    selectedProjectData,
    templateKey,
    includeUpsells,
    brandingTitle,
    brandingLogo,
    brandingColor,
  ]);

  // Download ZIP
  const handleDownloadZip = useCallback(async () => {
    if (!generatedHtml) return;
    const zip = new JSZip();
    zip.file("index.html", generatedHtml);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `landing-page-${templateKey}.zip`);
    toast.success("ZIP baixado!");
  }, [generatedHtml, templateKey]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 container py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold gradient-text font-[Space_Grotesk]">
            Gerador de Página Web
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transforme sua copy em uma landing page profissional e pronta para
            publicar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* LEFT PANEL — Config */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Project selector */}
            <div className="premium-card p-5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Projeto
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar projeto..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredProjects.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Nenhum projeto encontrado
                  </p>
                )}
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProject(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedProject === p.id
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "hover:bg-secondary/60 text-foreground/80"
                    }`}
                  >
                    <span className="truncate block">{p.name}</span>
                    {!p.hasSalesCopy && (
                      <span className="text-xs text-destructive">
                        Sem copy de vendas
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Template selector */}
            <div className="premium-card p-5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Template
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  const isActive = templateKey === t.key;
                  return (
                    <motion.button
                      key={t.key}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTemplateKey(t.key)}
                      className={`relative rounded-xl p-3 text-left transition-all border ${
                        isActive
                          ? "border-primary/50 ring-2 ring-primary/20"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div
                        className="h-16 rounded-lg mb-2"
                        style={{ background: t.preview }}
                      />
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{t.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {t.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="premium-card p-5 space-y-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Opções
              </label>

              {/* Upsell toggle */}
              <button
                onClick={() => setIncludeUpsells(!includeUpsells)}
                className="flex items-center justify-between w-full py-2"
              >
                <span className="text-sm text-foreground/80">
                  Incluir seções de Upsell
                </span>
                {includeUpsells ? (
                  <ToggleRight className="h-5 w-5 text-primary" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Branding */}
              <div className="space-y-3 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Branding (opcional)
                </span>
                <input
                  type="text"
                  value={brandingTitle}
                  onChange={(e) => setBrandingTitle(e.target.value)}
                  placeholder="Título do site"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={brandingLogo}
                  onChange={(e) => setBrandingLogo(e.target.value)}
                  placeholder="URL do logo (opcional)"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Cor primária
                  </span>
                  <input
                    type="color"
                    value={brandingColor}
                    onChange={(e) => setBrandingColor(e.target.value)}
                    className="h-7 w-10 rounded cursor-pointer border-0"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {brandingColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
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
                  Download ZIP
                </motion.button>
              )}
            </div>

            {/* Hosting note */}
            {generatedHtml && (
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
            )}
          </motion.div>

          {/* RIGHT PANEL — Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="premium-card overflow-hidden flex flex-col min-h-[600px]"
          >
            {/* Preview header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  Preview
                </span>
              </div>
              {generatedHtml && (
                <button
                  onClick={() => {
                    const w = window.open("", "_blank");
                    if (w) {
                      w.document.write(generatedHtml);
                      w.document.close();
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir
                </button>
              )}
            </div>

            {/* Preview body */}
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {generatedHtml ? (
                <iframe
                  srcDoc={generatedHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                  title="Preview da página gerada"
                  style={{ minHeight: 560 }}
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[560px]">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Selecione um projeto e clique em{" "}
                      <span className="text-primary font-medium">
                        Gerar Preview
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
