import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Search, Plus, ExternalLink, Flame, Clock, Star, Trash2, X,
  AlertTriangle, Filter, Loader2, Sparkles, Bot, TrendingUp, Play, Image as ImageIcon,
  Facebook, Instagram, MessageCircle, Users, AtSign, Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/ad-offer/storage";
import { calculateScores, detectFields } from "@/lib/ad-offer/scoring";
import { generateQueries } from "@/lib/ad-offer/query-generator";
import type { ImportedAd } from "@/lib/ad-offer/types";
import ImportAdDialog from "./ImportAdDialog";

// Shared platform icon config
const PLATFORM_ICON_MAP: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  facebook: { icon: <Facebook className="h-3 w-3" />, className: "bg-blue-500/15 text-blue-400 border-blue-500/25", label: "Facebook" },
  instagram: { icon: <Instagram className="h-3 w-3" />, className: "bg-pink-500/15 text-pink-400 border-pink-500/25", label: "Instagram" },
  messenger: { icon: <MessageCircle className="h-3 w-3" />, className: "bg-violet-500/15 text-violet-400 border-violet-500/25", label: "Messenger" },
  audience_network: { icon: <Users className="h-3 w-3" />, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", label: "Audience Network" },
  threads: { icon: <AtSign className="h-3 w-3" />, className: "bg-amber-500/15 text-amber-400 border-amber-500/25", label: "Threads" },
};
const DEFAULT_PLATFORM = { icon: <Globe className="h-3 w-3" />, className: "bg-secondary text-secondary-foreground border-border", label: "Outro" };

function getPlatformConfig(p: string) {
  const key = p.toLowerCase().trim().replace(/\s+/g, "_");
  return PLATFORM_ICON_MAP[key] || DEFAULT_PLATFORM;
}

function PlatformIcons({ platform }: { platform: string }) {
  const platforms = platform.split(",").map((p) => p.trim()).filter(Boolean);
  return (
    <span className="flex gap-1">
      {platforms.map((p, i) => {
        const config = getPlatformConfig(p);
        return (
          <span key={i} title={config.label} className={`inline-flex items-center justify-center h-5 w-5 rounded border ${config.className}`}>
            {config.icon}
          </span>
        );
      })}
    </span>
  );
}
import { VideoPlayer } from "@/components/ui/video-player";


interface AiOfferCard {
  promise?: string;
  mechanism?: string;
  proof?: string[];
  cta?: string;
  angle?: string[];
  format?: string;
  compliance_note?: string;
}

interface AiResult {
  ad_archive_id?: string;
  page_name?: string;
  scale_score?: { score_0_100: number; reasoning_short: string; signals?: Record<string, number> };
  offer_card?: AiOfferCard;
  funnel?: { initial_url?: string; final_url?: string; platform_guess?: string; funnel_map?: string };
}

