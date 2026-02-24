import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, TrendingUp, Megaphone, ShoppingBag, Sparkles, Loader2,
  Target, DollarSign, Lightbulb, BarChart3, Zap, Globe,
  CheckCircle2, XCircle, AlertTriangle, Eye, RefreshCw
} from "lucide-react";
import { AdCard, type AdData } from "@/components/offer-research/AdCard";

interface OfferResearchResult {
  score_oportunidade: number;
  veredicto: string;
  tendencias: {
    interesse_crescente: boolean;
    sazonalidade: string;
    volume_estimado: string;
    termos_relacionados: string[];
    insights: string[];
  };
  anuncios: {
    volume_detectado: string;
    formatos_dominantes: string[];
    ganchos_populares: string[];
    padroes_criativos: string[];
    ctas_frequentes: string[];
    insights: string[];
  };
  anuncios_encontrados?: AdData[];
  ofertas_escaladas: {
    tipos_produto: string[];
    faixa_preco: string;
    modelos_funil: string[];
    diferenciais_vencedores: string[];
    exemplos: { nome: string; tipo: string; destaque: string }[];
    insights: string[];
  };
  recomendacao_oferta: {
    tipo_ideal: string;
    nome_sugerido: string;
    promessa_central: string;
    publico_alvo: string;
    faixa_preco_sugerida: string;
    modelo_funil: string;
    gancho_principal: string;
  };
  termos_alternativos_sugeridos?: string[];
}

interface ResearchMetadata {
  queries_usadas?: any;
  query_pack_cache?: "hit" | "miss";
  trends_scrape_status?: "ok" | "empty";
  meta_ads_count_raw?: number;
  meta_ads_count_after_dedupe?: number;
  meta_ads_count_after_local_filter?: number;
  firecrawl_counts?: Record<string, number>;
  search_results_by_source?: Record<string, number>;
  context_length?: number;
}

const sourceOptions = [
  { id: "trends", label: "Google Trends", icon: TrendingUp, color: "text-green-400" },
  { id: "ads", label: "Meta Ad Library", icon: Megaphone, color: "text-blue-400" },
  { id: "platforms", label: "Plataformas Digitais", icon: ShoppingBag, color: "text-amber-400" },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 8 ? "text-green-400" : score >= 5 ? "text-amber-400" : "text-red-400";
  const bgColor = score >= 8 ? "from-green-500/20 to-green-500/5" : score >= 5 ? "from-amber-500/20 to-amber-500/5" : "from-red-500/20 to-red-500/5";
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${bgColor} border border-border/50`}>
      <span className={`text-4xl font-black ${color}`}>{score}</span>
      <span className="text-muted-foreground text-sm">/10</span>
      <div className="ml-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Score de Oportunidade</div>
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`w-3 h-1.5 rounded-full ${i < score ? (score >= 8 ? "bg-green-400" : score >= 5 ? "bg-amber-400" : "bg-red-400") : "bg-muted"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor, children }: { title: string; icon: any; iconColor: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="p-5 border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function TagList({ items, color = "secondary" }: { items: string[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} variant={color as any} className="text-xs">{item}</Badge>
      ))}
    </div>
  );
}

