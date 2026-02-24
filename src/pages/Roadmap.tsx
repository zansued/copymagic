import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { FLOW_TEMPLATES } from "@/lib/flow-templates";
import {
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Trash2,
  Plus,
  Map,
  CheckCircle2,
  Circle,
  Loader2,
  ExternalLink,
  FileDown,
} from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { OnboardingTour, TourStep } from "@/components/onboarding/OnboardingTour";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { profileToMarkdown } from "@/lib/brand-profile-types";

interface RoadmapStep {
  order: number;
  title: string;
  description: string;
  tip: string;
  agent_id: string | null;
  agent_name: string | null;
  emoji: string;
  completed?: boolean;
}

interface RoadmapData {
  id: string;
  title: string;
  objective: string;
  steps: RoadmapStep[];
  created_at: string;
  brand_profile_id: string | null;
}

interface BrandProfileOption {
  id: string;
  name: string;
  is_default: boolean;
}

export default function Roadmap() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [objective, setObjective] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profiles, setProfiles] = useState<BrandProfileOption[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmaps, setRoadmaps] = useState<RoadmapData[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<RoadmapData | null>(null);
  const [view, setView] = useState<"list" | "create" | "detail">("list");

  const tourSteps: TourStep[] = [
    {
      target: "[data-tour='roadmap-welcome']",
      title: "🗺️ Bem-vindo ao Roadmap",
      description: "Este é o seu ponto de partida. Aqui você cria um plano estratégico personalizado com IA para atingir seus objetivos no digital.",
      position: "bottom",
    },
    {
      target: "[data-tour='roadmap-cta']",
      title: "✨ Crie seu primeiro mapa",
      description: "Clique aqui para descrever seu objetivo. A IA vai gerar um passo-a-passo completo conectado aos agentes que executam o trabalho.",
      position: "bottom",
    },
    {
      target: "[data-tour='nav-agents']",
      title: "🤖 Central de Agentes",
      description: "Seus agentes de IA especializados: copywriting, branding, ofertas e mais. O Roadmap vai linkar direto para eles.",
      position: "bottom",
    },
    {
      target: "[data-tour='nav-dna']",
      title: "🧬 DNA de Marca",
      description: "Configure o perfil da sua marca aqui. Quanto mais completo, mais personalizadas serão as gerações de todos os agentes.",
      position: "bottom",
    },
    {
      target: "[data-tour='nav-mentor']",
      title: "🧠 Mentor IA",
      description: "Seu consultor estratégico pessoal. Tire dúvidas, peça conselhos e receba orientação inteligente a qualquer momento.",
      position: "bottom",
    },
  ];

  // Load profiles
  useEffect(() => {
    if (!user) return;
    supabase
      .from("brand_profiles")
      .select("id, name, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        const list = data || [];
        setProfiles(list);
        const def = list.find((p) => p.is_default) || list[0];
        if (def) setSelectedProfileId(def.id);
        setProfilesLoading(false);
      });
  }, [user]);

  // Load roadmaps
  useEffect(() => {
    if (!user) return;
    loadRoadmaps();
  }, [user]);

  const loadRoadmaps = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setRoadmaps(
        data.map((r: any) => ({
          id: r.id,
          title: r.title,
          objective: r.objective,
          steps: (r.steps as unknown as RoadmapStep[]) || [],
          created_at: r.created_at,
          brand_profile_id: r.brand_profile_id,
        }))
      );
    }
  };

  const handleGenerate = async () => {
    if (!objective.trim()) {
      toast({ title: "Descreva seu objetivo", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    let brandContext = "";
    if (selectedProfileId) {
      const { data: profile } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("id", selectedProfileId)
        .single();
      if (profile) {
        brandContext = profileToMarkdown(profile.name, {
          brand_identity: profile.brand_identity as any,
          brand_voice: profile.brand_voice as any,
          target_audience: profile.target_audience as any,
          product_service: profile.product_service as any,
          credentials: profile.credentials as any,
        });
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ objective, brand_context: brandContext }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro na geração");
      }

      const result = await resp.json();

      // Save to DB
      const { data: saved, error } = await supabase
        .from("roadmaps")
        .insert({
          user_id: user!.id,
          title: result.title || "Meu Roadmap",
          objective,
          steps: result.steps || [],
          brand_profile_id: selectedProfileId || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newRoadmap: RoadmapData = {
        id: saved.id,
        title: saved.title,
        objective: saved.objective,
        steps: (saved.steps as unknown as RoadmapStep[]) || [],
        created_at: saved.created_at,
        brand_profile_id: saved.brand_profile_id,
      };

      setRoadmaps((prev) => [newRoadmap, ...prev]);
      setActiveRoadmap(newRoadmap);
      setView("detail");
      setObjective("");
      toast({ title: "Roadmap criado! 🗺️" });
    } catch (err: any) {
      console.error(err);
      toast({ title: err.message || "Erro ao gerar roadmap", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStepComplete = async (roadmap: RoadmapData, stepOrder: number) => {
    const updatedSteps = roadmap.steps.map((s) =>
      s.order === stepOrder ? { ...s, completed: !s.completed } : s
    );
    const updated = { ...roadmap, steps: updatedSteps };
    setActiveRoadmap(updated);
    setRoadmaps((prev) => prev.map((r) => (r.id === roadmap.id ? updated : r)));

    await supabase
      .from("roadmaps")
      .update({ steps: updatedSteps as any })
      .eq("id", roadmap.id);
  };

  const deleteRoadmap = async (id: string) => {
    await supabase.from("roadmaps").delete().eq("id", id);
    setRoadmaps((prev) => prev.filter((r) => r.id !== id));
    if (activeRoadmap?.id === id) {
      setActiveRoadmap(null);
      setView("list");
    }
    toast({ title: "Roadmap excluído" });
  };

  const completedCount = (steps: RoadmapStep[]) => steps.filter((s) => s.completed).length;

  const escapeHtml = (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const handleExportPdf = (roadmap: RoadmapData) => {
    const done = completedCount(roadmap.steps);
    const total = roadmap.steps.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const stepsHtml = roadmap.steps
      .sort((a, b) => a.order - b.order)
      .map(
        (step) => `
        <div style="display:flex;gap:16px;margin-bottom:20px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid ${step.completed ? '#7c3aed' : '#ccc'};background:${step.completed ? 'rgba(124,58,237,0.15)' : 'transparent'};color:#000;">
              ${step.completed ? '✓' : step.order}
            </div>
          </div>
          <div style="flex:1;border:1px solid #ddd;border-radius:12px;padding:16px;${step.completed ? 'border-color:rgba(124,58,237,0.3);' : ''}">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:18px;">${escapeHtml(step.emoji)}</span>
              <span style="font-size:11px;color:#7c3aed;font-weight:600;">Passo ${step.order}</span>
              ${step.agent_name ? `<span style="font-size:10px;color:#888;margin-left:auto;">🤖 ${escapeHtml(step.agent_name)}</span>` : ''}
            </div>
            <h3 style="font-size:15px;font-weight:700;color:${step.completed ? '#999' : '#111'};margin:0 0 6px;${step.completed ? 'text-decoration:line-through;' : ''}">${escapeHtml(step.title)}</h3>
            <p style="font-size:12px;color:#555;line-height:1.6;margin:0;">${escapeHtml(step.description)}</p>
            ${step.tip ? `<div style="margin-top:10px;padding:10px 12px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.12);border-radius:8px;font-size:11px;color:#666;line-height:1.5;">💡 ${escapeHtml(step.tip)}</div>` : ''}
          </div>
        </div>`
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(roadmap.title)}</title>
<style>
  @media print { html, body { background:#fff!important; color:#000!important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#000;background:#fff;padding:40px;font-size:14px;line-height:1.7;max-width:800px;margin:0 auto;}
</style></head><body>
  <div style="text-align:center;margin-bottom:36px;">
    <div style="font-size:40px;margin-bottom:8px;">🗺️</div>
    <h1 style="font-size:24px;font-weight:800;margin:0;color:#7c3aed;">${escapeHtml(roadmap.title)}</h1>
    <p style="font-size:13px;color:#666;margin:8px auto 16px;max-width:420px;line-height:1.5;">${escapeHtml(roadmap.objective)}</p>
    <div style="display:inline-flex;align-items:center;gap:10px;border:1px solid #ddd;border-radius:20px;padding:8px 20px;">
      <span style="font-size:12px;color:#666;">${done}/${total} concluídos</span>
      <div style="width:80px;height:6px;border-radius:3px;background:#eee;overflow:hidden;">
        <div style="height:100%;width:${pct}%;border-radius:3px;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></div>
      </div>
      <span style="font-size:12px;color:#7c3aed;font-weight:700;">${pct}%</span>
    </div>
  </div>
  ${stepsHtml}
  <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #eee;">
    <p style="font-size:10px;color:#999;">Gerado por CopyMagic • ${new Date().toLocaleDateString("pt-BR")}</p>
  </div>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Permita popups para exportar", variant: "destructive" }); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { setTimeout(() => win.print(), 400); };
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <OnboardingTour steps={tourSteps} storageKey="onboarding-home-v1" />
      {/* Sub-header */}
      <header className="border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== "list" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("list")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3" data-tour="roadmap-welcome">
              <span className="text-3xl">🗺️</span>
              <div>
                <h1 className="text-xl font-bold gradient-text">Roadmap</h1>
                <p className="text-xs text-muted-foreground">Seu mapa estratégico personalizado</p>
              </div>
            </div>
          </div>
          {view === "list" && (
            <Button
              data-tour="roadmap-cta"
              onClick={() => setView("create")}
              className="gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Novo Roadmap
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* ── LIST VIEW ── */}
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {roadmaps.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center min-h-[450px] text-center space-y-8"
                >
                  <div className="relative">
                    <span className="text-8xl block">🗺️</span>
                    <motion.div
                      className="absolute -top-2 -right-2"
                      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-6 w-6 text-primary" />
                    </motion.div>
                  </div>

                  <div className="space-y-3 max-w-lg">
                    <h2 className="text-2xl font-bold gradient-text">
                      Bem-vindo ao seu ponto de partida 🚀
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Não sabe por onde começar? Diga seu objetivo e a IA cria um{" "}
                      <span className="text-primary font-medium">mapa estratégico personalizado</span>{" "}
                      com cada passo que você precisa dar — conectado diretamente aos agentes que vão
                      executar o trabalho por você.
                    </p>
                  </div>

                  <Button
                    onClick={() => setView("create")}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90 text-base px-8"
                  >
                    <Sparkles className="h-5 w-5" />
                    Criar meu primeiro Roadmap
                  </Button>

                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {["🎯 Define seus passos", "🤖 Conecta aos agentes", "✅ Acompanha progresso"].map((item) => (
                      <span
                        key={item}
                        className="text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border/60 bg-muted/30"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roadmaps.map((rm, i) => {
                    const done = completedCount(rm.steps);
                    const total = rm.steps.length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <motion.button
                        key={rm.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => {
                          setActiveRoadmap(rm);
                          setView("detail");
                        }}
                        className="premium-card p-5 text-left w-full group hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Map className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {rm.title}
                            </h3>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoadmap(rm.id);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                          {rm.objective}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {done}/{total} passos
                            </span>
                            <span className="text-primary font-medium">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CREATE VIEW ── */}
          {view === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="premium-card p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qual é o seu objetivo? *</Label>
                  <Textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="Ex: 'Quero lançar meu primeiro infoproduto sobre fitness', 'Preciso montar um funil de vendas para meu curso de inglês', 'Quero começar a vender como afiliado no digital'..."
                    className="min-h-[140px] text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">DNA de Campanha</Label>
                  {profilesLoading ? (
                    <div className="text-xs text-muted-foreground animate-pulse">Carregando...</div>
                  ) : profiles.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      Nenhum DNA.{" "}
                      <button
                        onClick={() => navigate("/brand-profiles")}
                        className="text-primary underline"
                      >
                        Criar
                      </button>
                    </div>
                  ) : (
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecione o DNA" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.is_default ? "⭐" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Suggested objectives */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground font-medium">Sugestões rápidas</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Lançar meu primeiro infoproduto",
                    "Criar um funil de vendas completo",
                    "Começar a vender como afiliado",
                    "Escalar meu negócio digital com tráfego pago",
                    "Monetizar minha audiência nas redes sociais",
                    "Criar uma oferta high ticket",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setObjective(s)}
                      className="px-3 py-1.5 text-xs rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!objective.trim() || isGenerating}
                className="w-full gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando roadmap...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Roadmap
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* ── DETAIL VIEW ── */}
          {view === "detail" && activeRoadmap && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Title + Export */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold gradient-text">{activeRoadmap.title}</h2>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  {activeRoadmap.objective}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <span className="text-xs text-muted-foreground">
                    {completedCount(activeRoadmap.steps)}/{activeRoadmap.steps.length} concluídos
                  </span>
                  <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground transition-all duration-500"
                      style={{
                        width: `${
                          activeRoadmap.steps.length > 0
                            ? Math.round(
                                (completedCount(activeRoadmap.steps) / activeRoadmap.steps.length) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPdf(activeRoadmap)}
                    className="gap-1.5 text-xs"
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-border hidden sm:block" />

                <div className="space-y-4">
                  {activeRoadmap.steps
                    .sort((a, b) => a.order - b.order)
                    .map((step, i) => (
                      <motion.div
                        key={step.order}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="relative flex gap-4 sm:gap-6"
                      >
                        {/* Timeline dot */}
                        <button
                          onClick={() => toggleStepComplete(activeRoadmap, step.order)}
                          className="relative z-10 shrink-0 mt-1"
                        >
                          {step.completed ? (
                            <CheckCircle2 className="h-8 w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
                          ) : (
                            <Circle className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>

                        {/* Card */}
                        <div
                          className={`premium-card p-5 flex-1 transition-all ${
                            step.completed
                              ? "border-primary/20 bg-primary/5"
                              : "hover:border-primary/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{step.emoji}</span>
                              <span className="text-xs font-medium text-primary">
                                Passo {step.order}
                              </span>
                            </div>
                            {step.agent_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/agents/${step.agent_id}`)}
                                className="gap-1.5 text-xs text-primary hover:text-primary shrink-0"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {step.agent_name || "Usar agente"}
                              </Button>
                            )}
                          </div>

                          <h3
                            className={`font-semibold mb-1 ${
                              step.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                            {step.description}
                          </p>
                          {step.tip && (
                            <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                              <span className="text-sm">💡</span>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {step.tip}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
