import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles, Square, Copy, Check, FileDown, Send, MessageCircle, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { AGENT_WORKSPACE_CONFIGS } from "@/lib/agent-workspace-configs";
import { profileToMarkdown } from "@/lib/brand-profile-types";
import { firecrawlApi } from "@/lib/api/firecrawl";
import ReactMarkdown from "react-markdown";
import { GenerationHistory } from "@/components/agent/GenerationHistory";
import { AiSuggestButton } from "@/components/agent/AiSuggestButton";
import { CopyScoreCard } from "@/components/agent/CopyScoreCard";
import { WhatsAppShareButton } from "@/components/collaboration/WhatsAppShareButton";
import { useReviews } from "@/hooks/use-reviews";
import { useTeam } from "@/hooks/use-team";
import { useSharedLibrary } from "@/hooks/use-shared-library";

interface BrandProfileOption {
  id: string;
  name: string;
  is_default: boolean;
}

export default function AgentWorkspace() {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fromCampaign = searchParams.get("from") === "campaign";
  const campaignProjectId = searchParams.get("projectId");
  const { team } = useTeam();
  const { createReview } = useReviews();
  const { addItem: addToLibrary } = useSharedLibrary();

  const config = agentId ? AGENT_WORKSPACE_CONFIGS[agentId] : null;

  // Inputs state
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [provider, setProvider] = useState<"deepseek" | "openai">("deepseek");

  // Brand profiles
  const [profiles, setProfiles] = useState<BrandProfileOption[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  // Output
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastGenerationId, setLastGenerationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize default select values and campaign context
  useEffect(() => {
    if (!config) return;
    const defaults: Record<string, string> = {};
    for (const input of config.inputs) {
      if (input.type === "select" && input.options?.length) {
        defaults[input.key] = input.options[0].value;
      }
    }
    // If coming from campaign planning, pre-fill the first textarea with copy context
    if (fromCampaign) {
      const copyContext = sessionStorage.getItem("campaign_copy_context");
      if (copyContext) {
        const firstTextarea = config.inputs.find((i) => i.type === "textarea" && i.required);
        if (firstTextarea) {
          defaults[firstTextarea.key] = copyContext;
        }
      }
    }
    setInputs(defaults);
  }, [config, fromCampaign]);

  // Load brand profiles
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

    const requiredMissing = config.inputs
      .filter((i) => i.required)
      .some((i) => !String(inputs[i.key] || "").trim());

    if (requiredMissing) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setOutput("");

    // Auto-research competitor prices for price-calculator
    const enrichedInputs = { ...inputs };
    if (agentId === "price-calculator" && inputs.auto_research === "yes" && String(inputs.product_description || "").trim()) {
      try {
        setOutput("🔍 Pesquisando preços de concorrentes na web...\n");
        const productDesc = String(inputs.product_description).trim();
        const searchQueries = [
          `${productDesc} preço valor quanto custa comprar`,
          `${productDesc} concorrente similar alternativa preço`,
        ];
        
        let allResults = "";
        for (const q of searchQueries) {
          const searchResult = await firecrawlApi.search(q, { limit: 5, lang: "pt-br", country: "BR" });
          if (searchResult.success) {
            const results = searchResult.data || searchResult || [];
            const items = Array.isArray(results) ? results : (results.data || []);
            for (const item of items) {
              const title = item.title || "";
              const url = item.url || "";
              const md = item.markdown || item.description || "";
              if (title || md) {
                allResults += `### ${title}\nURL: ${url}\n${md.slice(0, 1500)}\n\n---\n\n`;
              }
            }
          }
        }

        if (allResults) {
          enrichedInputs.scraped_competitors = allResults.slice(0, 12000);
          setOutput("✅ Dados de concorrentes coletados! Gerando análise de pricing...\n\n");
        } else {
          setOutput("⚠️ Não encontrei dados de concorrentes. Gerando com base no produto...\n\n");
        }
      } catch (err) {
        console.error("Competitor research error:", err);
        setOutput("⚠️ Erro na pesquisa de concorrentes. Continuando sem dados de mercado...\n\n");
      }
    }

    // Scrape reference URL if present
    if (String(inputs.reference_url || "").trim()) {
      try {
        setOutput((prev) => prev + "🔍 Extraindo conteúdo da URL de referência...\n");
        const scrapeResult = await firecrawlApi.scrape(String(inputs.reference_url).trim());
        if (scrapeResult.success) {
          const markdown = scrapeResult.data?.markdown || scrapeResult.data?.data?.markdown;
          if (markdown) {
            enrichedInputs.scraped_content = markdown.slice(0, 8000);
          }
        }
      } catch {
        // Continue without scraped content
      }
    }

    // Clear status messages before generation output
    setOutput("");

    // Load brand context
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

      // Save to history
      if (accumulated && user && agentId && config) {
        const { data: genData } = await supabase.from("agent_generations").insert({
          user_id: user.id,
          agent_id: agentId,
          agent_name: config.name,
          inputs: enrichedInputs,
          output: accumulated,
          provider,
          brand_profile_id: selectedProfileId || null,
        }).select("id").single();
        if (genData) setLastGenerationId(genData.id);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
        setOutput(`❌ Erro: ${err.message}`);
      }
      setIsGenerating(false);
    }
  }, [config, inputs, selectedProfileId, provider, user, agentId]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = async () => {
    if (!output || !outputRef.current) return;
    
    const clone = outputRef.current.cloneNode(true) as HTMLElement;
    clone.style.cssText = "position:absolute;left:-9999px;top:0;width:800px;color:#000;background:#fff;padding:24px;font-family:Georgia,serif;";
    // Strip elements that cause html2canvas createPattern errors
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
    document.body.appendChild(clone);
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set({
        margin: [12, 12, 12, 12],
        filename: `${config?.name || "output"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollY: 0, imageTimeout: 0, removeContainer: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      }).from(clone).save();
      toast({ title: "PDF exportado com sucesso!" });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: "Erro ao exportar PDF", variant: "destructive" });
    } finally {
      document.body.removeChild(clone);
    }
  };

  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isGenerating]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Agente não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/agents")}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => 
              fromCampaign && campaignProjectId 
                ? navigate(`/project/${campaignProjectId}/campaign`) 
                : navigate("/agents")
            }>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.emoji}</span>
              <div>
                <h1 className="text-xl font-bold gradient-text">{config.name}</h1>
                <p className="text-xs text-muted-foreground">{config.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-5">
            {/* Dynamic inputs */}
            {config.inputs.map((input) => (
              <div key={input.key} className="premium-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    {input.label} {input.required && <span className="text-destructive">*</span>}
                  </Label>
                  {input.type === "textarea" && (
                    <AiSuggestButton
                      inputLabel={input.label}
                      inputPlaceholder={input.placeholder}
                      agentName={config.name}
                      selectedProfileId={selectedProfileId}
                      onSuggestion={(text) => setInput(input.key, text)}
                    />
                  )}
                </div>

                {input.type === "textarea" && (
                  <Textarea
                    value={inputs[input.key] || ""}
                    onChange={(e) => setInput(input.key, e.target.value)}
                    placeholder={input.placeholder}
                    className={`text-sm leading-relaxed resize ${input.required ? "min-h-[160px]" : "min-h-[80px]"}`}
                  />
                )}

                {input.type === "input" && (
                  <Input
                    value={inputs[input.key] || ""}
                    onChange={(e) => setInput(input.key, e.target.value)}
                    placeholder={input.placeholder}
                    className="text-sm"
                  />
                )}

                {input.type === "select" && input.options && (
                  <Select
                    value={inputs[input.key] || input.options[0].value}
                    onValueChange={(v) => setInput(input.key, v)}
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

            {/* DNA Selector */}
            <div className="premium-card p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">DNA de Campanha</Label>
              {profilesLoading ? (
                <div className="text-xs text-muted-foreground animate-pulse">Carregando...</div>
              ) : profiles.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Nenhum DNA.{" "}
                  <button onClick={() => navigate("/brand-profiles")} className="text-primary underline">
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

            {/* Provider */}
            <div className="premium-card p-5 space-y-3">
              <Label className="text-sm font-medium text-foreground">Modelo de IA</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* History */}
            {user && agentId && (
              <GenerationHistory
                agentId={agentId}
                userId={user.id}
                onLoad={(text, genId) => { setOutput(text); if (genId) setLastGenerationId(genId); }}
              />
            )}

            {/* Generate */}
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
                  Gerar com {config.name}
                </Button>
              )}
            </div>
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Resultado</h2>
              {output && !isGenerating && (
                <div className="flex items-center gap-1">
                  <CopyScoreCard copy={output} agentName={config.name} />
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5 text-xs">
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </Button>
                  {lastGenerationId && (
                    <WhatsAppShareButton
                      generationId={lastGenerationId}
                      agentName={config.name}
                    />
                  )}
                  {team && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={async () => {
                          if (!user) return;
                          const result = await addToLibrary(
                            {
                              title: `${config.name} — ${new Date().toLocaleDateString("pt-BR")}`,
                              content: output,
                              agent_name: config.name,
                              category: "copy",
                            },
                            user.id
                          );
                          if (result) {
                            toast({ title: "Salvo na Biblioteca da equipe!" });
                          } else {
                            toast({ title: "Erro ao salvar na Biblioteca", variant: "destructive" });
                          }
                        }}
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" /> Salvar na Biblioteca
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={async () => {
                          await createReview(
                            `${config.name} — ${new Date().toLocaleDateString("pt-BR")}`,
                            output,
                            config.name
                          );
                        }}
                      >
                        <Send className="h-3.5 w-3.5" /> Enviar para Revisão
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Scrollable view container */}
            <div className="premium-card min-h-[600px] max-h-[80vh] overflow-y-auto">
              {/* PDF capture container - no overflow constraints */}
              <div ref={outputRef} className="p-6">
              {output ? (
                <div className="prose-premium max-w-none">
                  <ReactMarkdown>{output}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center space-y-4">
                  <span className="text-6xl opacity-30">{config.emoji}</span>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">Preencha os campos e clique em Gerar</p>
                    <p className="text-muted-foreground/60 text-xs">{config.subtitle}</p>
                  </div>
                </div>
              )}
              {isGenerating && (
                <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
