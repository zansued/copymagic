import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, Sparkles, Crown, Building2, Gem, Flame, X, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const plans = [
  {
    key: "free",
    name: "Free",
    tier: 0,
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
      { text: "Colaboração e times", included: false },
    ],
    cta: "Plano atual",
    highlight: false,
  },
  {
    key: "starter",
    name: "Starter",
    tier: 0.5,
    monthlyPrice: 47,
    annualPrice: 470,
    icon: Sparkles,
    features: [
      { text: "30 gerações por mês", included: true },
      { text: "3 projetos no Lab de Copy", included: true },
      { text: "2 perfis de DNA de Marca", included: true },
      { text: "Agentes básicos", included: true },
      { text: "Landing Builder", included: true },
      { text: "Mentor de Riqueza", included: false },
      { text: "Colaboração e times", included: false },
    ],
    cta: "Assinar Starter",
    highlight: false,
  },
  {
    key: "pro",
    name: "Pro",
    tier: 1,
    monthlyPrice: 97,
    annualPrice: 970,
    icon: Crown,
    features: [
      { text: "100 gerações por mês", included: true },
      { text: "10 projetos no Lab de Copy", included: true },
      { text: "5 perfis de DNA de Marca", included: true },
      { text: "Todos os agentes", included: true },
      { text: "Landing Builder", included: true },
      { text: "Mentor de Riqueza", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Colaboração e times", included: false },
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    key: "agency",
    name: "Agency",
    tier: 3,
    monthlyPrice: 297,
    annualPrice: 2970,
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

// Lifetime features for the benefits card
const lifetimeFeatures = [
  { text: "Gerações ilimitadas para sempre", included: true },
  { text: "Todos os agentes e recursos", included: true },
  { text: "10 projetos e 5 DNAs de Marca", included: true },
  { text: "Landing Builder + Mentor", included: true },
  { text: "Todas as atualizações futuras", included: true },
  { text: "Colaboração e times", included: false },
];

const AGENCY_PLUS_MONTHLY = 497;
const AGENCY_PLUS_ANNUAL = 4970;

// Map plan keys to tier numbers for comparison
const PLAN_TIER: Record<string, number> = {
  free: 0,
  starter: 0.5,
  pro: 1,
  lifetime: 2, // lifetime = Pro individual (above pro but below agency)
  agency: 3,
  agency_plus: 4,
};

function CurrentPlanCard({ currentPlan, subscription }: { currentPlan: string; subscription: any }) {
  const planData = currentPlan === "lifetime"
    ? { name: "Vitalício — Pro", icon: Gem, features: lifetimeFeatures, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "ring-amber-500/30" }
    : currentPlan === "agency_plus"
      ? { name: "Agency Plus", icon: Building2, features: plans[2].features, color: "text-primary", bgColor: "bg-primary/10", borderColor: "ring-primary/30" }
      : plans.find((p) => p.key === currentPlan)
        ? { name: plans.find((p) => p.key === currentPlan)!.name, icon: plans.find((p) => p.key === currentPlan)!.icon, features: plans.find((p) => p.key === currentPlan)!.features, color: "text-primary", bgColor: "bg-primary/10", borderColor: "ring-primary/30" }
        : null;

  if (!planData || currentPlan === "free") return null;

  const Icon = planData.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="max-w-2xl mx-auto mb-10"
    >
      <div className={`premium-card p-6 ring-1 ${planData.borderColor}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${planData.bgColor}`}>
            <Icon className={`h-5 w-5 ${planData.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Seu plano: {planData.name}</h3>
            <p className="text-xs text-muted-foreground">
              {currentPlan === "lifetime" ? "Acesso permanente • Individual" : "Assinatura ativa"}
            </p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Star className="h-3 w-3" />
              Ativo
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {planData.features.filter((f) => f.included).map((f) => (
            <div key={f.text} className="flex items-center gap-2 text-sm text-foreground/80">
              <Check className={`h-3.5 w-3.5 shrink-0 ${planData.color}`} />
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {subscription && currentPlan !== "lifetime" && (
          <div className="mt-4 pt-4 border-t border-border/30 text-sm text-muted-foreground">
            Você usou <strong className="text-foreground">{subscription.generations_used}</strong> de{" "}
            <strong className="text-foreground">
              {subscription.generations_limit >= 999999 ? "∞" : subscription.generations_limit}
            </strong>{" "}
            gerações este mês.
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [slotsRemaining, setSlotsRemaining] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [agencyPlus, setAgencyPlus] = useState(false);

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
  const currentTier = PLAN_TIER[currentPlan] ?? 0;

  // Filter plans: only show plans with tier >= current (upgrades only)
  const visiblePlans = plans.filter((p) => {
    const planTier = PLAN_TIER[p.key] ?? 0;
    // Always hide plans below current tier
    if (planTier < currentTier) return false;
    // Lifetime users shouldn't see Pro (they already have Pro-level access)
    if (currentPlan === "lifetime" && p.key === "pro") return false;
    return true;
  });

  // Determine grid cols based on visible plans
  const gridCols = visiblePlans.length <= 1
    ? "grid-cols-1 max-w-md"
    : visiblePlans.length === 2
      ? "grid-cols-1 md:grid-cols-2 max-w-3xl"
      : visiblePlans.length === 3
        ? "grid-cols-1 md:grid-cols-3 max-w-5xl"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl";

  // Should show lifetime offer?
  const showLifetime = slotsRemaining !== null && slotsRemaining > 0
    && currentPlan !== "lifetime"
    && currentTier < PLAN_TIER["lifetime"];

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
            {currentTier > 0 ? "Seu plano & upgrades" : "Escolha seu plano"}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {currentTier > 0
              ? "Veja os benefícios do seu plano atual ou faça upgrade."
              : "Desbloqueie todo o poder do CopyMagic para escalar seu marketing com IA."}
          </p>
        </motion.div>

        {/* Current plan benefits card */}
        <CurrentPlanCard currentPlan={currentPlan} subscription={subscription} />

        {/* Billing toggle — only show if there are paid upgrade plans visible */}
        {visiblePlans.some((p) => p.key !== "free") && (
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
        )}

        {/* Upgrade plans */}
        {visiblePlans.length > 0 && (
          <div className={`grid ${gridCols} gap-6 mx-auto`}>
            {visiblePlans.map((plan, i) => {
              const isCurrent = currentPlan === plan.key;
              const Icon = plan.icon;

              const isAgencyCard = plan.key === "agency";
              const showPlus = isAgencyCard && agencyPlus;
              const price = plan.key === "free"
                ? 0
                : isAgencyCard
                  ? isAnnual
                    ? (showPlus ? AGENCY_PLUS_ANNUAL : plan.annualPrice)
                    : (showPlus ? AGENCY_PLUS_MONTHLY : plan.monthlyPrice)
                  : isAnnual ? plan.annualPrice : plan.monthlyPrice;

              const monthlyEquivalent = isAnnual && price > 0
                ? Math.round((price / 12) * 100) / 100
                : null;

              const seatsLabel = isAgencyCard ? (showPlus ? "15 seats" : "5 seats") : null;
              const checkoutKey = isAgencyCard && showPlus ? "agency_plus" : plan.key;

              // For paid users viewing their current plan card in grid, show as "current"
              const showAsCurrent = isCurrent || (currentPlan === "lifetime" && plan.key === "pro");

              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`premium-card p-6 flex flex-col relative ${
                    plan.highlight && !showAsCurrent
                      ? "ring-2 ring-primary shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                      : ""
                  }`}
                >
                  {plan.highlight && !showAsCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Mais popular
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {isAgencyCard && showPlus ? "Agency Plus" : plan.name}
                    </h3>
                  </div>

                  {/* Agency seats toggle */}
                  {isAgencyCard && (
                    <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-secondary/50 border border-border/30">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <button
                        onClick={() => setAgencyPlus(false)}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                          !agencyPlus ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        5 seats
                      </button>
                      <button
                        onClick={() => setAgencyPlus(true)}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                          agencyPlus ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        15 seats
                      </button>
                    </div>
                  )}

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
                            R$ {((isAgencyCard ? (showPlus ? AGENCY_PLUS_MONTHLY : plan.monthlyPrice) : plan.monthlyPrice) * 12).toLocaleString("pt-BR")}/ano
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
                    {seatsLabel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Inclui {seatsLabel} para sua equipe
                      </p>
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
                    {isAgencyCard && showPlus && (
                      <li className="flex items-start gap-2 text-sm text-foreground/80">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>15 membros na equipe</span>
                      </li>
                    )}
                  </ul>

                  {plan.key === "free" ? (
                    <Button variant="outline" disabled className="w-full">
                      {isCurrent ? "Plano atual" : "Gratuito"}
                    </Button>
                  ) : isCurrent && !(isAgencyCard && showPlus && currentPlan === "agency") ? (
                    <Button variant="outline" disabled className="w-full">
                      ✓ Plano ativo
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleCheckout(checkoutKey)}
                      disabled={!!checkingOut || loading}
                      className={`w-full gap-2 ${
                        plan.highlight
                          ? "bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
                          : ""
                      }`}
                    >
                      {checkingOut === checkoutKey
                        ? "Redirecionando..."
                        : isAgencyCard && showPlus
                          ? "Assinar Agency Plus"
                          : plan.cta}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Lifetime offer — Pro individual */}
        {showLifetime && (
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
                    <h3 className="text-xl font-bold text-foreground">Acesso Vitalício — Pro</h3>
                    <p className="text-xs text-amber-400 font-medium">Pague uma vez, use para sempre — acesso individual</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Tenha acesso <strong className="text-foreground">completo e permanente</strong> ao plano Pro — gerações ilimitadas, todos os agentes e recursos. <strong className="text-foreground">Uso individual</strong>, sem equipes.
                    </p>
                    <ul className="space-y-2">
                      {lifetimeFeatures.map((f) => (
                        <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? "text-foreground/80" : "text-muted-foreground/60"}`}>
                          {f.included ? (
                            <Check className="h-4 w-4 text-amber-400 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          )}
                          {f.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground line-through">R$ 3.492/ano (Pro anual)</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">R$ 1.997</span>
                        <span className="text-sm text-muted-foreground">único</span>
                      </div>
                      <p className="text-xs text-primary mt-1">Equivale a ~20 meses de Pro</p>
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
                    <p className="text-xs text-muted-foreground">Pagamento único • Sem mensalidade • Sem equipes</p>
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
            <p className="text-sm text-muted-foreground">
              Quer colaboração em equipe? Considere adicionar o plano <strong className="text-foreground">Agency</strong>.
            </p>
          </motion.div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
