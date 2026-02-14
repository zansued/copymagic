import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, Sparkles, Crown, Building2, Gem, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Sparkles,
    features: [
      { text: "5 gerações por mês", included: true },
      { text: "1 projeto no Lab de Copy", included: true },
      { text: "1 perfil de DNA de Marca", included: true },
      { text: "3 agentes básicos", included: true },
      { text: "Landing Builder", included: false },
      { text: "Mentor de Riqueza", included: false },
    ],
    cta: "Plano atual",
    highlight: false,
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 97,
    annualPrice: 970, // 10 months = 2 free
    icon: Crown,
    features: [
      { text: "100 gerações por mês", included: true },
      { text: "10 projetos no Lab de Copy", included: true },
      { text: "5 perfis de DNA de Marca", included: true },
      { text: "Todos os agentes", included: true },
      { text: "Landing Builder", included: true },
      { text: "Mentor de Riqueza", included: true },
      { text: "Suporte prioritário", included: true },
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    key: "agency",
    name: "Agency",
    monthlyPrice: 297,
    annualPrice: 2970, // 10 months = 2 free
    icon: Building2,
    features: [
      { text: "Gerações ilimitadas", included: true },
      { text: "Projetos ilimitados", included: true },
      { text: "DNAs de Marca ilimitados", included: true },
      { text: "Todos os agentes", included: true },
      { text: "Landing Builder", included: true },
      { text: "Mentor de Riqueza", included: true },
      { text: "Colaboração e times", included: true },
      { text: "Suporte VIP", included: true },
    ],
    cta: "Assinar Agency",
    highlight: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [slotsRemaining, setSlotsRemaining] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    supabase
      .from("lifetime_slots")
      .select("total_slots, slots_sold")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setSlotsRemaining(data.total_slots - data.slots_sold);
      });
  }, []);

  const handleCheckout = async (planKey: string) => {
    if (!user) {
      toast.error("Faça login para assinar");
      return;
    }

    setCheckingOut(planKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mp-create-preference`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            plan: planKey,
            billing: planKey !== "lifetime" && planKey !== "free" && isAnnual ? "annual" : "monthly",
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar checkout");
      }

      const { init_point } = await res.json();
      window.location.href = init_point;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setCheckingOut(null);
    }
  };

  const currentPlan = subscription?.plan || "free";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 container py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text font-[Space_Grotesk] mb-3">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Desbloqueie todo o poder do CopyMagic para escalar seu marketing com IA.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Mensal
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              isAnnual ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Anual
          </span>
          {isAnnual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full"
            >
              2 meses grátis
            </motion.span>
          )}
        </motion.div>

        {/* Regular plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isCurrent = currentPlan === plan.key;
            const Icon = plan.icon;
            const price = plan.key === "free" ? 0 : isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const monthlyEquivalent = isAnnual && plan.annualPrice > 0
              ? Math.round((plan.annualPrice / 12) * 100) / 100
              : null;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`premium-card p-6 flex flex-col relative ${
                  plan.highlight
                    ? "ring-2 ring-primary shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                    : ""
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Mais popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  {plan.key === "free" ? (
                    <>
                      <span className="text-3xl font-bold text-foreground">R$ 0</span>
                      <span className="text-muted-foreground text-sm ml-1">para sempre</span>
                    </>
                  ) : isAnnual ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          R$ {price.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-muted-foreground text-sm">/ano</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground line-through">
                          R$ {(plan.monthlyPrice * 12).toLocaleString("pt-BR")}/ano
                        </span>
                        <span className="text-xs text-primary font-medium">
                          ≈ R$ {monthlyEquivalent?.toFixed(0)}/mês
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-foreground">R$ {price}</span>
                      <span className="text-muted-foreground text-sm ml-1">/mês</span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm text-foreground/80">
                      {f.included ? (
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      )}
                      <span className={!f.included ? "text-muted-foreground/50" : ""}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                {plan.key === "free" ? (
                  <Button variant="outline" disabled className="w-full">
                    {isCurrent ? "Plano atual" : "Gratuito"}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    ✓ Plano ativo
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(plan.key)}
                    disabled={!!checkingOut || loading}
                    className={`w-full gap-2 ${
                      plan.highlight
                        ? "bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
                        : ""
                    }`}
                  >
                    {checkingOut === plan.key ? "Redirecionando..." : plan.cta}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Lifetime offer */}
        {slotsRemaining !== null && slotsRemaining > 0 && currentPlan !== "lifetime" && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-3xl mx-auto mt-12"
          >
            <div className="relative premium-card p-8 ring-2 ring-amber-500/50 shadow-[0_0_60px_hsl(45_100%_50%/0.1)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/15">
                    <Gem className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Acesso Vitalício</h3>
                    <p className="text-xs text-amber-400 font-medium">Pague uma vez, use para sempre</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Tenha acesso <strong className="text-foreground">completo e permanente</strong> ao CopyMagic — equivalente ao plano Agency, sem mensalidade. Gerações ilimitadas, todos os agentes, todos os recursos. Para sempre.
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Gerações ilimitadas para sempre",
                        "Todos os agentes e recursos",
                        "Projetos e DNAs ilimitados",
                        "Landing Builder + Mentor",
                        "Todas as atualizações futuras",
                      ].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                          <Check className="h-4 w-4 text-amber-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground line-through">R$ 3.564/ano</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">R$ 1.297</span>
                        <span className="text-sm text-muted-foreground">único</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                      <Flame className="h-4 w-4" />
                      Apenas {slotsRemaining} vagas restantes
                    </div>

                    <Button
                      onClick={() => handleCheckout("lifetime")}
                      disabled={!!checkingOut || loading}
                      className="w-full max-w-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                      size="lg"
                    >
                      {checkingOut === "lifetime" ? "Redirecionando..." : "Garantir Acesso Vitalício"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Pagamento único • Sem mensalidade</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentPlan === "lifetime" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 font-medium">
              <Gem className="h-4 w-4" />
              Você tem acesso vitalício ✓
            </div>
          </motion.div>
        )}

        {subscription && currentPlan !== "lifetime" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 text-sm text-muted-foreground"
          >
            Você usou <strong className="text-foreground">{subscription.generations_used}</strong> de{" "}
            <strong className="text-foreground">
              {subscription.generations_limit >= 999999 ? "∞" : subscription.generations_limit}
            </strong>{" "}
            gerações este mês.
          </motion.div>
        )}
      </main>
    </div>
  );
}