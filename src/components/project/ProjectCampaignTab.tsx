import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Square,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { AGENT_WORKSPACE_CONFIGS } from "@/lib/agent-workspace-configs";
import { GUIDED_STEPS } from "@/lib/guided-flow-config";
import { profileToMarkdown } from "@/lib/brand-profile-types";
import ReactMarkdown from "react-markdown";
import { AiSuggestButton } from "@/components/agent/AiSuggestButton";
import { GenerationHistory } from "@/components/agent/GenerationHistory";

interface BrandProfileOption {
  id: string;
  name: string;
  is_default: boolean;
}

interface Props {
  projectId: string;
}

export function ProjectCampaignTab({ projectId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<BrandProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const [currentStep, setCurrentStep] = useState(0);
  const [stepOutputs, setStepOutputs] = useState<Record<string, string>>({});
  const [stepStatuses, setStepStatuses] = useState<Record<string, "pending" | "generated" | "audited">>({});

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [provider] = useState<"deepseek" | "openai">("deepseek");
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const step = GUIDED_STEPS[currentStep];
  const config = step ? AGENT_WORKSPACE_CONFIGS[step.agentId] : null;

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
      });
  }, [user]);

  // Load existing copy_results
  useEffect(() => {
    if (!projectId) return;
    supabase
      .from("projects")
      .select("copy_results")
      .eq("id", projectId)
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
  }, [projectId]);

  // Initialize inputs when step changes
  useEffect(() => {
    if (!config) return;
    const defaults: Record<string, string> = {};
    for (const input of config.inputs) {
      if (input.type === "select" && input.options?.length) {
        defaults[input.key] = input.options[0].value;
      }
    }
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
    if (step.agentId === "audit-premium") {
      const auditContent = stepOutputs["landing"] || stepOutputs["ads"] || "";
      const firstTextarea = config.inputs.find((i) => i.type === "textarea" && i.required);
      if (firstTextarea && auditContent) {
        defaults[firstTextarea.key] = auditContent;
      }
    }
    setInputs(defaults);
    setOutput(stepOutputs[step.id] || "");
  }, [currentStep, config]);

  const saveToCopyResults = async (copyKey: string, content: string) => {
    if (!projectId || !copyKey) return;
    const { data: proj } = await supabase
      .from("projects")
      .select("copy_results")
      .eq("id", projectId)
      .single();
    const cr = (proj?.copy_results && typeof proj.copy_results === "object"
      ? proj.copy_results
      : {}) as Record<string, any>;
    cr[copyKey] = content;
    await supabase.from("projects").update({ copy_results: cr }).eq("id", projectId);
  };

  const saveAuditResult = async (target: string, auditData: string) => {
    if (!projectId) return;
    const { data: proj } = await supabase
      .from("projects")
      .select("copy_results")
      .eq("id", projectId)
      .single();
    const cr = (proj?.copy_results && typeof proj.copy_results === "object"
      ? proj.copy_results
      : {}) as Record<string, any>;
    if (!cr.audit_last) cr.audit_last = {};
    cr.audit_last[target] = { text: auditData, timestamp: new Date().toISOString() };
    if (!cr.audit_history) cr.audit_history = {};
    if (!cr.audit_history[target]) cr.audit_history[target] = [];
    cr.audit_history[target].unshift({ text: auditData, timestamp: new Date().toISOString() });
    cr.audit_history[target] = cr.audit_history[target].slice(0, 5);
    await supabase.from("projects").update({ copy_results: cr }).eq("id", projectId);
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

      if (accumulated) {
        setStepOutputs((prev) => ({ ...prev, [step.id]: accumulated }));

        if (step.copyKey) {
          await saveToCopyResults(step.copyKey, accumulated);
          setStepStatuses((prev) => ({ ...prev, [step.id]: "generated" }));
        } else if (step.agentId === "audit-premium") {
          const auditTarget = stepOutputs["landing"] ? "pagina_vendas" : "anuncios";
          await saveAuditResult(auditTarget, accumulated);
          setStepStatuses((prev) => ({ ...prev, [step.id]: "generated" }));
        }

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
  }, [config, inputs, selectedProfileId, provider, user, step, stepOutputs, projectId]);

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

  const completedSteps = Object.values(stepStatuses).filter((s) => s !== "pending").length;
  const progressPct = Math.round((completedSteps / GUIDED_STEPS.length) * 100);

  return (
    <div className="space-y-4">
      {/* DNA selector + progress */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <h2 className="text-base font-bold text-foreground">Campanha de Venda Direta</h2>
            <p className="text-xs text-muted-foreground">
              {completedSteps}/{GUIDED_STEPS.length} etapas • {progressPct}% concluído
            </p>
          </div>
        </div>
        {profiles.length > 0 && (
          <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
            <SelectTrigger className="w-48 text-xs h-8">
              <SelectValue placeholder="DNA de Marca" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name} {p.is_default ? "⭐" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step progress tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {GUIDED_STEPS.map((s, i) => {
          const status = stepStatuses[s.id] || "pending";
          return (
            <button
              key={s.id}
              onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
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
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {config && step && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Inputs */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{step.emoji}</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">{step.label}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>

            {config.inputs.map((input) => (
              <div key={input.key} className="premium-card p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    {input.label} {input.required && <span className="text-destructive">*</span>}
                  </Label>
                  {input.type === "textarea" && (
                    <AiSuggestButton
                      inputLabel={input.label}
                      inputPlaceholder={input.placeholder || ""}
                      agentName={config.name}
                      selectedProfileId={selectedProfileId}
                      projectId={projectId}
                      onSuggestion={(text) => setInputs((p) => ({ ...p, [input.key]: text }))}
                    />
                  )}
                </div>
                {input.type === "textarea" && (
                  <Textarea
                    value={inputs[input.key] || ""}
                    onChange={(e) => setInputs((p) => ({ ...p, [input.key]: e.target.value }))}
                    placeholder={input.placeholder}
                    className={`text-sm leading-relaxed resize ${input.required ? "min-h-[120px]" : "min-h-[70px]"}`}
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

            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={() => setCurrentStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isGenerating ? (
                <Button onClick={handleStop} variant="destructive" size="sm" className="flex-1 gap-2">
                  <Square className="h-4 w-4" />
                  Parar
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  size="sm"
                  disabled={config.inputs.filter((i) => i.required).some((i) => !String(inputs[i.key] || "").trim())}
                  className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar {step.label}
                </Button>
              )}
              <Button variant="outline" size="sm" disabled={!canGoNext} onClick={() => setCurrentStep((s) => s + 1)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right: Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">Resultado</h3>
              {output && !isGenerating && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 text-xs h-7">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                  {canGoNext && (
                    <Button
                      size="sm"
                      onClick={() => setCurrentStep((s) => s + 1)}
                      className="gap-1 text-xs h-7 bg-primary hover:bg-primary/90"
                    >
                      Próximo
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="premium-card min-h-[400px] max-h-[60vh] overflow-y-auto">
              <div ref={outputRef} className="p-4">
                {output ? (
                  <div className="prose-premium max-w-none">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-3">
                    <span className="text-5xl opacity-30">{step.emoji}</span>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-sm">Preencha os campos e gere o conteúdo</p>
                      <p className="text-muted-foreground/60 text-xs">{step.description}</p>
                    </div>
                  </div>
                )}
                {isGenerating && (
                  <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
                )}
              </div>

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
      )}
    </div>
  );
}