export default function SwipeOffersTab() {
  const [ads, setAds] = useState<ImportedAd[]>(() => storage.getAds());
  const [importOpen, setImportOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<ImportedAd | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterRef, setFilterRef] = useState(false);
  const [showQueries, setShowQueries] = useState(false);
  const [searching, setSearching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);

  const packages = useMemo(() => storage.getPackages().filter((p) => p.enabled), []);
  const [selectedNiche, setSelectedNiche] = useState(packages[0]?.nicheId || "");

  const reload = useCallback(() => setAds(storage.getAds()), []);

  useEffect(() => {
    const handler = () => reload();
    window.addEventListener("ads-updated", handler);
    return () => window.removeEventListener("ads-updated", handler);
  }, [reload]);

  const filtered = useMemo(() => {
    let list = ads;
    if (filterStatus !== "all") list = list.filter((a) => a.status === filterStatus);
    if (filterRef) list = list.filter((a) => a.savedAsReference);
    if (searchText) {
      const s = searchText.toLowerCase();
      list = list.filter((a) =>
        a.pageOrAdvertiser.toLowerCase().includes(s) ||
        a.mainText.toLowerCase().includes(s) ||
        a.headline.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => b.overallScore - a.overallScore);
  }, [ads, filterStatus, filterRef, searchText]);

  const handleDelete = (id: string) => {
    storage.deleteAd(id);
    reload();
    toast.success("Anúncio removido.");
  };

  // Search scaled ads via offer-research edge function
  const handleSearchAds = async () => {
    const pkg = packages.find((p) => p.nicheId === selectedNiche);
    if (!pkg) {
      toast.error("Selecione um nicho primeiro.");
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("offer-research", {
        body: { niche: pkg.nicheName, sources: ["ads"] },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na busca");

      const foundAds = data.data?.anuncios_encontrados || [];
      if (foundAds.length === 0) {
        toast.info("Nenhum anúncio encontrado para esse nicho. Tente importar manualmente.");
        return;
      }

      // Convert found ads to ImportedAd format and save
      const allAds = storage.getAds();
      let imported = 0;

      for (const ad of foundAds) {
        const text = `${ad.texto_anuncio || ""} ${ad.gancho || ""}`;
        const detected = detectFields(text);
        const partial: Partial<ImportedAd> = {
          pageOrAdvertiser: ad.anunciante || "Desconhecido",
          mainText: ad.texto_anuncio || "",
          headline: ad.gancho || "",
          startDate: ad.data_inicio || undefined,
        };
        const scores = calculateScores(partial, allAds);

        const importedAd: ImportedAd = {
          id: crypto.randomUUID(),
          pageOrAdvertiser: ad.anunciante || "Desconhecido",
          mainText: ad.texto_anuncio || "",
          headline: ad.gancho || "",
          country: "BR",
          platform: ad.plataforma || "facebook",
          status: ad.status || "active",
          link: ad.url_destino || ad.url_anuncio || "",
          importedAt: new Date().toISOString(),
          startDate: ad.data_inicio || undefined,
          nicheId: selectedNiche,
          ...detected,
          promiseSummary: "",
          mechanism: "",
          proof: "",
          offer: "",
          inferredAudience: "",
          ...scores,
          savedAsReference: false,
        };

        // Avoid duplicates by text
        const exists = allAds.some((a) =>
          a.mainText === importedAd.mainText && a.pageOrAdvertiser === importedAd.pageOrAdvertiser
        );
        if (!exists) {
          allAds.push(importedAd);
          imported++;
        }
      }

      if (imported > 0) {
        // Recalculate all scores with the full list for accurate density/variety
        const recalculated = allAds.map((ad) => ({
          ...ad,
          ...calculateScores(ad, allAds),
        }));
        storage.saveAds(recalculated);
        reload();
        toast.success(`${imported} anúncio(s) importado(s) do nicho "${pkg.nicheName}"!`);
      } else {
        toast.info("Todos os anúncios encontrados já estão importados.");
      }
    } catch (e: any) {
      console.error("Search error:", e);
      toast.error(e.message || "Erro ao buscar anúncios.");
    } finally {
      setSearching(false);
    }
  };

  // AI Analysis via ad-intelligence edge function
  const handleAnalyzeAll = async () => {
    const adsToAnalyze = filtered.slice(0, 15);
    if (adsToAnalyze.length === 0) {
      toast.error("Importe anúncios primeiro.");
      return;
    }

    setAnalyzing(true);
    setAiResults([]);
    const pkg = packages.find((p) => p.nicheId === selectedNiche);

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
        body: {
          query: pkg?.nicheName || selectedNiche || "oferta escalada",
          ads: adsPayload,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na análise");

      const results = data.data?.results || [];
      setAiResults(results);

      // Update ads with AI data
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
          matchAd.aiScaleScore = result.scale_score?.score_0_100 || matchAd.aiScaleScore;
          updated++;
        }
      }
      if (updated > 0) {
        const recalculated = allAds.map((a) => ({ ...a, ...calculateScores(a, allAds) }));
        storage.saveAds(recalculated);
        reload();
      }

      toast.success(`${results.length} anúncio(s) analisado(s) com IA!`);
    } catch (e: any) {
      console.error("AI analysis error:", e);
      toast.error(e.message || "Erro ao analisar com IA.");
    } finally {
      setAnalyzing(false);
    }
  };

  const queries = useMemo(() => {
    if (!selectedNiche) return [];
    const pkg = packages.find((p) => p.nicheId === selectedNiche);
    if (!pkg) return [];
    const modifiers = storage.getModifiers().filter((m) => m.enabled);
    return generateQueries(pkg, modifiers, 6);
  }, [selectedNiche, packages]);

  const openMetaLibrary = (query: string) => {
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&media_type=all&q=${encodeURIComponent(query)}&search_type=keyword_unordered`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getAiResult = (adId: string) => aiResults.find((r) => r.ad_archive_id === adId);

  const scaledCount = ads.filter((a) => a.overallScore >= 70).length;
  const refCount = ads.filter((a) => a.savedAsReference).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Search bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedNiche} onValueChange={setSelectedNiche}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Selecione o nicho" />
          </SelectTrigger>
          <SelectContent>
            {packages.map((p) => (
              <SelectItem key={p.nicheId} value={p.nicheId}>{p.nicheName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSearchAds} disabled={searching || !selectedNiche} className="gap-1.5">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {searching ? "Buscando..." : "Buscar Anúncios"}
        </Button>

        <Button onClick={() => setImportOpen(true)} variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" /> Importar Manual
        </Button>

        {filtered.length > 0 && (
          <Button onClick={handleAnalyzeAll} variant="outline" disabled={analyzing} className="gap-1.5">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {analyzing ? "Analisando..." : `Analisar com IA (${Math.min(filtered.length, 15)})`}
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={() => setShowQueries(!showQueries)} className="gap-1.5 text-xs">
          <ExternalLink className="h-3.5 w-3.5" /> Queries Meta
        </Button>
      </div>

      {/* Queries panel */}
      <AnimatePresence>
        {showQueries && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="p-4 border-border/50 bg-card/80 space-y-3">
              <p className="text-xs text-muted-foreground">Clique para abrir busca direta na Meta Ad Library:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {queries.map((q, i) => (
                  <button key={i} onClick={() => openMetaLibrary(q.text)} className="text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors group">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                      <span className="text-sm truncate">{q.text}</span>
                    </div>
                  </button>
                ))}
              </div>
              {queries.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Configure keywords na aba Keywords.</p>}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {searching && (
        <Card className="p-8 border-border/50 bg-card/80">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Buscando anúncios escalados no nicho selecionado...</p>
          </div>
        </Card>
      )}

      {/* Filters */}
      {ads.length > 0 && !searching && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Filtrar anúncios..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>
          <Badge variant="secondary" className="py-1 gap-1">{ads.length} total</Badge>
          <Badge variant={filterRef ? "default" : "outline"} className="py-1 gap-1 cursor-pointer" onClick={() => setFilterRef(!filterRef)}>
            <Star className="h-3 w-3" /> {refCount} ref
          </Badge>
          <Badge variant="outline" className="py-1 gap-1">
            <Flame className="h-3 w-3" /> {scaledCount} escalados
          </Badge>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-28 h-8 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          {(searchText || filterStatus !== "all" || filterRef) && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setSearchText(""); setFilterStatus("all"); setFilterRef(false); }}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
      )}

      {/* Empty State */}
      {ads.length === 0 && !searching && (
        <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Descubra Ofertas Escaladas</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Selecione um nicho e clique em "Buscar Anúncios" para encontrar ofertas escaladas via IA, ou importe manualmente da Meta Ad Library.
            </p>
          </div>
        </Card>
      )}

      {/* Ad Grid */}
      {!searching && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((ad) => (
              <motion.div key={ad.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} layout>
                <SwipeAdCard ad={ad} aiResult={getAiResult(ad.id)} onClick={() => setSelectedAd(ad)} onDelete={() => handleDelete(ad.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {ads.length > 0 && filtered.length === 0 && !searching && (
        <div className="text-center py-8 text-muted-foreground text-sm">Nenhum anúncio com os filtros atuais.</div>
      )}

      <ImportAdDialog open={importOpen} onOpenChange={setImportOpen} onImported={reload} />

      {/* Detail Sheet with AI */}
      <AdDetailSheetWithAI
        ad={selectedAd}
        aiResult={selectedAd ? getAiResult(selectedAd.id) : undefined}
        open={!!selectedAd}
        onOpenChange={(o) => !o && setSelectedAd(null)}
        onUpdated={reload}
        niche={packages.find((p) => p.nicheId === selectedNiche)?.nicheName || ""}
      />
    </motion.div>
  );
}

// --- Ad Card (redesigned) ---
function SwipeAdCard({ ad, aiResult, onClick, onDelete }: {
  ad: ImportedAd; aiResult?: AiResult; onClick: () => void; onDelete: () => void;
}) {
  const daysActive = ad.startDate
    ? Math.floor((Date.now() - new Date(ad.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const aiScore = aiResult?.scale_score?.score_0_100;
  const score = aiScore ?? ad.overallScore;

  const startFormatted = ad.startDate
    ? new Date(ad.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  // Extract domain from link
  const domain = ad.link ? (() => { try { return new URL(ad.link).hostname.replace("www.", ""); } catch { return null; } })() : null;

  const toggleRef = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allAds = storage.getAds();
    const target = allAds.find((a) => a.id === ad.id);
    if (target) {
      target.savedAsReference = !target.savedAsReference;
      storage.updateAd(target);
      toast.success(target.savedAsReference ? "Salvo como referência ⭐" : "Removido das referências");
      window.dispatchEvent(new CustomEvent("ads-updated"));
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col">
      {/* Top meta bar */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        {/* Score badge + updated info */}
        <div className="flex items-center justify-between">
          <Badge variant={score >= 70 ? "default" : "secondary"} className={`text-[10px] px-2 py-0.5 ${score >= 70 ? "bg-primary/20 text-primary border-primary/30" : ""}`}>
            {score >= 70 ? "🔥 " : ""}{score}/100
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {startFormatted ? `Publicado ${startFormatted}` : "Sem data"}
          </span>
        </div>

        {/* Platform + days active row */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Plataformas</span>
            <PlatformIcons platform={ad.platform} />
          </div>
          {daysActive != null && daysActive > 0 && (
            <span className={`font-semibold ${daysActive >= 14 ? "text-primary" : ""}`}>
              Ativo {daysActive} {daysActive === 1 ? "dia" : "dias"}
            </span>
          )}
        </div>
      </div>

      {/* Advertiser row */}
      <div className="px-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
            {ad.pageOrAdvertiser.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{ad.pageOrAdvertiser}</p>
            {domain && <p className="text-[10px] text-muted-foreground truncate">{domain}</p>}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Ad text preview */}
      <div className="px-3 pb-2">
        <p className="text-xs text-foreground/80 line-clamp-1">
          {ad.headline || ad.mainText.slice(0, 60)}
          {(ad.headline || ad.mainText).length > 60 && <span className="font-semibold text-foreground"> Ver mais...</span>}
        </p>
      </div>

      {/* Snapshot / Video preview area */}
      <div className="mx-3 mb-2 relative">
        <VideoPlayer
          thumbnailUrl={ad.link ? `https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(ad.link).hostname; } catch { return "example.com"; } })()}&sz=128` : undefined}
          videoUrl={ad.link || undefined}
          title={ad.pageOrAdvertiser}
          description={aiResult?.offer_card?.promise || ad.headline || undefined}
          aspectRatio="4/3"
          className="border border-border/30"
        />
        {aiResult?.offer_card?.format && (
          <Badge variant="secondary" className="absolute bottom-2 left-2 z-20 text-[10px] px-1.5 py-0 bg-background/80 backdrop-blur-sm">
            {aiResult.offer_card.format}
          </Badge>
        )}
      </div>

      {/* AI Promise / offer info */}
      <div className="px-3 pb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {aiResult?.offer_card?.promise ? (
            <p className="text-xs font-medium text-primary line-clamp-1">✨ {aiResult.offer_card.promise}</p>
          ) : (
            <p className="text-xs text-muted-foreground line-clamp-1">{ad.mainText.slice(0, 80)}</p>
          )}
          {aiResult?.offer_card?.angle && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{aiResult.offer_card.angle.join(", ")}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t border-border/30 flex">
        <button
          onClick={toggleRef}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors hover:bg-muted/50 ${ad.savedAsReference ? "text-primary font-semibold" : "text-muted-foreground"}`}
        >
          <Star className={`h-3.5 w-3.5 ${ad.savedAsReference ? "fill-primary" : ""}`} />
          Favoritar
        </button>
        <div className="w-px bg-border/30" />
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Bot className="h-3.5 w-3.5" />
          Analisar com IA
        </button>
      </div>
    </Card>
  );
}

