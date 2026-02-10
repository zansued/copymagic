import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface MarketResearchProps {
  provider: Provider;
  onUseProduct: (productText: string) => void;
}

export function MarketResearch({ provider, onUseProduct }: MarketResearchProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResearchData | null>(null);
  const [error, setError] = useState("");

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
      } else {
        throw new Error(data.error || "Resultado inválido");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">🔍 Pesquisa de Mercado</h2>
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
        />
        <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
          {isLoading ? "Pesquisando..." : "Pesquisar"}
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

      {result && (
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Nicho */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">🎯 Nicho Identificado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-foreground">{result.nicho}</p>
              </CardContent>
            </Card>

            {/* Tendências */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📈 Tendências</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.tendencias?.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span> {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Dores */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">💔 Dores do Público</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.dores?.map((d, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-destructive">•</span> {d}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Oportunidades */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">💡 Oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.oportunidades?.map((o, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span> {o}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Produto Sugerido */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📦 Produto Sugerido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div><span className="font-medium text-foreground">Nome:</span> <span className="text-muted-foreground">{result.produto_sugerido?.nome}</span></div>
                  <div><span className="font-medium text-foreground">Público:</span> <span className="text-muted-foreground">{result.produto_sugerido?.publico_alvo}</span></div>
                  <div><span className="font-medium text-foreground">Dor Principal:</span> <span className="text-muted-foreground">{result.produto_sugerido?.dor_principal}</span></div>
                  <div><span className="font-medium text-foreground">Solução:</span> <span className="text-muted-foreground">{result.produto_sugerido?.solucao}</span></div>
                  <div><span className="font-medium text-foreground">Como Funciona:</span> <span className="text-muted-foreground">{result.produto_sugerido?.como_funciona}</span></div>
                  <div><span className="font-medium text-foreground">Diferencial:</span> <span className="text-muted-foreground">{result.produto_sugerido?.diferencial_unico}</span></div>
                </div>

                <Button
                  onClick={() => onUseProduct(result.produto_formatado)}
                  className="w-full mt-3"
                  size="lg"
                >
                  🚀 Usar este Produto e Gerar Copy
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
