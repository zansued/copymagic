import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Sparkles, Square, Copy, Check, ChevronDown, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { STORYTELLING_FRAMEWORKS, type StorytellingFramework } from "@/lib/storytelling-frameworks";
import { profileToMarkdown, type BrandProfileData } from "@/lib/brand-profile-types";
import ReactMarkdown from "react-markdown";

interface BrandProfileOption {
  id: string;
  name: string;
  is_default: boolean;
}

export default function StorytellingAgent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Inputs
  const [originalContent, setOriginalContent] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<string>("pas");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [provider, setProvider] = useState<"deepseek" | "openai">("deepseek");

  // Brand profiles
  const [profiles, setProfiles] = useState<BrandProfileOption[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  // Output
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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
        const defaultProfile = list.find((p) => p.is_default) || list[0];
        if (defaultProfile) setSelectedProfileId(defaultProfile.id);
        setProfilesLoading(false);
      });
  }, [user]);

  const framework = STORYTELLING_FRAMEWORKS.find((f) => f.id === selectedFramework)!;

  const handleGenerate = useCallback(async () => {
    if (!originalContent.trim()) {
      toast({ title: "Cole seu conteúdo original", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setOutput("");

    // Load full brand profile if selected
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

    abortRef.current = new AbortController();
    const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storytelling-adapt`;

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
        body: JSON.stringify({
          original_content: originalContent,
          framework_structure: framework.structure,
          framework_name: framework.name,
          brand_context: brandContext,
          extra_instructions: extraInstructions,
          provider,
        }),
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

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
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
        console.error(err);
        setOutput(`❌ Erro: ${err.message}`);
      }
      setIsGenerating(false);
    }
  }, [originalContent, selectedFramework, selectedProfileId, extraInstructions, provider, framework]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Storytelling Output</title>
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

  // Auto-scroll output
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isGenerating]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/agents")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">📖</span>
              <div>
                <h1 className="text-xl font-bold gradient-text">Adaptador de Storytelling</h1>
                <p className="text-xs text-muted-foreground">Transforme qualquer conteúdo com frameworks narrativos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            {/* Content input */}
            <div className="premium-card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-primary" />
                <Label className="font-semibold text-foreground">Conteúdo Original</Label>
              </div>
              <Textarea
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                placeholder="Cole aqui o texto que deseja reestruturar... Pode ser um e-mail, post, roteiro, ideia ou qualquer conteúdo."
                className="min-h-[200px] text-sm leading-relaxed"
              />
            </div>

            {/* Reference URL */}
            <div className="premium-card p-5 space-y-3">
              <Label className="text-sm text-muted-foreground">Conteúdo de Referência (opcional)</Label>
              <Input
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://exemplo.com/artigo — o agente usará como matéria-prima"
                className="text-sm"
              />
            </div>

            {/* Strategy section */}
            <div className="premium-card p-5 space-y-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Estratégia
              </h3>

              {/* Brand Profile selector */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">DNA de Campanha</Label>
                {profilesLoading ? (
                  <div className="text-xs text-muted-foreground animate-pulse">Carregando perfis...</div>
                ) : profiles.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    Nenhum DNA cadastrado.{" "}
                    <button onClick={() => navigate("/brand-profiles")} className="text-primary underline">
                      Criar DNA
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

              {/* Framework selector */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Framework Narrativo</Label>
                <div className="grid grid-cols-1 gap-2">
                  {STORYTELLING_FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.id}
                      onClick={() => setSelectedFramework(fw.id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selectedFramework === fw.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{fw.emoji}</span>
                        <span className="text-sm font-medium text-foreground">{fw.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 pl-7">{fw.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra instructions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Instruções Extras (opcional)</Label>
                <Textarea
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder="Ex: 'Foque mais na parte emocional', 'Mantenha o tom informal', 'Adicione urgência no final'..."
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Provider */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Modelo de IA</Label>
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
            </div>

            {/* Generate button */}
            <div className="flex gap-3">
              {isGenerating ? (
                <Button onClick={handleStop} variant="destructive" className="flex-1 gap-2">
                  <Square className="h-4 w-4" />
                  Parar
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={!originalContent.trim()}
                  className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" />
                  Transformar com {framework.name}
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
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5 text-xs">
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              )}
            </div>

            <div
              ref={outputRef}
              className="premium-card p-6 min-h-[600px] max-h-[80vh] overflow-y-auto"
            >
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
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center space-y-4">
                  <span className="text-6xl opacity-30">📖</span>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">Cole seu conteúdo, selecione um framework e clique em Transformar</p>
                    <p className="text-muted-foreground/60 text-xs">O agente manterá o formato original, reestruturando apenas a narrativa</p>
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
  );
}
