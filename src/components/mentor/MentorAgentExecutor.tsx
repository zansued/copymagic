import { useState, useRef, useCallback, useEffect } from "react";
import { X, Sparkles, Square, Copy, Check, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { AGENT_WORKSPACE_CONFIGS } from "@/lib/agent-workspace-configs";
import { AGENTS } from "@/lib/agents";
import { profileToMarkdown } from "@/lib/brand-profile-types";
import { firecrawlApi } from "@/lib/api/firecrawl";
import ReactMarkdown from "react-markdown";

interface BrandProfileOption {
  id: string;
  name: string;
  is_default: boolean;
}

interface MentorAgentExecutorProps {
  agentId: string;
  stepTitle: string;
  onClose: () => void;
  onComplete: (output: string) => void;
}

export default function MentorAgentExecutor({ agentId, stepTitle, onClose, onComplete }: MentorAgentExecutorProps) {
  // Try direct lookup first, then fallback by name match
  const config = AGENT_WORKSPACE_CONFIGS[agentId] 
    || Object.values(AGENT_WORKSPACE_CONFIGS).find((c) => c.name.toLowerCase() === agentId.toLowerCase());
  const agent = AGENTS.find((a) => a.id === (config?.id || agentId));
  const { user } = useAuth();

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profiles, setProfiles] = useState<BrandProfileOption[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize defaults
  useEffect(() => {
    if (!config) return;
    const defaults: Record<string, string> = {};
    for (const input of config.inputs) {
      if (input.type === "select" && input.options?.length) {
        defaults[input.key] = input.options[0].value;
      }
    }
    setInputs(defaults);
  }, [config]);

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

  const setInput = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = useCallback(async () => {
    if (!config) return;
    setIsGenerating(true);
    setOutput("");

    const enrichedInputs = { ...inputs };
    if (inputs.reference_url?.trim()) {
      try {
        setOutput("🔍 Extraindo conteúdo da URL...\n");
        const scrapeResult = await firecrawlApi.scrape(inputs.reference_url.trim());
        if (scrapeResult.success) {
          const markdown = scrapeResult.data?.markdown || scrapeResult.data?.data?.markdown;
          if (markdown) enrichedInputs.scraped_content = markdown.slice(0, 8000);
        }
      } catch { /* continue */ }
      setOutput("");
    }

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

    const systemPrompt = config.buildPrompt(enrichedInputs, brandContext);
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
        body: JSON.stringify({ system_prompt: systemPrompt, provider: "openai" }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
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
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setOutput(`❌ Erro: ${err.message}`);
      }
      setIsGenerating(false);
    }
  }, [config, inputs, selectedProfileId]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  const handleExportPdf = () => {
    if (!output || !outputRef.current) return;
    const clone = outputRef.current.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("button,[role='button'],canvas,video,svg,img").forEach(el => el.remove());
    clone.querySelectorAll("*").forEach(el => {
      const h = el as HTMLElement;
      h.style.backgroundImage = "none";
      h.style.backgroundColor = "transparent";
      h.style.boxShadow = "none";
      h.style.color = "#000";
      h.style.webkitTextFillColor = "#000";
      h.style.webkitBackgroundClip = "unset";
    });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${config?.name || "output"}</title>
<style>
  @media print { html, body { background:#fff!important; color:#000!important; -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Georgia,serif;color:#000;background:#fff;padding:40px;font-size:14px;line-height:1.7;max-width:800px;margin:0 auto;}
</style></head><body>${clone.innerHTML}</body></html>`;
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Permita popups para exportar", variant: "destructive" }); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { setTimeout(() => win.print(), 400); };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndClose = () => {
    if (output) onComplete(output);
    onClose();
  };

  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isGenerating]);

  if (!config) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground text-sm">Agente "{agentId}" não encontrado.</p>
        <Button variant="outline" size="sm" onClick={onClose} className="mt-4">Fechar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent?.emoji || "🤖"}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{config.name}</p>
            <p className="text-xs text-muted-foreground">{stepTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {output && !isGenerating && (
            <>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 text-xs">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1 text-xs">
                <FileDown className="h-3 w-3" /> PDF
              </Button>
              <Button size="sm" onClick={handleSaveAndClose} className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700">
                ✓ Salvar e Concluir
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
          {/* Inputs */}
          <div className="p-4 space-y-4 border-r border-border overflow-y-auto">
            {config.inputs.map((input) => (
              <div key={input.key} className="space-y-2">
                <Label className="text-xs font-medium">
                  {input.label} {input.required && <span className="text-destructive">*</span>}
                </Label>
                {input.type === "textarea" && (
                  <Textarea
                    value={inputs[input.key] || ""}
                    onChange={(e) => setInput(input.key, e.target.value)}
                    placeholder={input.placeholder}
                    className="text-xs min-h-[80px]"
                  />
                )}
                {input.type === "input" && (
                  <Input
                    value={inputs[input.key] || ""}
                    onChange={(e) => setInput(input.key, e.target.value)}
                    placeholder={input.placeholder}
                    className="text-xs"
                  />
                )}
                {input.type === "select" && input.options && (
                  <Select value={inputs[input.key] || input.options[0].value} onValueChange={(v) => setInput(input.key, v)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {input.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}

            {/* DNA selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">DNA de Campanha</Label>
              {profilesLoading ? (
                <p className="text-xs text-muted-foreground animate-pulse">Carregando...</p>
              ) : profiles.length > 0 ? (
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.is_default ? "⭐" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum DNA configurado.</p>
              )}
            </div>

            {/* Generate button */}
            <div className="pt-2">
              {isGenerating ? (
                <Button onClick={handleStop} variant="destructive" className="w-full gap-2 text-sm">
                  <Square className="h-4 w-4" /> Parar
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={config.inputs.filter((i) => i.required).some((i) => !inputs[i.key]?.trim())}
                  className="w-full gap-2 text-sm bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" /> Gerar
                </Button>
              )}
            </div>
          </div>

          {/* Output */}
          <div ref={outputRef} className="p-5 overflow-y-auto">
            {output ? (
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-xl prose-h1:bg-gradient-to-r prose-h1:from-primary prose-h1:to-accent-foreground prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-border
                prose-h2:text-lg prose-h2:text-primary prose-h2:mt-6 prose-h2:mb-3
                prose-h3:text-base prose-h3:text-foreground prose-h3:mt-4 prose-h3:mb-2
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3
                prose-strong:text-foreground prose-strong:font-semibold
                prose-li:text-muted-foreground prose-li:leading-relaxed
                prose-ul:space-y-1 prose-ol:space-y-1
                prose-li:marker:text-primary
                prose-hr:border-border prose-hr:my-6
                prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:text-muted-foreground
              ">
                <ReactMarkdown>{output}</ReactMarkdown>
                {isGenerating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-20">
                <span className="text-4xl opacity-30">{agent?.emoji || "🤖"}</span>
                <p className="text-xs text-muted-foreground">Preencha os campos e clique em Gerar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
