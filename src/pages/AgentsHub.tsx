import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Settings, ArrowLeft, Lock, Crown, Map, Sparkles, CheckCircle2, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { AGENTS, AGENT_CATEGORIES, FREE_AGENT_IDS, type AgentDef } from "@/lib/agents";
import { GUIDED_STEPS } from "@/lib/guided-flow-config";
import { OnboardingTour, type TourStep } from "@/components/onboarding/OnboardingTour";
import { DnaBadge } from "@/components/brand/DnaBadge";

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='hub-header']",
    title: "Bem-vindo à Central de Agentes! 🚀",
    description:
      "Aqui estão todos os seus agentes de IA especializados. Cada um é treinado para uma tarefa específica de marketing — desde criar copy de vendas até planejar conteúdos.",
    position: "bottom",
  },
  {
    target: "[data-tour='config-summary']",
    title: "Seu contexto estratégico",
    description:
      "Estes são os dados do seu perfil de marca. Todos os agentes usam esse contexto para gerar resultados personalizados e alinhados com sua estratégia.",
    position: "bottom",
  },
  {
    target: "[data-tour='category-ideation']",
    title: "Comece pela Ideação 💡",
    description:
      "Se está começando do zero, comece aqui. Use o 'Perfil do Cliente Ideal' para mapear seu público e depois gere ideias de produtos e conteúdos.",
    position: "bottom",
  },
  {
    target: "[data-tour='first-agent']",
    title: "Clique para usar um agente",
    description:
      "Cada card é um agente. Clique para abrir o workspace, preencha os campos e clique em 'Gerar'. O resultado fica salvo no seu histórico automaticamente.",
    position: "bottom",
  },
  {
    target: "[data-tour='category-copywriting']",
    title: "Copywriting de alta conversão ✍️",
    description:
      "Depois de definir sua estratégia, use estes agentes para criar páginas de vendas, VSLs, e-mails e anúncios. Tudo integrado com seu DNA de marca.",
    position: "top",
  },
];

interface DefaultProfile {
  name: string;
  personality_summary: string;
  audience_summary: string;
  product_summary: string;
}