// --- Detail Sheet with AI Analysis ---
function AdDetailSheetWithAI({ ad: initialAd, aiResult, open, onOpenChange, onUpdated, niche }: {
  ad: ImportedAd | null; aiResult?: AiResult; open: boolean; onOpenChange: (o: boolean) => void; onUpdated: () => void; niche: string;
}) {
  const [ad, setAd] = useState<ImportedAd | null>(initialAd);
  const [analyzing, setAnalyzing] = useState(false);
  const [localAiResult, setLocalAiResult] = useState<AiResult | undefined>(aiResult);

  if (initialAd && ad && initialAd.id !== ad.id) { setAd(initialAd); setLocalAiResult(aiResult); }
  if (initialAd && !ad) { setAd(initialAd); setLocalAiResult(aiResult); }

  if (!ad) return null;

  const update = (field: keyof ImportedAd, value: string) => setAd((prev) => prev ? { ...prev, [field]: value } : prev);

  const save = () => {
    if (!ad) return;
    const allAds = storage.getAds();
    const exists = allAds.some((a) => a.id === ad.id);
    if (exists) {
      storage.updateAd(ad);
    } else {
      storage.addAd(ad);
    }
    onUpdated();
    toast.success("Anúncio salvo!");
  };

  const saveAsReference = () => {
    if (!ad) return;
    const updated = { ...ad, savedAsReference: true };
    const allAds = storage.getAds();
    const exists = allAds.some((a) => a.id === updated.id);
    if (exists) {
      storage.updateAd(updated);
    } else {
      storage.addAd(updated);
    }
    setAd(updated);
    onUpdated();
    toast.success("Salvo como referência ⭐");
  };

  const handleAnalyzeSingle = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ad-intelligence", {
        body: {
          query: niche || ad.pageOrAdvertiser,
          ads: [{
            ad_archive_id: ad.id,
            page_name: ad.pageOrAdvertiser,
            ad_text: ad.mainText,
            headline: ad.headline,
            status: ad.status,
            started_at: ad.startDate || null,
            ad_creative_link_url: ad.link || null,
            platform: ad.platform,
          }],
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro");

      const result = data.data?.results?.[0];
      if (result) {
        setLocalAiResult(result);
        // Update ad fields
        if (result.offer_card) {
          const updatedAd = {
            ...ad,
            promiseSummary: result.offer_card.promise || ad.promiseSummary,
            mechanism: result.offer_card.mechanism || ad.mechanism,
            proof: Array.isArray(result.offer_card.proof) ? result.offer_card.proof.join("; ") : ad.proof,
            offer: result.offer_card.angle?.join(", ") || ad.offer,
            inferredAudience: result.offer_card.format || ad.inferredAudience,
            aiScaleScore: result.scale_score?.score_0_100 || ad.aiScaleScore,
          };
          // Recalculate heuristic scores with full list
          const allAds = storage.getAds();
          const idx = allAds.findIndex((a) => a.id === updatedAd.id);
          if (idx >= 0) allAds[idx] = updatedAd;
          const recalculated = allAds.map((a) => ({ ...a, ...calculateScores(a, allAds) }));
          storage.saveAds(recalculated);
          const finalAd = recalculated.find((a) => a.id === ad.id) || updatedAd;
          setAd(finalAd);
          onUpdated();
        }
        toast.success("Análise IA concluída!");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro na análise.");
    } finally {
      setAnalyzing(false);
    }
  };

  const currentAi = localAiResult;
  const scoreColor = (score: number, type: string) => {
    if (type === "risk") return score >= 50 ? "text-destructive" : "text-muted-foreground";
    return score >= 70 ? "text-primary" : "text-foreground";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {ad.pageOrAdvertiser}
            {currentAi && <Sparkles className="h-4 w-4 text-amber-400" />}
          </SheetTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-1">
              {ad.platform.split(/,\s*/).map((p, i) => {
                const config = getPlatformConfig(p);
                return (
                  <span key={i} title={p.trim()} className={`inline-flex items-center justify-center h-5 w-5 rounded border ${config.className}`}>
                    {config.icon}
                  </span>
                );
              })}
            </span>
            <span>· {ad.status} · {ad.country}</span>
          </div>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Scores */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Geral", value: currentAi?.scale_score?.score_0_100 ?? ad.overallScore, type: "overall" },
              { label: "Oferta", value: ad.offerScore, type: "offer" },
              { label: "Risco", value: ad.riskScore, type: "risk" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                  <p className={`text-2xl font-bold ${scoreColor(s.value, s.type)}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Scale Score reasoning */}
          {currentAi?.scale_score?.reasoning_short && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Análise IA</p>
              <p className="text-sm text-foreground/80">{currentAi.scale_score.reasoning_short}</p>
            </div>
          )}

          {/* AI Offer Card */}
          {currentAi?.offer_card && (
            <div className="space-y-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Bot className="h-3 w-3" /> Offer Card (IA)
              </p>
              <div className="space-y-1.5 text-sm">
                {currentAi.offer_card.promise && (
                  <div><span className="text-muted-foreground">Promessa:</span> <span className="text-foreground font-medium">{currentAi.offer_card.promise}</span></div>
                )}
                {currentAi.offer_card.mechanism && (
                  <div><span className="text-muted-foreground">Mecanismo:</span> <span>{currentAi.offer_card.mechanism}</span></div>
                )}
                {currentAi.offer_card.proof && currentAi.offer_card.proof.length > 0 && (
                  <div><span className="text-muted-foreground">Prova:</span> <span>{currentAi.offer_card.proof.join("; ")}</span></div>
                )}
                {currentAi.offer_card.cta && (
                  <div><span className="text-muted-foreground">CTA:</span> <span>{currentAi.offer_card.cta}</span></div>
                )}
                {currentAi.offer_card.angle && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground">Ângulo:</span>
                    {currentAi.offer_card.angle.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}
                  </div>
                )}
                {currentAi.offer_card.format && (
                  <div><span className="text-muted-foreground">Formato:</span> <Badge variant="outline" className="text-xs">{currentAi.offer_card.format}</Badge></div>
                )}
                {currentAi.offer_card.compliance_note && currentAi.offer_card.compliance_note !== "ok" && (
                  <div className="flex items-start gap-1.5 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="text-xs">{currentAi.offer_card.compliance_note}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Funnel */}
          {currentAi?.funnel && currentAi.funnel.funnel_map && (
            <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Funil Detectado</p>
              <p className="text-sm font-mono text-foreground">{currentAi.funnel.funnel_map}</p>
              {currentAi.funnel.platform_guess && (
                <Badge variant="outline" className="text-xs mt-1.5">{currentAi.funnel.platform_guess}</Badge>
              )}
            </div>
          )}

          {/* Compliance Alerts */}
          {ad.complianceAlerts.length > 0 && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-sm">Alertas de Compliance</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ad.complianceAlerts.map((a, i) => <Badge key={i} variant="destructive" className="text-xs">{a}</Badge>)}
              </div>
            </div>
          )}

          {/* Heuristic detection removed - covered by Offer Card IA */}

          {/* Original text */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Texto Original</p>
            {ad.headline && <p className="font-medium text-sm">{ad.headline}</p>}
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ad.mainText}</p>
            {ad.link && (
              <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> {ad.link}
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button onClick={handleAnalyzeSingle} disabled={analyzing} size="sm" variant="outline" className="gap-1.5 flex-1">
              {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
              {currentAi ? "Reanalisar com IA" : "Analisar com IA"}
            </Button>
            <Button onClick={save} size="sm" className="gap-1.5 flex-1">
              <Star className="h-3.5 w-3.5" /> Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={saveAsReference} className="gap-1.5">
              <Star className="h-3.5 w-3.5" /> Referência
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
