import { useState } from "react";
import { motion } from "motion/react";
import { Check, Sparkles, Crown, Building2 } from "lucide-react";
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
    price: "R$ 0",
    period: "para sempre",
    icon: Sparkles,
    features: [
      "5 gerações por mês",
      "1 perfil de marca",
      "Acesso a todos os agentes",
      "Suporte por email",
    ],
    cta: "Plano atual",
    highlight: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    icon: Crown,
    features: [
      "100 gerações por mês",
      "5 perfis de marca",
      "Landing Builder",
      "Mentor de Riqueza",
      "Histórico ilimitado",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    key: "agency",
    name: "Agency",
    price: "R$ 297",
    period: "/mês",
    icon: Building2,
    features: [
      "Gerações ilimitadas",
      "Perfis de marca ilimitados",
      "Landing Builder",
      "Mentor de Riqueza",
      "Colaboração e times",
      "White-label (em breve)",
      "Suporte VIP",
    ],
    cta: "Assinar Agency",
    highlight: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

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
          body: JSON.stringify({ plan: planKey }),
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
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text font-[Space_Grotesk] mb-3">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Desbloqueie todo o poder do CopyMagic para escalar seu marketing com IA.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isCurrent = currentPlan === plan.key;
            const Icon = plan.icon;

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
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
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

        {subscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
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