function WeakEvidenceWarning({ metadata, alternatives, onSelectTerm }: {
  metadata: ResearchMetadata;
  alternatives?: string[];
  onSelectTerm: (term: string) => void;
}) {
  const metaAds = metadata.meta_ads_count_after_local_filter ?? 0;
  const totalSearch = metadata.search_results_by_source
    ? Object.values(metadata.search_results_by_source).reduce((a, b) => a + b, 0)
    : 0;

  const isWeak = metaAds === 0 && totalSearch < 5;
  if (!isWeak) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-4 border-amber-500/30 bg-amber-500/10">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Evidência fraca para este nicho</p>
            <p className="text-xs text-muted-foreground">
              Poucos anúncios e resultados foram encontrados. Tente termos mais específicos ou variações do nicho.
            </p>
            {alternatives && alternatives.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {alternatives.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => onSelectTerm(t)}>
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function AiResearchTab() {
  const [niche, setNiche] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["trends", "ads", "platforms"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OfferResearchResult | null>(null);
  const [metadata, setMetadata] = useState<ResearchMetadata | null>(null);

  const toggleSource = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSearch = async (skipCache = false) => {
    if (!niche.trim()) {
      toast.error("Digite um nicho para pesquisar");
      return;
    }
    if (selectedSources.length === 0) {
      toast.error("Selecione ao menos uma fonte");
      return;
    }

    setLoading(true);
    setResult(null);
    setMetadata(null);

    try {
      const { data, error } = await supabase.functions.invoke("offer-research", {
        body: { niche: niche.trim(), sources: selectedSources, skip_cache: skipCache },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na pesquisa");
      if (data.data?.error) throw new Error(data.data.error);

      setResult(data.data);
      setMetadata(data.metadata || null);
      toast.success("Pesquisa concluída!");
    } catch (e: any) {
      console.error("Offer research error:", e);
      toast.error(e.message || "Erro ao pesquisar ofertas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: emagrecimento, marketing digital, finanças pessoais..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={() => handleSearch()} disabled={loading || !niche.trim()} className="gap-2 bg-gradient-to-r from-primary to-accent-foreground px-6">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Pesquisando..." : "Pesquisar"}
            </Button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-muted-foreground">Fontes:</span>
            {sourceOptions.map((src) => (
              <label key={src.id} className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={selectedSources.includes(src.id)}
                  onCheckedChange={() => toggleSource(src.id)}
                  disabled={loading}
                />
                <src.icon className={`h-3.5 w-3.5 ${src.color}`} />
                <span className="text-sm text-foreground/80">{src.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <Sparkles className="h-4 w-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Analisando o nicho "{niche}"</p>
                  <p className="text-sm text-muted-foreground mt-1">Buscando tendências, anúncios e ofertas escaladas...</p>
                </div>
                <div className="flex gap-2 mt-2">
                  {selectedSources.map((src) => {
                    const opt = sourceOptions.find(s => s.id === src);
                    return opt ? (
                      <Badge key={src} variant="secondary" className="gap-1 text-xs animate-pulse">
                        <opt.icon className={`h-3 w-3 ${opt.color}`} />
                        {opt.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Weak evidence warning */}
            {metadata && (
              <WeakEvidenceWarning
                metadata={metadata}
                alternatives={result.termos_alternativos_sugeridos}
                onSelectTerm={(t) => setNiche(t)}
              />
            )}

            <ScoreGauge score={result.score_oportunidade} />
            <Card className="p-4 border-border/50 bg-card/80">
              <p className="text-foreground font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                {result.veredicto}
              </p>
            </Card>

            <div className="grid md:grid-cols-2 gap-5">
              {result.tendencias && (
                <SectionCard title="Tendências de Busca" icon={TrendingUp} iconColor="text-green-400">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {result.tendencias.interesse_crescente ? (
                        <Badge className="gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3" /> Interesse crescente
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-500/30">
                          <XCircle className="h-3 w-3" /> Interesse estável/decrescente
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Volume: {result.tendencias.volume_estimado}
                      </Badge>
                    </div>
                    {result.tendencias.sazonalidade && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        {result.tendencias.sazonalidade}
                      </p>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Termos relacionados:</p>
                      <TagList items={result.tendencias.termos_relacionados} />
                    </div>
                    <ul className="space-y-1">
                      {result.tendencias.insights?.map((ins, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionCard>
              )}

              {result.anuncios && (
                <SectionCard title="Análise de Anúncios" icon={Megaphone} iconColor="text-blue-400">
                  <div className="space-y-3">
                    <Badge variant="outline" className="text-xs">
                      Volume: {result.anuncios.volume_detectado}
                    </Badge>
                    {result.anuncios.ganchos_populares?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Ganchos populares:</p>
                        <ul className="space-y-1">
                          {result.anuncios.ganchos_populares.map((g, i) => (
                            <li key={i} className="text-sm text-foreground/80">"{g}"</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.anuncios.formatos_dominantes?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Formatos dominantes:</p>
                        <TagList items={result.anuncios.formatos_dominantes} />
                      </div>
                    )}
                    {result.anuncios.ctas_frequentes?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">CTAs mais usados:</p>
                        <TagList items={result.anuncios.ctas_frequentes} />
                      </div>
                    )}
                    <ul className="space-y-1">
                      {result.anuncios.insights?.map((ins, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionCard>
              )}

              {result.anuncios_encontrados && result.anuncios_encontrados.length > 0 && (
                <div className="md:col-span-2">
                  <SectionCard title={`Anúncios Encontrados (${result.anuncios_encontrados.length})`} icon={Eye} iconColor="text-primary">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {result.anuncios_encontrados.map((ad, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                        >
                          <AdCard ad={ad} />
                        </motion.div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              )}

              {result.ofertas_escaladas && (
                <SectionCard title="Ofertas Escaladas" icon={ShoppingBag} iconColor="text-amber-400">
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs gap-1">
                        <DollarSign className="h-3 w-3" /> {result.ofertas_escaladas.faixa_preco}
                      </Badge>
                    </div>
                    {result.ofertas_escaladas.tipos_produto?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Tipos de produto:</p>
                        <TagList items={result.ofertas_escaladas.tipos_produto} />
                      </div>
                    )}
                    {result.ofertas_escaladas.exemplos?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Exemplos escalados:</p>
                        <div className="space-y-2">
                          {result.ofertas_escaladas.exemplos.map((ex, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-muted/50 border border-border/30">
                              <p className="text-sm font-medium text-foreground">{ex.nome}</p>
                              <p className="text-xs text-muted-foreground">{ex.tipo} — {ex.destaque}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.ofertas_escaladas.diferenciais_vencedores?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Diferenciais vencedores:</p>
                        <TagList items={result.ofertas_escaladas.diferenciais_vencedores} />
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {result.recomendacao_oferta && (
                <SectionCard title="Recomendação de Oferta" icon={Target} iconColor="text-primary">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <p className="text-lg font-bold text-foreground">{result.recomendacao_oferta.nome_sugerido}</p>
                      <p className="text-sm text-primary">{result.recomendacao_oferta.tipo_ideal}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <div><span className="text-muted-foreground">Promessa: </span><span className="text-foreground">{result.recomendacao_oferta.promessa_central}</span></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Target className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <div><span className="text-muted-foreground">Público: </span><span className="text-foreground">{result.recomendacao_oferta.publico_alvo}</span></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                        <div><span className="text-muted-foreground">Preço sugerido: </span><span className="text-foreground">{result.recomendacao_oferta.faixa_preco_sugerida}</span></div>
                      </div>
                      <div className="flex items-start gap-2">
                        <BarChart3 className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                        <div><span className="text-muted-foreground">Funil: </span><span className="text-foreground">{result.recomendacao_oferta.modelo_funil}</span></div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/30 mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Gancho principal:</p>
                      <p className="text-sm font-medium text-foreground italic">"{result.recomendacao_oferta.gancho_principal}"</p>
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Termos alternativos sugeridos */}
              {result.termos_alternativos_sugeridos && result.termos_alternativos_sugeridos.length > 0 && (
                <div className="md:col-span-2">
                  <Card className="p-4 border-border/50 bg-card/80">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-foreground">Termos alternativos sugeridos</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.termos_alternativos_sugeridos.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => { setNiche(t); }}>
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Metadata debug panel */}
              {metadata && (
                <div className="md:col-span-2">
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" /> Dados de depuração (queries, contagens)
                    </summary>
                    <Card className="mt-2 p-4 border-border/50 bg-card/80 text-xs space-y-2">
                      {/* Cache status */}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Query pack cache:</span>
                        <Badge variant={metadata.query_pack_cache === "hit" ? "secondary" : "outline"} className="text-xs">
                          {metadata.query_pack_cache === "hit" ? "✓ Cache" : "✗ Gerado"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs gap-1"
                          onClick={() => handleSearch(true)}
                          disabled={loading}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Sem cache
                        </Button>
                      </div>

                      {/* Trends scrape */}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Google Trends scrape:</span>
                        <Badge variant={metadata.trends_scrape_status === "ok" ? "secondary" : "outline"} className="text-xs">
                          {metadata.trends_scrape_status === "ok" ? "✓ OK" : "✗ Vazio"}
                        </Badge>
                      </div>

                      {metadata.queries_usadas && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Queries usadas:</p>
                          {Object.entries(metadata.queries_usadas).map(([k, v]: [string, any]) => (
                            <div key={k} className="ml-2">
                              <span className="text-foreground/70">{k}:</span>{" "}
                              <span className="text-foreground">{Array.isArray(v) ? v.join(" | ") : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <span>Meta brutos: <strong>{metadata.meta_ads_count_raw ?? "?"}</strong></span>
                        <span>Após dedupe: <strong>{metadata.meta_ads_count_after_dedupe ?? "?"}</strong></span>
                        <span>Após filtro local: <strong>{metadata.meta_ads_count_after_local_filter ?? "?"}</strong></span>
                        <span>Contexto: <strong>{metadata.context_length ?? "?"}</strong> chars</span>
                      </div>
                      {metadata.search_results_by_source && (
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(metadata.search_results_by_source).map(([k, v]: [string, any]) => (
                            <span key={k}>{k}: <strong>{v}</strong></span>
                          ))}
                        </div>
                      )}
                    </Card>
                  </details>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-4">
          <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-foreground/70 font-medium">Digite um nicho para começar</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vamos vasculhar tendências, anúncios e ofertas escaladas para você.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
