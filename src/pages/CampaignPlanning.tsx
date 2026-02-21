import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STEPS } from "@/lib/steps";
import { AGENT_WORKSPACE_CONFIGS } from "@/lib/agent-workspace-configs";
import { toast } from "sonner";
import { TopNav } from "@/components/TopNav";
import ReactMarkdown from "react-markdown";

interface AgentCategory {
  title: string;
  emoji: string;
  gradient: string;
  agents: string[]; // agent IDs
}

const CAMPAIGN_CATEGORIES: AgentCategory[] = [
  {
    title: "Ideação & Estratégia",
    emoji: "💡",
    gradient: "from-amber-500/20 to-orange-500/20",
    agents: [
      "icp-profile",
      "lead-magnet-ideas",
      "big-ideas",
      "content-ideas",
      "headlines",
      "hooks",
      "ad-angles",
    ],
  },
  {
    title: "Copywriting",
    emoji: "✍️",
    gradient: "from-blue-500/20 to-cyan-500/20",
    agents: [
      "sales-page",
      "short-vsl",
      "mini-vsl",
      "email-generator",
      "ad-generator",
      "ad-funnel",
      "content-to-ad",
      "copy-reviewer-cub",
    ],
  },
  {
    title: "Conteúdo & Social",
    emoji: "📱",
    gradient: "from-pink-500/20 to-purple-500/20",
    agents: [
      "carousel-creator",
      "carousel-generator",
      "video-script",
      "text-structure",
      "storytelling-adapter",
      "image-prompt",
      "instagram-stories",
    ],
  },
];

export default function CampaignPlanning() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [copyResults, setCopyResults] = useState<Record<string, string>>({});
  const [productInput, setProductInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedSummary, setExpandedSummary] = useState(false);

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
      setProductInput(data.product_input || "");
      if (data.copy_results && typeof data.copy_results === "object") {
        setCopyResults(data.copy_results as Record<string, string>);
      }
      setLoading(false);
    })();
  }, [id]);

  // Steps that contain strategic/short content — always pass in full
  const STRATEGIC_STEPS = new Set(["avatar", "oferta", "usp", "anuncios"]);
  // Steps with long-form content — pass only a trimmed summary
  const LONG_FORM_STEPS = new Set(["pagina_vendas", "upsells", "vsl_longa", "pagina_upsell", "vsl_upsell"]);

  const summarize = (text: string, maxChars = 800) => {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).replace(/\s+\S*$/, "") + "\n\n[… conteúdo completo omitido para brevidade]";
  };

  // Full context (used for ProjectSummary display)
  const buildCopyContext = () => {
    const parts: string[] = [];
    if (productInput) {
      parts.push(`## Produto/Oferta\n${productInput}`);
    }
    STEPS.forEach((step) => {
      if (copyResults[step.id]) {
        parts.push(`## ${step.label}\n${copyResults[step.id]}`);
      }
    });
    return parts.join("\n\n---\n\n");
  };

  // Lean context for agent workspace — avoids prompt overflow
  const buildAgentContext = () => {
    const parts: string[] = [];
    if (productInput) {
      parts.push(`## Produto/Oferta\n${productInput}`);
    }
    STEPS.forEach((step) => {
      const content = copyResults[step.id];
      if (!content) return;
      if (STRATEGIC_STEPS.has(step.id)) {
        parts.push(`## ${step.label}\n${content}`);
      } else if (LONG_FORM_STEPS.has(step.id)) {
        parts.push(`## ${step.label} (resumo)\n${summarize(content)}`);
      }
    });
    return parts.join("\n\n---\n\n");
  };

  const handleOpenAgent = (agentId: string) => {
    // Store lean context — strategic steps in full, long-form as summary
    const context = buildAgentContext();
    sessionStorage.setItem("campaign_copy_context", context);
    sessionStorage.setItem("campaign_project_id", id || "");
    sessionStorage.setItem("campaign_project_name", projectName);
    navigate(`/agents/${agentId}?from=campaign&projectId=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const completedSteps = STEPS.filter((s) => copyResults[s.id]);
  const summaryText = buildCopyContext();

  return (
    <div className="min-h-screen bg-background surface-gradient">
      <TopNav projectName={projectName} />

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-8 pb-16">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/project/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                🚀 Planejamento de Campanha
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedSteps.length} de {STEPS.length} etapas concluídas — Agentes recebem contexto estratégico otimizado
              </p>
            </div>
          </div>

          {/* Copy Context Info */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  📋 Contexto Completo do Projeto
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedSummary(!expandedSummary)}
                >
                  {expandedSummary ? "Recolher" : "Ver conteúdo"}
                </Button>
              </div>
              <CardDescription>
                Os agentes recebem Avatar, Oferta, USP e Anúncios na íntegra. Etapas longas (VSL, Página de Vendas) vão como resumo para evitar sobrecarga
              </CardDescription>
            </CardHeader>
            {expandedSummary && (
              <div className="px-6 pb-6">
                <div className="h-[500px] overflow-y-auto rounded-lg border bg-muted/30 p-4 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                  <div className="prose prose-sm prose-invert max-w-none prose-premium">
                    <ReactMarkdown>{summaryText}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Agent Categories */}
          {CAMPAIGN_CATEGORIES.map((category) => (
            <div key={category.title} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {category.emoji} {category.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {category.agents.map((agentId) => {
                  const config = AGENT_WORKSPACE_CONFIGS[agentId];
                  if (!config) return null;
                  return (
                    <Card
                      key={agentId}
                      className={`cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg bg-gradient-to-br ${category.gradient} border-border/50`}
                      onClick={() => handleOpenAgent(agentId)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.emoji}</span>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-medium truncate">
                              {config.name}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-2">
                              {config.subtitle}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      </ScrollArea>
    </div>
  );
}
