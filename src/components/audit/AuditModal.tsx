import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, Check, Lock, History, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { AuditScoreDisplay } from "./AuditScoreDisplay";
import { parseAuditOutput, AUDIT_TARGETS } from "@/lib/audit-types";
import type { AuditResult } from "@/lib/audit-types";

interface AuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: string;
  currentText: string;
  projectId: string;
  copyResults: Record<string, any>;
  onApplied: (target: string, newText: string, updatedCopyResults: Record<string, any>) => void;
}

const AUDIT_SYSTEM_PROMPT = (mode: "lite" | "full", target: string) => `Você é um auditor premium de copywriting do CopyEngine Pro.
Avalie o texto de "${AUDIT_TARGETS[target] || target}" e forneça uma auditoria completa.

FORMATO DE SAÍDA (OBRIGATÓRIO, SEM MARKDOWN):
SCORE_GERAL: <0-10>
CLAREZA: <0-10>
ESPECIFICIDADE: <0-10>
CONSISTENCIA_DNA: <0-10>
OFERTA: <0-10>
RISCO_CLAIMS: <0-10>
CTA: <0-10>

CHECKLIST:
1) [item de melhoria prioritário]
2) [item de melhoria]
3) [item de melhoria]
4) [item de melhoria]
5) [item de melhoria]
${mode === "full" ? `
REVISED_TEXT:
<<<
[texto revisado completo, melhorado, pronto para uso]
>>>

VARIATIONS:
- [variação 1 de headline/CTA/hook]
- [variação 2]
- [variação 3]` : ""}

REGRAS:
- Scores de 0 a 10 com uma casa decimal
- Checklist com 3-7 itens concretos e acionáveis
- Sempre em pt-BR
${mode === "full" ? "- REVISED_TEXT deve ser a versão melhorada completa do texto original" : "- NÃO inclua REVISED_TEXT nem VARIATIONS"}
- Comece diretamente pelo SCORE_GERAL`;

