import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Save, Star, Download, AlertTriangle, ExternalLink, Bot, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/ad-offer/storage";
import { calculateScores } from "@/lib/ad-offer/scoring";
import { exportAdsToCsv } from "@/lib/ad-offer/csv-export";
import type { ImportedAd } from "@/lib/ad-offer/types";

interface AdDetailSheetProps {
  ad: ImportedAd | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function AdDetailSheet({ ad: initialAd, open, onOpenChange, onUpdated }: AdDetailSheetProps) {
  const [ad, setAd] = useState<ImportedAd | null>(initialAd);
  const [analyzing, setAnalyzing] = useState(false);

  // Sync when opening with a new ad
  if (initialAd && ad && initialAd.id !== ad.id) setAd(initialAd);
  if (initialAd && !ad) setAd(initialAd);

  if (!ad) return null;

  const update = (field: keyof ImportedAd, value: string) => {
    setAd((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const save = () => {
    if (ad) {
      storage.updateAd(ad);
      onUpdated();
      toast.success("Anúncio salvo!");
    }
  };

  const saveAsReference = () => {
    if (ad) {
      const updated = { ...ad, savedAsReference: true };
      storage.updateAd(updated);
      setAd(updated);
      onUpdated();
      toast.success("Salvo como referência ⭐");
    }
  };

  const handleAiReanalyze = async () => {
    if (!ad) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ad-intelligence", {
        body: {
          query: "oferta escalada",
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
      if (!data?.success) throw new Error(data?.error || "Erro na análise");

      const results = data.data?.results || [];
      const result = results[0];
      if (result?.offer_card) {
        const updatedAd = { ...ad };
        updatedAd.promiseSummary = result.offer_card.promise || ad.promiseSummary;
        updatedAd.mechanism = result.offer_card.mechanism || ad.mechanism;
        updatedAd.proof = Array.isArray(result.offer_card.proof) ? result.offer_card.proof.join("; ") : ad.proof;
        updatedAd.offer = result.offer_card.angle?.join(", ") || ad.offer;
        updatedAd.inferredAudience = result.offer_card.format || ad.inferredAudience;

        // Recalculate scores
        const allAds = storage.getAds();
        const idx = allAds.findIndex((a) => a.id === updatedAd.id);
        if (idx >= 0) allAds[idx] = updatedAd;
        const recalculated = allAds.map((a) => ({ ...a, ...calculateScores(a, allAds) }));
        storage.saveAds(recalculated);

        const finalAd = recalculated.find((a) => a.id === ad.id) || updatedAd;
        setAd(finalAd);
        onUpdated();
        toast.success("Anúncio reanalisado com IA!");
      } else {
        toast.info("Sem dados novos da IA para este anúncio.");
      }
    } catch (e: any) {
      console.error("AI reanalyze error:", e);
      toast.error(e.message || "Erro ao reanalisar com IA.");
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreColor = (score: number, type: "offer" | "risk" | "overall") => {
    if (type === "risk") return score >= 50 ? "text-destructive" : "text-muted-foreground";
    return score >= 70 ? "text-primary" : score >= 40 ? "text-yellow-400" : "text-foreground";
  };

  const hasAiData = !!(ad.promiseSummary && ad.promiseSummary !== "—" && ad.promiseSummary.length > 2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {ad.pageOrAdvertiser}
            {hasAiData && <Sparkles className="h-4 w-4 text-primary" />}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{ad.platform} · {ad.status} · {ad.country}</p>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Scores */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Geral", value: ad.overallScore, type: "overall" as const },
              { label: "Oferta", value: ad.offerScore, type: "offer" as const },
              { label: "Risco", value: ad.riskScore, type: "risk" as const },
            ].map((s) => (
              <Card key={s.label} className="border-border/40">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold ${scoreColor(s.value, s.type)}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Reanalyze Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiReanalyze}
            disabled={analyzing}
            className="w-full gap-2"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            {analyzing ? "Analisando com IA..." : "Reanalisar com IA"}
          </Button>

          {/* AI Offer Card (if available) */}
          {hasAiData && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Offer Card (IA)
                </p>
                {ad.promiseSummary && ad.promiseSummary !== "—" && (
                  <p className="text-sm"><span className="text-muted-foreground">Promessa:</span> {ad.promiseSummary}</p>
                )}
                {ad.mechanism && ad.mechanism !== "—" && (
                  <p className="text-sm"><span className="text-muted-foreground">Mecanismo:</span> {ad.mechanism}</p>
                )}
                {ad.proof && ad.proof !== "—" && (
                  <p className="text-sm"><span className="text-muted-foreground">Prova:</span> {ad.proof}</p>
                )}
                {ad.offer && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-sm text-muted-foreground">Ângulo:</span>
                    {ad.offer.split(",").map((a, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{a.trim()}</Badge>
                    ))}
                  </div>
                )}
                {ad.inferredAudience && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Formato:</span>
                    <Badge variant="outline" className="text-[10px]">{ad.inferredAudience}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compliance Alerts */}
          {ad.complianceAlerts.length > 0 && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-sm">Alertas de Compliance</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ad.complianceAlerts.map((a, i) => (
                  <Badge key={i} variant="destructive" className="text-xs">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Detecção Heurística */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detecção Heurística</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Promessa:</span> {ad.detectedPromise}</div>
              <div><span className="text-muted-foreground">Mecanismo:</span> {ad.detectedMechanism}</div>
              <div><span className="text-muted-foreground">Prova:</span> {ad.detectedProof}</div>
              <div><span className="text-muted-foreground">CTA:</span> {ad.detectedCTA}</div>
            </div>
          </div>

          {/* Texto Original */}
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

          {/* Offer Card Editável */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offer Card (Editável)</p>
            <div className="space-y-2">
              <Label className="text-xs">Promessa Principal</Label>
              <Input value={ad.promiseSummary} onChange={(e) => update("promiseSummary", e.target.value)} placeholder="Ex: Emagreça 10kg em 21 dias" className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Mecanismo</Label>
              <Input value={ad.mechanism} onChange={(e) => update("mechanism", e.target.value)} placeholder="Ex: Ritual matinal com chá" className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Prova</Label>
              <Textarea value={ad.proof} onChange={(e) => update("proof", e.target.value)} placeholder="Descreva as provas" rows={2} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Oferta</Label>
              <Textarea value={ad.offer} onChange={(e) => update("offer", e.target.value)} placeholder="Ex: R$97 + 3 bônus + garantia" rows={2} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Público Inferido</Label>
              <Input value={ad.inferredAudience} onChange={(e) => update("inferredAudience", e.target.value)} placeholder="Ex: Mulheres 35-55" className="h-8 text-sm" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button onClick={save} size="sm" className="gap-1.5 flex-1">
              <Save className="h-3.5 w-3.5" /> Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={saveAsReference} className="gap-1.5">
              <Star className="h-3.5 w-3.5" /> Referência
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAdsToCsv([ad])} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
