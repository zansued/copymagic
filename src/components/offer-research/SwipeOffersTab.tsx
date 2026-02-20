import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, ExternalLink, Flame, Clock, Star, Trash2, X, AlertTriangle, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { storage } from "@/lib/ad-offer/storage";
import { calculateScores } from "@/lib/ad-offer/scoring";
import { generateQueries } from "@/lib/ad-offer/query-generator";
import type { ImportedAd } from "@/lib/ad-offer/types";
import ImportAdDialog from "./ImportAdDialog";
import AdDetailSheet from "./AdDetailSheet";

export default function SwipeOffersTab() {
  const [ads, setAds] = useState<ImportedAd[]>(() => storage.getAds());
  const [importOpen, setImportOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<ImportedAd | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterRef, setFilterRef] = useState(false);
  const [showQueries, setShowQueries] = useState(false);

  const packages = useMemo(() => storage.getPackages().filter((p) => p.enabled), []);
  const [selectedNiche, setSelectedNiche] = useState(packages[0]?.nicheId || "");

  const reload = useCallback(() => {
    setAds(storage.getAds());
  }, []);

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

  const handleRecalculate = () => {
    const allAds = storage.getAds();
    const updated = allAds.map((ad) => {
      const scores = calculateScores(ad, allAds);
      return { ...ad, ...scores };
    });
    storage.saveAds(updated);
    setAds(updated);
    toast.success("Scores recalculados!");
  };

  // Generate Meta Ad Library search queries
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

  const scaledCount = ads.filter((a) => a.overallScore >= 70).length;
  const refCount = ads.filter((a) => a.savedAsReference).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setImportOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Importar Anúncio
        </Button>
        <Button variant="outline" onClick={() => setShowQueries(!showQueries)} className="gap-1.5">
          <Search className="h-4 w-4" /> {showQueries ? "Ocultar Queries" : "Gerar Queries Meta"}
        </Button>
        {ads.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleRecalculate} className="gap-1.5 text-xs">
            <Flame className="h-3.5 w-3.5" /> Recalcular Scores
          </Button>
        )}
      </div>

      {/* Meta Ad Library Query Generator */}
      <AnimatePresence>
        {showQueries && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 border-border/50 bg-card/80 space-y-3">
              <div className="flex items-center gap-3">
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
                <p className="text-xs text-muted-foreground">
                  Clique para buscar na Meta Ad Library
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {queries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => openMetaLibrary(q.text)}
                    className="text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                      <span className="text-sm truncate">{q.text}</span>
                    </div>
                  </button>
                ))}
              </div>
              {queries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Configure pacotes de keywords na aba Keywords primeiro.
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      {ads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrar anúncios..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>

          <Badge variant="secondary" className="py-1 gap-1">{ads.length} total</Badge>
          <Badge
            variant={filterRef ? "default" : "outline"}
            className="py-1 gap-1 cursor-pointer"
            onClick={() => setFilterRef(!filterRef)}
          >
            <Star className="h-3 w-3" /> {refCount} referência(s)
          </Badge>
          <Badge variant="outline" className="py-1 gap-1">
            <Flame className="h-3 w-3" /> {scaledCount} alta pontuação
          </Badge>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
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
      {ads.length === 0 && (
        <Card className="p-8 border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Swipe Offers</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Busque anúncios na Meta Ad Library usando as queries geradas, depois importe os melhores para análise com scoring heurístico local.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setImportOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Importar Primeiro Anúncio
              </Button>
              <Button variant="outline" onClick={() => setShowQueries(true)} className="gap-1.5">
                <Search className="h-4 w-4" /> Gerar Queries
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Ad Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((ad) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <SwipeAdCard
                  ad={ad}
                  onClick={() => setSelectedAd(ad)}
                  onDelete={() => handleDelete(ad.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No results after filter */}
      {ads.length > 0 && filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum anúncio encontrado com os filtros atuais.
        </div>
      )}

      {/* Import Dialog */}
      <ImportAdDialog open={importOpen} onOpenChange={setImportOpen} onImported={reload} />

      {/* Detail Sheet */}
      <AdDetailSheet
        ad={selectedAd}
        open={!!selectedAd}
        onOpenChange={(open) => !open && setSelectedAd(null)}
        onUpdated={reload}
      />
    </motion.div>
  );
}

function SwipeAdCard({ ad, onClick, onDelete }: { ad: ImportedAd; onClick: () => void; onDelete: () => void }) {
  const daysActive = ad.startDate
    ? Math.floor((Date.now() - new Date(ad.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card
      className="p-4 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-colors cursor-pointer group relative"
      onClick={onClick}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Score badge */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`text-lg font-bold ${ad.overallScore >= 70 ? "text-primary" : ad.overallScore >= 40 ? "text-foreground" : "text-muted-foreground"}`}>
          {ad.overallScore}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{ad.pageOrAdvertiser}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{ad.platform}</Badge>
            <Badge variant={ad.status === "active" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
              {ad.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
            {ad.savedAsReference && (
              <Star className="h-3 w-3 text-primary fill-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Headline */}
      {ad.headline && (
        <p className="text-sm font-medium line-clamp-1 mb-1">{ad.headline}</p>
      )}

      {/* Text */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ad.mainText}</p>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        {daysActive != null && daysActive > 0 && (
          <span className={`flex items-center gap-1 ${daysActive >= 14 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            <Clock className="h-3 w-3" /> {daysActive}d
            {daysActive >= 14 && " 🔥"}
          </span>
        )}
        {ad.riskScore > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-3 w-3" /> Risco: {ad.riskScore}
          </span>
        )}
        {ad.detectedPromise !== "—" && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {ad.detectedPromise.split(",")[0]}
          </Badge>
        )}
      </div>
    </Card>
  );
}