export function AuditModal({ open, onOpenChange, target, currentText, projectId, copyResults, onApplied }: AuditModalProps) {
  const { subscription } = useSubscription();
  const isPro = subscription?.plan && !["free", "starter"].includes(subscription.plan);
  const auditMode = isPro ? "full" : "lite";

  const [text, setText] = useState(currentText);
  const [loading, setLoading] = useState(false);
  const [currentAudit, setCurrentAudit] = useState<AuditResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history from copyResults
  const history: AuditResult[] = (copyResults?.audit_history?.[target] || []).slice(0, 5);

  const handleGenerate = useCallback(async () => {
    if (!text || text.length < 50) {
      toast.error("Texto muito curto para auditar (mín. 50 caracteres)");
      return;
    }

    setLoading(true);
    setCurrentAudit(null);
    abortRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Você precisa estar logado");

      const systemPrompt = AUDIT_SYSTEM_PROMPT(auditMode, target);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            system_prompt: systemPrompt + `\n\nTEXTO A AUDITAR:\n${text.slice(0, 15000)}`,
            provider: "deepseek",
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Stream indisponível");

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
            if (content) accumulated += content;
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Parse the output
      const parsed = parseAuditOutput(accumulated, auditMode);
      const auditResult: AuditResult = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        target,
        mode: auditMode,
        ...parsed,
      };

      setCurrentAudit(auditResult);

      // Save to audit_history in copy_results
      const updatedHistory = [auditResult, ...history].slice(0, 5);
      const updatedCopyResults = {
        ...copyResults,
        audit_history: {
          ...(copyResults?.audit_history || {}),
          [target]: updatedHistory,
        },
      };

      await supabase
        .from("projects")
        .update({ copy_results: updatedCopyResults } as any)
        .eq("id", projectId);

      // Notify parent of updated copy_results
      onApplied(target, copyResults[target], updatedCopyResults);

    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error(err.message || "Erro ao gerar auditoria");
      }
    } finally {
      setLoading(false);
    }
  }, [text, auditMode, target, projectId, copyResults, history, onApplied]);

  const handleApply = async (audit: AuditResult) => {
    if (!isPro) {
      toast.error("Disponível no Pro: aplicar revisão automaticamente");
      return;
    }
    if (!audit.revised_text) {
      toast.error("Esta auditoria não possui texto revisado");
      return;
    }

    setApplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-audit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            project_id: projectId,
            target,
            audit_id: audit.id,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      const data = await resp.json();
      toast.success("Revisão aplicada com sucesso!");

      // Update local state
      const updatedCopyResults = {
        ...copyResults,
        [target]: audit.revised_text,
        audit_last: {
          ...(copyResults?.audit_last || {}),
          [target]: audit,
        },
      };
      onApplied(target, audit.revised_text!, updatedCopyResults);
      setText(audit.revised_text!);
    } catch (err: any) {
      toast.error(err.message || "Erro ao aplicar revisão");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Auditoria Premium — {AUDIT_TARGETS[target] || target}
            {!isPro && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-2">
                Modo Lite
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="audit" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="audit" className="flex-1">🔍 Auditoria</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1">
              <History className="h-3.5 w-3.5" />
              Histórico ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[65vh]">
              <div className="space-y-4 p-1">
                {/* Text to audit */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Texto a auditar
                  </label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[120px] text-sm"
                    placeholder="Cole ou edite o texto aqui..."
                  />
                </div>

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  disabled={loading || text.length < 50}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {loading ? "Auditando..." : "Gerar Auditoria"}
                </Button>

                {/* Results */}
                {currentAudit && (
                  <div className="space-y-4">
                    {/* Score */}
                    <div className="premium-card p-4">
                      <AuditScoreDisplay score={currentAudit.score} />
                    </div>

                    {/* Checklist */}
                    {currentAudit.checklist.length > 0 && (
                      <div className="premium-card p-4 space-y-2">
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          ✅ Checklist Prioritário
                        </p>
                        {currentAudit.checklist.map((item, i) => (
                          <p key={i} className="text-xs text-muted-foreground pl-4">
                            {i + 1}) {item}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Revised text (Pro only) */}
                    {currentAudit.revised_text ? (
                      <div className="premium-card p-4 space-y-3">
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          ✍️ Versão Revisada
                        </p>
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {currentAudit.revised_text.slice(0, 2000)}
                          {currentAudit.revised_text.length > 2000 && "..."}
                        </div>
                        <Button
                          onClick={() => handleApply(currentAudit)}
                          disabled={applying}
                          className="w-full gap-2"
                          size="sm"
                        >
                          {applying ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Aplicar Revisão (1 clique)
                        </Button>
                      </div>
                    ) : !isPro && currentAudit.mode === "lite" ? (
                      <div className="premium-card p-4 flex items-center gap-3 bg-muted/20">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Revisão automática disponível no Pro</p>
                          <p className="text-xs text-muted-foreground">
                            Faça upgrade para receber o texto revisado pronto + 3 variações seguras.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Variations (Pro only) */}
                    {currentAudit.variations && currentAudit.variations.length > 0 && (
                      <div className="premium-card p-4 space-y-2">
                        <p className="text-sm font-semibold">💡 Variações Seguras</p>
                        {currentAudit.variations.map((v, i) => (
                          <p key={i} className="text-xs text-muted-foreground pl-4">
                            • {v}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[65vh]">
              <div className="space-y-2 p-1">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma auditoria ainda para este target.
                  </p>
                ) : (
                  history.map((audit) => {
                    const isExpanded = expandedHistoryId === audit.id;
                    return (
                      <div key={audit.id} className="premium-card overflow-hidden">
                        <button
                          onClick={() => setExpandedHistoryId(isExpanded ? null : audit.id)}
                          className="w-full p-3 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-bold ${(audit.score?.overall ?? 0) >= 8 ? "text-primary" : (audit.score?.overall ?? 0) >= 6 ? "text-amber-400" : "text-destructive"}`}>
                              {(audit.score?.overall ?? 0).toFixed(1)}
                            </span>
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {new Date(audit.created_at).toLocaleDateString("pt-BR")} — {new Date(audit.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {audit.mode === "full" ? "Auditoria Completa" : "Auditoria Lite"}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
                            <AuditScoreDisplay score={audit.score} />
                            {audit.checklist.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold">Checklist:</p>
                                {audit.checklist.map((item, i) => (
                                  <p key={i} className="text-xs text-muted-foreground pl-3">{i + 1}) {item}</p>
                                ))}
                              </div>
                            )}
                            {audit.revised_text && isPro && (
                              <Button
                                size="sm"
                                onClick={() => handleApply(audit)}
                                disabled={applying}
                                className="w-full gap-2"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Aplicar esta revisão
                              </Button>
                            )}
                            {audit.revised_text && !isPro && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Lock className="h-3.5 w-3.5" />
                                Upgrade para Pro para aplicar
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
