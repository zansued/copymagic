import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Settings, ArrowLeft, Lock, Crown, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { AGENTS, AGENT_CATEGORIES, FREE_AGENT_IDS, type AgentDef } from "@/lib/agents";
import { OnboardingTour, type TourStep } from "@/components/onboarding/OnboardingTour";

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

  const agentsAccess = subscription?.agents_access ?? "basic";

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
            <Button variant="outline" size="sm" onClick={() => navigate("/roadmap")} className="gap-2">
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

      {/* Config summary */}
      {profile && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="premium-card p-4 flex flex-wrap gap-4 text-sm" data-tour="config-summary">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧬</span>
              <span className="text-primary font-medium">{profile.name}</span>
            </div>
            {profile.personality_summary && (
              <>
                <div className="h-5 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎭</span>
                  <span className="text-foreground truncate max-w-[200px]">{profile.personality_summary.slice(0, 60)}...</span>
                </div>
              </>
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

function AgentCard({ agent, index, dataTour, lockedByPlan }: { agent: AgentDef; index: number; dataTour?: string; lockedByPlan?: boolean }) {
  const navigate = useNavigate();
  const isLocked = !agent.available || lockedByPlan;

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
          ? "opacity-60 cursor-pointer hover:border-amber-500/30"
          : "cursor-pointer hover:border-primary/30"
      }`}
    >
      {lockedByPlan && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
          <Crown className="h-3 w-3" />
          Pro
        </div>
      )}
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
