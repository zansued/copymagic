import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { STEPS } from "@/lib/steps";
import { motion, AnimatePresence } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextRevealCard, TextRevealCardTitle, TextRevealCardDescription } from "@/components/ui/text-reveal-card";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const STEP_COLORS = [
  { bg: "from-violet-500/20 to-violet-900/5", border: "border-violet-500/30", glow: "shadow-violet-500/10", accent: "#a78bfa" },
  { bg: "from-yellow-500/20 to-yellow-900/5", border: "border-yellow-500/30", glow: "shadow-yellow-500/10", accent: "#facc15" },
  { bg: "from-orange-500/20 to-orange-900/5", border: "border-orange-500/30", glow: "shadow-orange-500/10", accent: "#fb923c" },
  { bg: "from-sky-500/20 to-sky-900/5", border: "border-sky-500/30", glow: "shadow-sky-500/10", accent: "#38bdf8" },
  { bg: "from-red-500/20 to-red-900/5", border: "border-red-500/30", glow: "shadow-red-500/10", accent: "#f87171" },
  { bg: "from-fuchsia-500/20 to-fuchsia-900/5", border: "border-fuchsia-500/30", glow: "shadow-fuchsia-500/10", accent: "#e879f9" },
  { bg: "from-emerald-500/20 to-emerald-900/5", border: "border-emerald-500/30", glow: "shadow-emerald-500/10", accent: "#34d399" },
  { bg: "from-pink-500/20 to-pink-900/5", border: "border-pink-500/30", glow: "shadow-pink-500/10", accent: "#f472b6" },
  { bg: "from-blue-500/20 to-blue-900/5", border: "border-blue-500/30", glow: "shadow-blue-500/10", accent: "#60a5fa" },
];

function truncateMarkdown(text: string, maxLines = 6): string {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join("\n") + "\n\n...";
}

function getFirstHeadline(content: string): string {
  const lines = content.split("\n").filter(Boolean);
  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
    if (clean.length > 10 && clean.length < 80) return clean;
  }
  return lines[0]?.slice(0, 60) || "";
}

export default function ProjectSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Projeto não encontrado");
        navigate("/", { replace: true });
        return;
      }
      setProjectName(data.name);
      if (data.copy_results && typeof data.copy_results === "object") {
        setResults(data.copy_results as Record<string, string>);
      }
      setLoading(false);
    })();
  }, [id]);

  const completedSteps = STEPS.filter((s) => results[s.id]);
  const totalSteps = STEPS.length;
  const progress = (completedSteps.length / totalSteps) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Carregando resumo...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background surface-gradient">
      <header className="glass-header">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="text-lg font-bold leading-tight gradient-text">{projectName}</h1>
              <p className="text-xs text-muted-foreground">Resumo do Projeto</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/project/${id}`)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Editar Projeto
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Projetos
            </button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-5xl mx-auto">
        {/* Progress overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
            <span className="text-sm text-muted-foreground font-medium">
              {completedSteps.length}/{totalSteps} etapas concluídas
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))",
              }}
            />
          </div>
        </motion.div>

        {/* Text Reveal Hero */}
        {completedSteps.length > 0 && results["pagina_vendas"] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-10 flex justify-center"
          >
            <TextRevealCard
              text={getFirstHeadline(results["avatar"] || "") || "Deslize para revelar"}
              revealText={getFirstHeadline(results["pagina_vendas"]) || "Sua copy de alta conversão"}
              className="w-full max-w-3xl"
            >
              <TextRevealCardTitle>✨ Headline Principal</TextRevealCardTitle>
              <TextRevealCardDescription>
                Deslize para revelar a headline da sua página de vendas
              </TextRevealCardDescription>
            </TextRevealCard>
          </motion.div>
        )}

        {/* Cards grid */}
        {completedSteps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <span className="text-6xl mb-4 block">🚧</span>
            <p className="text-muted-foreground text-lg">Nenhuma etapa foi gerada ainda.</p>
            <button
              onClick={() => navigate(`/project/${id}`)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Ir para o editor →
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {STEPS.map((step, i) => {
                const content = results[step.id];
                if (!content) return null;
                const colors = STEP_COLORS[i];
                const isExpanded = expandedCard === step.id;

                return (
                  <motion.div
                    key={step.id}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    onClick={() => setExpandedCard(isExpanded ? null : step.id)}
                    className={`
                      cursor-pointer rounded-xl border ${colors.border} 
                      bg-gradient-to-b ${colors.bg}
                      backdrop-blur-sm p-5 
                      shadow-lg ${colors.glow}
                      hover:shadow-xl transition-shadow duration-300
                      ${isExpanded ? "md:col-span-2 lg:col-span-3" : ""}
                    `}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 mb-3">
                      <motion.span
                        className="text-2xl"
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {step.icon}
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-sm">{step.label}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          🤖 {step.agent}
                        </p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.accent }}
                      />
                    </div>

                    {/* Card content */}
                    <ScrollArea className={isExpanded ? "max-h-[60vh]" : "max-h-32"}>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                        <ReactMarkdown>
                          {isExpanded ? content : truncateMarkdown(content)}
                        </ReactMarkdown>
                      </div>
                    </ScrollArea>

                    {/* Expand indicator */}
                    <div className="mt-3 flex items-center justify-center">
                      <motion.span
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="text-muted-foreground text-xs"
                      >
                        {isExpanded ? "▲ Recolher" : "▼ Expandir"}
                      </motion.span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Copy all button */}
        {completedSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex justify-center"
          >
            <button
              onClick={() => {
                const allContent = STEPS
                  .filter((s) => results[s.id])
                  .map((s) => `## ${s.icon} ${s.label}\n\n${results[s.id]}`)
                  .join("\n\n---\n\n");
                navigator.clipboard.writeText(allContent);
                toast.success("Todo o conteúdo copiado!");
              }}
              className="premium-button text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm"
            >
              📋 Copiar Tudo
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