export default function AgentsHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [profile, setProfile] = useState<DefaultProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyResults, setCopyResults] = useState<Record<string, any> | null>(null);

  const agentsAccess = subscription?.agents_access ?? "basic";

  // Build a map: agentId → status for guided agents
  const guidedStatuses = useMemo(() => {
    const map: Record<string, "pending" | "generated" | "audited"> = {};
    if (!copyResults) return map;
    for (const step of GUIDED_STEPS) {
      if (!step.copyKey) {
        // audit step: check if audit_last has any target
        const hasAudit = copyResults.audit_last && Object.keys(copyResults.audit_last).length > 0;
        map[step.agentId] = hasAudit ? "audited" : "pending";
      } else if (copyResults[step.copyKey]) {
        const isAudited = copyResults.audit_last?.[step.copyKey];
        map[step.agentId] = isAudited ? "audited" : "generated";
      } else {
        map[step.agentId] = "pending";
      }
    }
    return map;
  }, [copyResults]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("brand_profiles")
      .select("name, personality_summary, audience_summary, product_summary, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          navigate("/agents/setup");
        } else {
          setProfile(data);
        }
        setLoading(false);
      });
    // Fetch latest project copy_results for guided statuses
    supabase
      .from("projects")
      .select("copy_results")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.copy_results && typeof data.copy_results === "object") {
          setCopyResults(data.copy_results as Record<string, any>);
        }
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando agentes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Tour */}
      <OnboardingTour steps={TOUR_STEPS} storageKey="agents-hub-tour-done" />

      {/* Header */}
      <header className="glass-header sticky top-0 z-30" data-tour="hub-header">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold gradient-text">Central de Agentes</h1>
              <p className="text-xs text-muted-foreground">Seu arsenal de IA para marketing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
              <Map className="h-4 w-4" />
              Roadmap
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/agents/setup")} className="gap-2">
              <Settings className="h-4 w-4" />
              Trocar DNA
            </Button>
          </div>
        </div>
      </header>

      {/* Config summary with DNA Badge */}
      {profile && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="premium-card p-4 flex flex-wrap items-center gap-5" data-tour="config-summary">
            <DnaBadge name={profile.name} summary={profile.personality_summary} />
            <div className="flex flex-wrap gap-4 text-sm">
              {profile.personality_summary && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎭</span>
                  <span className="text-foreground truncate max-w-[200px]">{profile.personality_summary.slice(0, 60)}...</span>
                </div>
              )}
              {profile.audience_summary && (
                <>
                  <div className="h-5 w-px bg-border hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span className="text-foreground truncate max-w-[200px]">{profile.audience_summary.slice(0, 60)}...</span>
                  </div>
                </>
              )}
              {profile.product_summary && (
                <>
                  <div className="h-5 w-px bg-border hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <span className="text-foreground truncate max-w-[200px]">{profile.product_summary.slice(0, 60)}...</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agent categories */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {AGENT_CATEGORIES.map((cat, ci) => {
          const catAgents = AGENTS.filter((a) => a.category === cat.id);
          const isFirst = ci === 0;
          const isSecond = ci === 1;
          return (
            <motion.section
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1 }}
              data-tour={isFirst ? "category-ideation" : isSecond ? "category-copywriting" : undefined}
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{cat.emoji}</span>
                <h2 className="text-lg font-bold text-foreground">{cat.label}</h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catAgents.map((agent, ai) => {
                  const lockedByPlan = agentsAccess === "basic" && !FREE_AGENT_IDS.includes(agent.id);
                  return (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      index={ai}
                      dataTour={isFirst && ai === 0 ? "first-agent" : undefined}
                      lockedByPlan={lockedByPlan}
                      guidedStatus={cat.id === "guided" ? guidedStatuses[agent.id] : undefined}
                    />
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}

function AgentCard({ agent, index, dataTour, lockedByPlan, guidedStatus }: { agent: AgentDef; index: number; dataTour?: string; lockedByPlan?: boolean; guidedStatus?: "pending" | "generated" | "audited" }) {
  const navigate = useNavigate();
  const isLocked = !agent.available || lockedByPlan;

  const statusConfig = guidedStatus === "generated"
    ? { icon: <CheckCircle2 className="h-3 w-3" />, label: "Gerado", className: "bg-primary/10 text-primary border-primary/20" }
    : guidedStatus === "audited"
    ? { icon: <Trophy className="h-3 w-3" />, label: "Auditado", className: "bg-accent/10 text-accent-foreground border-accent/20" }
    : guidedStatus === "pending"
    ? { icon: <Clock className="h-3 w-3" />, label: "Pendente", className: "bg-muted text-muted-foreground border-border" }
    : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={() => {
        if (lockedByPlan) {
          navigate("/pricing");
        } else if (agent.available) {
          navigate(`/agents/${agent.id}`);
        }
      }}
      disabled={!agent.available && !lockedByPlan}
      data-tour={dataTour}
      className={`premium-card p-5 text-left w-full group relative transition-all ${
        isLocked
          ? "opacity-60 cursor-pointer hover:border-primary/30"
          : "cursor-pointer hover:border-primary/30"
      }`}
    >
      {/* Status badges */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {statusConfig && (
          <Badge variant="outline" className={`gap-1 text-[10px] px-1.5 py-0 h-5 font-medium ${statusConfig.className}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        )}
        {lockedByPlan && (
          <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 h-5 font-medium bg-secondary/50 text-secondary-foreground border-secondary">
            <Crown className="h-3 w-3" />
            Pro
          </Badge>
        )}
      </div>
      {!agent.available && !lockedByPlan && (
        <div className="absolute top-3 right-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0">{agent.emoji}</span>
        <div className="space-y-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs text-accent-foreground font-medium">{agent.role}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
        </div>
      </div>

      {!agent.available && !lockedByPlan && (
        <div className="mt-3 text-xs text-muted-foreground italic">Em breve</div>
      )}
    </motion.button>
  );
}
