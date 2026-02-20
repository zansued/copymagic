import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, Download, Search, Star, Trash2, AlertTriangle, Flame,
  Clock, ExternalLink, ArrowUpDown, X, Filter, TrendingUp, Shield, Bot, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/ad-offer/storage";
import { calculateScores } from "@/lib/ad-offer/scoring";
import { exportAdsToCsv } from "@/lib/ad-offer/csv-export";
import type { ImportedAd } from "@/lib/ad-offer/types";
import AdDetailSheet from "./AdDetailSheet";

type SortKey = "overallScore" | "offerScore" | "riskScore" | "importedAt";

export default function ResultsTab() {
  const [ads, setAds] = useState<ImportedAd[]>(() => storage.getAds());
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("overallScore");
  const [sortDesc, setSortDesc] = useState(true);
  const [filterRef, setFilterRef] = useState(false);
  const [filterRisk, setFilterRisk] = useState(false);
  const [selectedAd, setSelectedAd] = useState<ImportedAd | null>(null);

  const reload = useCallback(() => setAds(storage.getAds()), []);

  const filtered = useMemo(() => {
    let list = ads;
    if (filterRef) list = list.filter((a) => a.savedAsReference);
    if (filterRisk) list = list.filter((a) => a.complianceAlerts.length > 0);
    if (searchText) {
      const s = searchText.toLowerCase();
      list = list.filter((a) =>
        a.pageOrAdvertiser.toLowerCase().includes(s) ||
        a.mainText.toLowerCase().includes(s) ||
        a.headline.toLowerCase().includes(s)
      );
    }
    return [...list].sort((a, b) => {
      const av = sortBy === "importedAt" ? new Date(a.importedAt).getTime() : a[sortBy];
      const bv = sortBy === "importedAt" ? new Date(b.importedAt).getTime() : b[sortBy];
      return sortDesc ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
  }, [ads, searchText, sortBy, sortDesc, filterRef, filterRisk]);

  const handleRecalculate = () => {
    const allAds = storage.getAds();
    const updated = allAds.map((ad) => ({ ...ad, ...calculateScores(ad, allAds) }));
    storage.saveAds(updated);
    setAds(updated);
    toast.success("Scores recalculados!");
  };

  const [analyzingAi, setAnalyzingAi] = useState(false);

  const handleAiReanalyze = async () => {
    const adsToAnalyze = filtered.slice(0, 15);
    if (adsToAnalyze.length === 0) return;

    setAnalyzingAi(true);
    try {
      const adsPayload = adsToAnalyze.map((ad) => ({
        ad_archive_id: ad.id,
        page_name: ad.pageOrAdvertiser,
        ad_text: ad.mainText,
        headline: ad.headline,
        status: ad.status,
        started_at: ad.startDate || null,
        ad_creative_link_url: ad.link || null,
        platform: ad.platform,
      }));

      const { data, error } = await supabase.functions.invoke("ad-intelligence", {
        body: { query: "oferta escalada", ads: adsPayload },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na análise");

      const results = data.data?.results || [];
      const allAds = storage.getAds();
      let updated = 0;

      for (const result of results) {
        const matchAd = allAds.find((a) => a.id === result.ad_archive_id);
        if (matchAd && result.offer_card) {
          matchAd.promiseSummary = result.offer_card.promise || matchAd.promiseSummary;
          matchAd.mechanism = result.offer_card.mechanism || matchAd.mechanism;
          matchAd.proof = Array.isArray(result.offer_card.proof)
            ? result.offer_card.proof.join("; ")
            : matchAd.proof;
          matchAd.offer = result.offer_card.angle?.join(", ") || matchAd.offer;
          matchAd.inferredAudience = result.offer_card.format || matchAd.inferredAudience;
          updated++;
        }
      }

      if (updated > 0) {
        // Recalculate heuristic scores too
        const recalculated = allAds.map((ad) => ({ ...ad, ...calculateScores(ad, allAds) }));
        storage.saveAds(recalculated);
        setAds(recalculated);
      }

      toast.success(`${results.length} anúncio(s) reanalisado(s) com IA!`);
    } catch (e: any) {
      console.error("AI reanalyze error:", e);
      toast.error(e.message || "Erro ao reanalisar com IA.");
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleDelete = (id: string) => {
    storage.deleteAd(id);
    reload();
    toast.success("Anúncio removido.");
  };

  // Stats
  const avgScore = ads.length ? Math.round(ads.reduce((s, a) => s + a.overallScore, 0) / ads.length) : 0;
  const highScoreCount = ads.filter((a) => a.overallScore >= 70).length;
  const riskCount = ads.filter((a) => a.complianceAlerts.length > 0).length;
  const refCount = ads.filter((a) => a.savedAsReference).length;

  // Empty state
  if (ads.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Nenhum anúncio importado</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Importe anúncios na aba Swipe Offers para ver os scores, alertas de compliance e exportar em CSV.
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Score Médio" value={String(avgScore)} icon={<TrendingUp className="h-4 w-4" />} accent={avgScore >= 50} />
        <StatCard label="Alta Pontuação" value={String(highScoreCount)} icon={<Flame className="h-4 w-4" />} accent={highScoreCount > 0} />
        <StatCard label="Com Risco" value={String(riskCount)} icon={<Shield className="h-4 w-4" />} accent={false} warning={riskCount > 0} />
        <StatCard label="Referências" value={String(refCount)} icon={<Star className="h-4 w-4" />} accent={refCount > 0} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar anúncios..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overallScore">Score Geral</SelectItem>
            <SelectItem value="offerScore">Score Oferta</SelectItem>
            <SelectItem value="riskScore">Score Risco</SelectItem>
            <SelectItem value="importedAt">Data Import</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSortDesc(!sortDesc)}>
          <ArrowUpDown className="h-3.5 w-3.5" />
        </Button>

        <Badge variant={filterRef ? "default" : "outline"} className="py-1 gap-1 cursor-pointer text-xs" onClick={() => setFilterRef(!filterRef)}>
          <Star className="h-3 w-3" /> Referências
        </Badge>

        <Badge variant={filterRisk ? "default" : "outline"} className="py-1 gap-1 cursor-pointer text-xs" onClick={() => setFilterRisk(!filterRisk)}>
          <AlertTriangle className="h-3 w-3" /> Com Risco
        </Badge>

        {(searchText || filterRef || filterRisk) && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setSearchText(""); setFilterRef(false); setFilterRisk(false); }}>
            <X className="h-3 w-3" /> Limpar
          </Button>
        )}

        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleAiReanalyze} disabled={analyzingAi || filtered.length === 0} className="gap-1.5 text-xs h-8">
            {analyzingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            {analyzingAi ? "Analisando..." : `Reanalisar IA (${Math.min(filtered.length, 15)})`}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRecalculate} className="gap-1.5 text-xs h-8">
            <Flame className="h-3.5 w-3.5" /> Recalcular
          </Button>
          <Button variant="outline" size="sm" onClick={() => { exportAdsToCsv(filtered); toast.success("CSV exportado!"); }} className="gap-1.5 text-xs h-8">
            <Download className="h-3.5 w-3.5" /> Exportar CSV ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((ad) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              layout
            >
              <ResultRow ad={ad} onClick={() => setSelectedAd(ad)} onDelete={() => handleDelete(ad.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">Nenhum resultado com os filtros atuais.</div>
      )}

      <AdDetailSheet ad={selectedAd} open={!!selectedAd} onOpenChange={(o) => !o && setSelectedAd(null)} onUpdated={reload} />
    </motion.div>
  );
}

function StatCard({ label, value, icon, accent, warning }: { label: string; value: string; icon: React.ReactNode; accent: boolean; warning?: boolean }) {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${warning ? "bg-destructive/10 text-destructive" : accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</p>
          <p className={`text-xl font-bold ${warning ? "text-destructive" : accent ? "text-primary" : "text-foreground"}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultRow({ ad, onClick, onDelete }: { ad: ImportedAd; onClick: () => void; onDelete: () => void }) {
  const daysActive = ad.startDate
    ? Math.floor((Date.now() - new Date(ad.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card
      className="p-3 border-border/50 bg-card/80 hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Score circle */}
        <div className="shrink-0 w-12 text-center">
          <div className={`text-xl font-bold ${ad.overallScore >= 70 ? "text-primary" : ad.overallScore >= 40 ? "text-foreground" : "text-muted-foreground"}`}>
            {ad.overallScore}
          </div>
          <Progress value={ad.overallScore} className="h-1 mt-1" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{ad.pageOrAdvertiser}</p>
            {ad.savedAsReference && <Star className="h-3 w-3 text-primary fill-primary shrink-0" />}
          </div>
          {ad.headline && <p className="text-xs text-muted-foreground truncate mt-0.5">{ad.headline}</p>}
        </div>

        {/* Scores */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Oferta</p>
            <p className="text-sm font-semibold">{ad.offerScore}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Risco</p>
            <p className={`text-sm font-semibold ${ad.riskScore >= 50 ? "text-destructive" : ""}`}>{ad.riskScore}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="hidden md:flex flex-wrap gap-1 shrink-0 max-w-[200px]">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{ad.platform}</Badge>
          {daysActive != null && daysActive > 0 && (
            <Badge variant={daysActive >= 14 ? "default" : "outline"} className="text-[10px] px-1.5 py-0 gap-0.5">
              <Clock className="h-2.5 w-2.5" /> {daysActive}d
            </Badge>
          )}
          {ad.complianceAlerts.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" /> {ad.complianceAlerts.length}
            </Badge>
          )}
        </div>

        {/* Link + delete */}
        <div className="flex items-center gap-1 shrink-0">
          {ad.link && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild onClick={(e) => e.stopPropagation()}>
              <a href={ad.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
