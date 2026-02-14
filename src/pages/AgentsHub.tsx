import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Settings, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AGENTS, AGENT_CATEGORIES, type AgentDef } from "@/lib/agents";
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

export default function AgentsHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("agent_configs")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data || !data.brand_personality) {
          navigate("/agents/setup");
        } else {
          setConfig(data);
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
          <Button variant="outline" size="sm" onClick={() => navigate("/agents/setup")} className="gap-2">
            <Settings className="h-4 w-4" />
            Configurar
          </Button>
        </div>
      </header>

      {/* Config summary */}
      {config && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="premium-card p-4 flex flex-wrap gap-4 text-sm" data-tour="config-summary">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎭</span>
              <span className="text-muted-foreground">Personalidade:</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{config.brand_personality.slice(0, 60)}...</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="text-muted-foreground">Público:</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{config.target_audience.slice(0, 60)}...</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span className="text-muted-foreground">Produto:</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">{config.product_service.slice(0, 60)}...</span>
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
                {catAgents.map((agent, ai) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    index={ai}
                    dataTour={isFirst && ai === 0 ? "first-agent" : undefined}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}

function AgentCard({ agent, index, dataTour }: { agent: AgentDef; index: number; dataTour?: string }) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={() => agent.available && navigate(`/agents/${agent.id}`)}
      disabled={!agent.available}
      data-tour={dataTour}
      className={`premium-card p-5 text-left w-full group relative transition-all ${
        agent.available
          ? "cursor-pointer hover:border-primary/30"
          : "opacity-50 cursor-not-allowed"
      }`}
    >
      {!agent.available && (
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

      {!agent.available && (
        <div className="mt-3 text-xs text-muted-foreground italic">Em breve</div>
      )}
    </motion.button>
  );
}
