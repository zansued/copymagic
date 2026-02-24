import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Square,
  Copy,
  Check,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { AGENT_WORKSPACE_CONFIGS } from "@/lib/agent-workspace-configs";
import { GUIDED_STEPS } from "@/lib/guided-flow-config";
import { profileToMarkdown } from "@/lib/brand-profile-types";
import ReactMarkdown from "react-markdown";
import { AiSuggestButton } from "@/components/agent/AiSuggestButton";
import { GenerationHistory } from "@/components/agent/GenerationHistory";

interface ProjectOption {
  id: string;
  name: string;
}

interface BrandProfileOption {
  id: string;
  name: string;
  is_default: boolean;
}

export default function GuidedCampaignWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Project & Brand state
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [profiles, setProfiles] = useState<BrandProfileOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get("projectId") || "");
  const [selectedProfileId, setSelectedProfileId] = useState(searchParams.get("profileId") || "");
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [stepOutputs, setStepOutputs] = useState<Record<string, string>>({});
  const [stepStatuses, setStepStatuses] = useState<Record<string, "pending" | "generated" | "audited">>({});
  const [wizardStarted, setWizardStarted] = useState(false);

  // Generation state
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [provider] = useState<"deepseek" | "openai">("deepseek");
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const step = GUIDED_STEPS[currentStep];
  const config = step ? AGENT_WORKSPACE_CONFIGS[step.agentId] : null;

  // Load projects & profiles
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("projects").select("id, name").eq("user_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("brand_profiles").select("id, name, is_default").eq("user_id", user.id).order("is_default", { ascending: false }),
    ]).then(([projRes, profRes]) => {
      setProjects(projRes.data || []);
      setProfiles(profRes.data || []);
      // Auto-select defaults
      if (!selectedProjectId && projRes.data?.length) {
        setSelectedProjectId(projRes.data[0].id);
      }
      if (!selectedProfileId && profRes.data?.length) {
        const def = profRes.data.find((p) => p.is_default) || profRes.data[0];
        if (def) setSelectedProfileId(def.id);
      }
    });
  }, [user]);

  // Load existing copy_results when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    supabase
      .from("projects")
      .select("copy_results")
      .eq("id", selectedProjectId)
      .single()
      .then(({ data }) => {
        if (data?.copy_results && typeof data.copy_results === "object") {
          const cr = data.copy_results as Record<string, any>;
          const outputs: Record<string, string> = {};
          const statuses: Record<string, "pending" | "generated" | "audited"> = {};
          GUIDED_STEPS.forEach((s) => {
            if (s.copyKey && cr[s.copyKey]) {
              outputs[s.id] = cr[s.copyKey];
              statuses[s.id] = cr.audit_last?.[s.copyKey] ? "audited" : "generated";
            } else {
              statuses[s.id] = "pending";
            }
          });
          setStepOutputs(outputs);
          setStepStatuses(statuses);
        }
      });
  }, [selectedProjectId]);

  // Initialize inputs when step changes
  useEffect(() => {
    if (!config) return;
    const defaults: Record<string, string> = {};
    for (const input of config.inputs) {
      if (input.type === "select" && input.options?.length) {
        defaults[input.key] = input.options[0].value;
      }
    }
    // Pre-fill with context from previous steps
    if (step.agentId !== "icp-profile" && step.agentId !== "audit-premium") {
      const contextParts: string[] = [];
      GUIDED_STEPS.forEach((s) => {
        if (s.id !== step.id && stepOutputs[s.id]) {
          contextParts.push(`## ${s.label}\n${stepOutputs[s.id].slice(0, 2000)}`);
        }
      });
      if (contextParts.length) {
        const firstTextarea = config.inputs.find((i) => i.type === "textarea" && i.required);
        if (firstTextarea) {
          defaults[firstTextarea.key] = contextParts.join("\n\n---\n\n");
        }
      }
    }
    // For audit, pre-fill with landing or ads content
    if (step.agentId === "audit-premium") {
      const auditContent = stepOutputs["landing"] || stepOutputs["ads"] || "";
      const firstTextarea = config.inputs.find((i) => i.type === "textarea" && i.required);
      if (firstTextarea && auditContent) {
        defaults[firstTextarea.key] = auditContent;
      }
    }
    setInputs(defaults);
    // Show existing output if available
    if (stepOutputs[step.id]) {
      setOutput(stepOutputs[step.id]);
    } else {
      setOutput("");
    }
  }, [currentStep, config]);

  const handleStartWizard = () => {
    if (!selectedProjectId || !selectedProfileId) {
      setShowSetupModal(true);
      return;
    }
    setWizardStarted(true);
  };

  const handleCreateProject = async () => {
    if (!user || !newProjectName.trim()) return;
    setCreatingProject(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: newProjectName.trim(), product_input: "" })
      .select("id, name")
      .single();
    if (error) {
      toast({ title: "Erro ao criar projeto", variant: "destructive" });
    } else if (data) {
      setProjects((prev) => [data, ...prev]);
      setSelectedProjectId(data.id);
      setNewProjectName("");
      toast({ title: "Projeto criado!" });
    }
    setCreatingProject(false);
  };

  const saveToCopyResults = async (copyKey: string, content: string) => {
    if (!selectedProjectId || !copyKey) return;
    const { data: proj } = await supabase
      .from("projects")
      .select("copy_results")
      .eq("id", selectedProjectId)
      .single();
    const cr = (proj?.copy_results && typeof proj.copy_results === "object"
      ? proj.copy_results
      : {}) as Record<string, any>;
    cr[copyKey] = content;
    await supabase.from("projects").update({ copy_results: cr }).eq("id", selectedProjectId);
  };

  const saveAuditResult = async (target: string, auditData: string) => {
    if (!selectedProjectId) return;
    const { data: proj } = await supabase
      .from("projects")
      .select("copy_results")
      .eq("id", selectedProjectId)
      .single();
    const cr = (proj?.copy_results && typeof proj.copy_results === "object"
      ? proj.copy_results
      : {}) as Record<string, any>;
    // audit_last
    if (!cr.audit_last) cr.audit_last = {};
    cr.audit_last[target] = { text: auditData, timestamp: new Date().toISOString() };
    // audit_history (limit 5 per target)
    if (!cr.audit_history) cr.audit_history = {};
    if (!cr.audit_history[target]) cr.audit_history[target] = [];
    cr.audit_history[target].unshift({ text: auditData, timestamp: new Date().toISOString() });
    cr.audit_history[target] = cr.audit_history[target].slice(0, 5);
    await supabase.from("projects").update({ copy_results: cr }).eq("id", selectedProjectId);
  };

  const handleGenerate = useCallback(async () => {
    if (!config || !step) return;
    const requiredMissing = config.inputs
      .filter((i) => i.required)
      .some((i) => !String(inputs[i.key] || "").trim());
    if (requiredMissing) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setOutput("");

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

    const systemPrompt = config.buildPrompt(inputs, brandContext);
    abortRef.current = new AbortController();
    const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-generate`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Você precisa estar logado");

      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ system_prompt: systemPrompt, provider }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro na requisição" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Stream não disponível");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setOutput(accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      setIsGenerating(false);

      // Save output
      if (accumulated) {
        setStepOutputs((prev) => ({ ...prev, [step.id]: accumulated }));

        if (step.copyKey) {
          await saveToCopyResults(step.copyKey, accumulated);
          setStepStatuses((prev) => ({ ...prev, [step.id]: "generated" }));
        } else if (step.agentId === "audit-premium") {
          // Determine audit target
          const auditTarget = stepOutputs["landing"] ? "pagina_vendas" : "anuncios";
          await saveAuditResult(auditTarget, accumulated);
          setStepStatuses((prev) => ({ ...prev, [step.id]: "generated" }));
        }

        // Save to agent_generations
        if (user && config) {
          await supabase.from("agent_generations").insert({
            user_id: user.id,
            agent_id: step.agentId,
            agent_name: config.name,
            inputs,
            output: accumulated,
            provider,
            brand_profile_id: selectedProfileId || null,
          });
        }

        toast({ title: `✅ ${step.label} concluído!` });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
        setOutput(`❌ Erro: ${err.message}`);
      }
      setIsGenerating(false);
    }
  }, [config, inputs, selectedProfileId, provider, user, step, stepOutputs]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGoNext = currentStep < GUIDED_STEPS.length - 1 && stepStatuses[step?.id] !== "pending";
  const canGoPrev = currentStep > 0;

  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isGenerating]);

  // ─── SETUP MODAL ────────────────────────────────────
  if (!wizardStarted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="glass-header sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/agents")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold gradient-text">🚀 Campanha de Venda Direta</h1>
              <p className="text-xs text-muted-foreground">Fluxo Guiado V1 — 6 etapas estratégicas</p>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          {/* Steps overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {GUIDED_STEPS.map((s, i) => (
              <div key={s.id} className="premium-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-xs text-muted-foreground font-medium">Etapa {i + 1}</span>
                </div>
                <h3 className="font-semibold text-sm text-foreground">{s.label}</h3>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>

          {/* Project & Brand selection */}
          <div className="premium-card p-6 space-y-5">
            <h2 className="text-lg font-bold text-foreground">Configuração da Campanha</h2>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Projeto</Label>
              {projects.length > 0 ? (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Nenhum projeto encontrado. Crie um:</p>
                  <div className="flex gap-2">
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Nome do projeto"
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleCreateProject} disabled={creatingProject || !newProjectName.trim()}>
                      {creatingProject ? "..." : "Criar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">DNA de Marca</Label>
              {profiles.length > 0 ? (
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
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
              ) : (
                <div className="text-xs text-muted-foreground">
                  Nenhum DNA.{" "}
                  <button onClick={() => navigate("/brand-profiles")} className="text-primary underline">
                    Criar perfil
                  </button>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
              disabled={!selectedProjectId || !selectedProfileId}
              onClick={handleStartWizard}
            >
              <Sparkles className="h-5 w-5" />
              Começar Campanha
            </Button>
          </div>
        </div>

        {/* Setup modal for creating project inline */}
        <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuração necessária</DialogTitle>
              <DialogDescription>
                Selecione ou crie um projeto e DNA de marca para iniciar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!selectedProjectId && (
                <div className="space-y-2">
                  <Label>Criar Projeto</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Nome do projeto"
                    />
                    <Button onClick={handleCreateProject} disabled={creatingProject}>
                      {creatingProject ? "..." : "Criar"}
                    </Button>
                  </div>
                </div>
              )}
              {!selectedProfileId && profiles.length === 0 && (
                <Button variant="outline" onClick={() => navigate("/brand-profiles")}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Criar DNA de Marca
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── WIZARD VIEW ────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setWizardStarted(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold gradient-text">Campanha de Venda Direta</h1>
              <p className="text-xs text-muted-foreground">
                Etapa {currentStep + 1} de {GUIDED_STEPS.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={() => setCurrentStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!canGoNext} onClick={() => setCurrentStep((s) => s + 1)} className="gap-1">
              Próximo passo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Step progress bar */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-1">
          {GUIDED_STEPS.map((s, i) => {
            const status = stepStatuses[s.id] || "pending";
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`flex-1 flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                  i === currentStep
                    ? "border-primary bg-primary/10 text-primary"
                    : status === "generated"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                    : status === "audited"
                    ? "border-amber-500/30 bg-amber-500/5 text-amber-400"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                <span>{status === "generated" ? "✅" : status === "audited" ? "🏆" : s.emoji}</span>
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {config && step && (
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Inputs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{step.emoji}</span>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{step.label}</h2>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {config.inputs.map((input) => (
                <div key={input.key} className="premium-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">
                      {input.label} {input.required && <span className="text-destructive">*</span>}
                    </Label>
                    {input.type === "textarea" && (
                      <AiSuggestButton
                        inputLabel={input.label}
                        inputPlaceholder={input.placeholder || ""}
                        agentName={config.name}
                        selectedProfileId={selectedProfileId}
                        projectId={selectedProjectId}
                        onSuggestion={(text) => setInputs((p) => ({ ...p, [input.key]: text }))}
                      />
                    )}
                  </div>
                  {input.type === "textarea" && (
                    <Textarea
                      value={inputs[input.key] || ""}
                      onChange={(e) => setInputs((p) => ({ ...p, [input.key]: e.target.value }))}
                      placeholder={input.placeholder}
                      className={`text-sm leading-relaxed resize ${input.required ? "min-h-[140px]" : "min-h-[80px]"}`}
                    />
                  )}
                  {input.type === "input" && (
                    <Input
                      value={inputs[input.key] || ""}
                      onChange={(e) => setInputs((p) => ({ ...p, [input.key]: e.target.value }))}
                      placeholder={input.placeholder}
                      className="text-sm"
                    />
                  )}
                  {input.type === "select" && input.options && (
                    <Select
                      value={inputs[input.key] || input.options[0].value}
                      onValueChange={(v) => setInputs((p) => ({ ...p, [input.key]: v }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {input.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              <div className="flex gap-3">
                {isGenerating ? (
                  <Button onClick={handleStop} variant="destructive" className="flex-1 gap-2">
                    <Square className="h-4 w-4" />
                    Parar
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={config.inputs.filter((i) => i.required).some((i) => !String(inputs[i.key] || "").trim())}
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar {step.label}
                  </Button>
                )}
              </div>
            </div>

            {/* Right: Output */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Resultado</h2>
                {output && !isGenerating && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copiado!" : "Copiar"}
                    </Button>
                    {canGoNext && (
                      <Button
                        size="sm"
                        onClick={() => setCurrentStep((s) => s + 1)}
                        className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
                      >
                        Próximo passo
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {currentStep === GUIDED_STEPS.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/agents")}
                        className="gap-1.5 text-xs"
                      >
                        Concluir 🎉
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="premium-card min-h-[500px] max-h-[75vh] overflow-y-auto">
                <div ref={outputRef} className="p-5">
                  {output ? (
                    <div className="prose-premium max-w-none">
                      <ReactMarkdown>{output}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                      <span className="text-6xl opacity-30">{step.emoji}</span>
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-sm">Preencha os campos e gere o conteúdo</p>
                        <p className="text-muted-foreground/60 text-xs">{step.description}</p>
                      </div>
                    </div>
                  )}
                  {isGenerating && (
                    <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
                  )}
              </div>

              {/* Generation History */}
              {user && step && (
                <GenerationHistory
                  agentId={step.agentId}
                  userId={user.id}
                  onLoad={(historyOutput) => {
                    setOutput(historyOutput);
                    setStepOutputs((prev) => ({ ...prev, [step.id]: historyOutput }));
                    if (step.copyKey) {
                      saveToCopyResults(step.copyKey, historyOutput);
                      setStepStatuses((prev) => ({ ...prev, [step.id]: "generated" }));
                    }
                  }}
                />
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
