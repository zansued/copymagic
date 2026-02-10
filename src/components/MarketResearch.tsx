import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, ChevronDown, ChevronUp, Clock, Trash2 } from "lucide-react";
import type { Provider } from "@/hooks/use-copywriter";

interface ResearchData {
  nicho: string;
  tendencias: string[];
  dores: string[];
  oportunidades: string[];
  produto_sugerido: {
    nome: string;
    publico_alvo: string;
    dor_principal: string;
    solucao: string;
    como_funciona: string;
    diferencial_unico: string;
  };
  produto_formatado: string;
}

interface SavedResearch {
  id: string;
  query: string;
  result: ResearchData;
  created_at: string;
}

interface MarketResearchProps {
  provider: Provider;
  projectId: string;
  onUseProduct: (productText: string) => void;
}

export function MarketResearch({ provider, projectId, onUseProduct }: MarketResearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchData | null>(null);
  const [error, setError] = useState("");
  const [savedResearches, setSavedResearches] = useState<SavedResearch[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load saved researches from project
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("research_data")
        .eq("id", projectId)
        .single();
      if (data?.research_data && Array.isArray(data.research_data)) {
        setSavedResearches(data.research_data as unknown as SavedResearch[]);
      }
    })();
  }, [projectId]);

  const saveResearch = async (newResearch: SavedResearch) => {
    const updated = [newResearch, ...savedResearches];
    setSavedResearches(updated);
    await supabase
      .from("projects")
      .update({ research_data: updated as any })
      .eq("id", projectId);
  };

  const deleteResearch = async (id: string) => {
    const updated = savedResearches.filter((r) => r.id !== id);
    setSavedResearches(updated);
    await supabase
      .from("projects")
      .update({ research_data: updated as any })
      .eq("id", projectId);
    toast.success("Pesquisa excluída");
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-research`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query, provider }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      const data = await resp.json();
      if (data.success && data.data) {
        setResult(data.data);
        // Save to history
        const newResearch: SavedResearch = {
          id: crypto.randomUUID(),
          query: query.trim(),
          result: data.data,
          created_at: new Date().toISOString(),
        };
        await saveResearch(newResearch);
        setExpandedId(newResearch.id);
      } else {
        throw new Error(data.error || "Resultado inválido");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderResearchResult = (data: ResearchData, showUseButton: boolean) => (
    <div className="space-y-3 mt-3">
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">🎯 Nicho</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-foreground">{data.nicho}</p>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">📈 Tendências</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {data.tendencias?.map((t, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span> {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">💔 Dores</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {data.dores?.map((d, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-destructive">•</span> {d}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">💡 Oportunidades</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {data.oportunidades?.map((o, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span> {o}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">📦 Produto Sugerido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-1.5 text-sm">
            <div><span className="font-medium text-foreground">Nome:</span> <span className="text-muted-foreground">{data.produto_sugerido?.nome}</span></div>
            <div><span className="font-medium text-foreground">Público:</span> <span className="text-muted-foreground">{data.produto_sugerido?.publico_alvo}</span></div>
            <div><span className="font-medium text-foreground">Dor Principal:</span> <span className="text-muted-foreground">{data.produto_sugerido?.dor_principal}</span></div>
            <div><span className="font-medium text-foreground">Solução:</span> <span className="text-muted-foreground">{data.produto_sugerido?.solucao}</span></div>
            <div><span className="font-medium text-foreground">Como Funciona:</span> <span className="text-muted-foreground">{data.produto_sugerido?.como_funciona}</span></div>
            <div><span className="font-medium text-foreground">Diferencial:</span> <span className="text-muted-foreground">{data.produto_sugerido?.diferencial_unico}</span></div>
          </div>

          {showUseButton && (
            <Button
              onClick={() => onUseProduct(data.produto_formatado)}
              className="w-full mt-3 premium-button"
              size="lg"
            >
              🚀 Usar este Produto e Gerar Copy
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold gradient-text">🔍 Pesquisa de Mercado</h2>
        <p className="text-sm text-muted-foreground">
          Digite um nicho ou tema e a IA vai pesquisar na internet para encontrar tendências, dores e sugerir um produto.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: emagrecimento feminino, marketing digital, ansiedade..."
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="glow-ring"
        />
        <Button onClick={handleSearch} disabled={isLoading || !query.trim()} className="premium-button">
          {isLoading ? "Pesquisando..." : <><Search className="h-4 w-4 mr-1" /> Pesquisar</>}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin text-3xl">🔍</div>
            <p className="text-sm text-muted-foreground">Pesquisando na internet e analisando com IA...</p>
          </div>
        </div>
      )}

      {/* Saved researches list */}
      {savedResearches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" /> Pesquisas Salvas ({savedResearches.length})
          </h3>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {savedResearches.map((r) => (
                <Card key={r.id} className="premium-card">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{r.query}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.result?.nicho} • {new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteResearch(r.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {expandedId === r.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {expandedId === r.id && (
                      <div className="px-4 pb-4 border-t border-border pt-3">
                        {renderResearchResult(r.result, true)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
