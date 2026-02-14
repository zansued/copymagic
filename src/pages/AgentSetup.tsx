import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { PROFILE_SECTIONS } from "@/lib/brand-profile-types";

interface ProfileOption {
  id: string;
  name: string;
  is_default: boolean;
  personality_summary: string;
  audience_summary: string;
  product_summary: string;
  brand_identity: any;
  brand_voice: any;
  target_audience: any;
  product_service: any;
  credentials: any;
  updated_at: string;
}

export default function AgentSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("brand_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setProfiles(data || []);
        setLoading(false);
      });
  }, [user]);

  const handleSelect = async (profile: ProfileOption) => {
    if (!user) return;
    setSaving(true);

    // Set selected as default, unset others
    await supabase.from("brand_profiles").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("brand_profiles").update({ is_default: true }).eq("id", profile.id);

    // Sync to agent_configs for backward compatibility
    const personality = [
      profile.personality_summary,
      profile.brand_voice?.voice_essence,
      profile.brand_voice?.brand_persona,
    ].filter(Boolean).join(". ").slice(0, 500) || "Perfil configurado via DNA";

    const audience = [
      profile.audience_summary,
      profile.target_audience?.demographics,
      profile.target_audience?.central_problem,
    ].filter(Boolean).join(". ").slice(0, 500) || "Público configurado via DNA";

    const product = [
      profile.product_summary,
      profile.product_service?.offer_name,
      profile.product_service?.main_promise,
    ].filter(Boolean).join(". ").slice(0, 500) || "Produto configurado via DNA";

    const { data: existing } = await supabase
      .from("agent_configs")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("agent_configs").update({
        brand_personality: personality,
        target_audience: audience,
        product_service: product,
      }).eq("user_id", user.id);
    } else {
      await supabase.from("agent_configs").insert({
        user_id: user.id,
        brand_personality: personality,
        target_audience: audience,
        product_service: product,
      });
    }

    toast({ title: "✅ Perfil selecionado!", description: "Seus agentes estão prontos." });
    navigate("/agents");
  };

  const getCompletion = (profile: ProfileOption): number => {
    let filled = 0, total = 0;
    for (const section of PROFILE_SECTIONS) {
      const data = (profile[section.key as keyof ProfileOption] || {}) as Record<string, string>;
      for (const field of section.fields) {
        total++;
        if (typeof data[field.key] === "string" && data[field.key].trim()) filled++;
      }
    }
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/agents")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold gradient-text">Configurar Agentes</h1>
              <p className="text-xs text-muted-foreground">Selecione o DNA de Marca para seus agentes</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-3xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <span className="text-5xl">🧬</span>
            <h2 className="text-2xl font-bold text-foreground">
              Escolha seu DNA de Marca
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Os agentes usarão o perfil selecionado como contexto estratégico para gerar resultados personalizados.
            </p>
          </motion.div>

          {profiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-4 py-10"
            >
              <p className="text-muted-foreground">
                Você ainda não tem perfis de DNA. Crie um para começar!
              </p>
              <Button
                onClick={() => navigate("/brand-profiles")}
                className="gap-2 premium-button border-0 text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Criar DNA de Marca
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((profile, i) => {
                const completion = getCompletion(profile);
                return (
                  <motion.button
                    key={profile.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelect(profile)}
                    disabled={saving}
                    className={`premium-card p-5 text-left w-full group relative transition-all hover:border-primary/30 ${
                      profile.is_default ? "ring-2 ring-primary/30" : ""
                    }`}
                  >
                    {profile.is_default && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                        <Check className="h-3 w-3" />
                        Atual
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🧬</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {profile.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Atualizado {new Date(profile.updated_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      {/* Completion bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Preenchimento</span>
                          <span className={completion === 100 ? "text-green-400 font-medium" : "text-muted-foreground"}>
                            {completion}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${completion}%`,
                              background: completion === 100
                                ? "hsl(142, 71%, 45%)"
                                : "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))",
                            }}
                          />
                        </div>
                      </div>

                      {/* Summaries */}
                      {profile.personality_summary && (
                        <p className="text-xs text-muted-foreground truncate">
                          🎭 {profile.personality_summary}
                        </p>
                      )}
                      {profile.audience_summary && (
                        <p className="text-xs text-muted-foreground truncate">
                          🎯 {profile.audience_summary}
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Create new link */}
          {profiles.length > 0 && (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/brand-profiles")}
                className="text-sm text-muted-foreground hover:text-foreground gap-2"
              >
                <Plus className="h-4 w-4" />
                Gerenciar perfis de DNA
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
