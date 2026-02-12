import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Textarea } from "@/components/ui/textarea";
import { GlowButton } from "@/components/ui/glow-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const STEPS = [
  {
    key: "brand_personality",
    emoji: "🎭",
    title: "Personalidade da Marca",
    subtitle: "Como sua marca se comunica com o mundo?",
    placeholder: `Descreva a personalidade da sua marca. Exemplos:\n\n• "Somos descontraídos, diretos e usamos humor inteligente. Falamos como um amigo que manja do assunto."\n• "Profissionais, confiáveis e empáticos. Transmitimos autoridade sem arrogância."\n• "Ousados, irreverentes e provocativos. Quebramos padrões e desafiamos o status quo."`,
  },
  {
    key: "target_audience",
    emoji: "🎯",
    title: "Público-Alvo",
    subtitle: "Para quem você está falando?",
    placeholder: `Descreva seu público ideal. Exemplos:\n\n• "Empreendedores digitais entre 25-40 anos que já tentaram vender online mas não conseguiram escalar."\n• "Mulheres 30-50 que buscam equilíbrio entre carreira e saúde, dispostas a investir em bem-estar."\n• "Gestores de PMEs que precisam automatizar processos mas têm orçamento limitado."`,
  },
  {
    key: "product_service",
    emoji: "📦",
    title: "Produto / Serviço",
    subtitle: "O que você oferece ao mundo?",
    placeholder: `Descreva seu produto ou serviço principal. Exemplos:\n\n• "Curso online de copywriting com 12 módulos + mentoria semanal. Foco em copy para lançamentos digitais."\n• "Consultoria de branding para startups. Entregamos naming, identidade visual e manual de marca em 30 dias."\n• "SaaS de automação de marketing para e-commerce. Planos a partir de R$97/mês."`,
  },
];

export default function AgentSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    brand_personality: "",
    target_audience: "",
    product_service: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("agent_configs")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setValues({
            brand_personality: data.brand_personality || "",
            target_audience: data.target_audience || "",
            product_service: data.product_service || "",
          });
        }
        setInitialLoading(false);
      });
  }, [user]);

  const current = STEPS[step];
  const currentValue = values[current.key as keyof typeof values];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("agent_configs")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("agent_configs")
          .update({ ...values })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("agent_configs")
          .insert({ user_id: user.id, ...values });
      }

      toast({ title: "Configuração salva!", description: "Seus agentes estão prontos." });
      navigate("/agents");
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="w-full px-6 pt-6">
        <div className="max-w-2xl mx-auto flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step
                  ? "bg-gradient-to-r from-primary to-accent-foreground"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-2xl space-y-8"
        >
          <div className="text-center space-y-3">
            <span className="text-5xl">{current.emoji}</span>
            <h1 className="text-3xl font-bold gradient-text">{current.title}</h1>
            <p className="text-muted-foreground text-lg">{current.subtitle}</p>
          </div>

          <Textarea
            value={currentValue}
            onChange={(e) =>
              setValues((v) => ({ ...v, [current.key]: e.target.value }))
            }
            placeholder={current.placeholder}
            className="min-h-[220px] text-base leading-relaxed"
          />

          <div className="flex gap-3 justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            >
              ← Voltar
            </button>

            {step < STEPS.length - 1 ? (
              <GlowButton
                onClick={handleNext}
                disabled={!currentValue.trim()}
                glowColor="hsl(262, 83%, 65%)"
                className="px-8 h-11"
              >
                Próximo →
              </GlowButton>
            ) : (
              <GlowButton
                onClick={handleSave}
                disabled={!currentValue.trim() || loading}
                glowColor="hsl(262, 83%, 65%)"
                className="px-8 h-11"
              >
                {loading ? "Salvando..." : "🚀 Ativar Agentes"}
              </GlowButton>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
