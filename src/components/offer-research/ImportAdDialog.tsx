import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { storage } from "@/lib/ad-offer/storage";
import { detectFields, calculateScores } from "@/lib/ad-offer/scoring";
import type { ImportedAd } from "@/lib/ad-offer/types";

interface ImportAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

const COUNTRIES = [
  { code: "BR", label: "🇧🇷 Brasil" },
  { code: "US", label: "🇺🇸 EUA" },
  { code: "PT", label: "🇵🇹 Portugal" },
  { code: "MX", label: "🇲🇽 México" },
  { code: "ES", label: "🇪🇸 Espanha" },
];

export default function ImportAdDialog({ open, onOpenChange, onImported }: ImportAdDialogProps) {
  const [form, setForm] = useState({
    pageOrAdvertiser: "",
    mainText: "",
    headline: "",
    country: "BR",
    platform: "facebook",
    status: "active",
    link: "",
    startDate: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleImport = () => {
    if (!form.pageOrAdvertiser.trim() || !form.mainText.trim()) {
      toast.error("Preencha ao menos o anunciante e o texto do anúncio.");
      return;
    }

    const fullText = `${form.mainText} ${form.headline}`;
    const detected = detectFields(fullText);
    const allAds = storage.getAds();

    const partial: Partial<ImportedAd> = {
      pageOrAdvertiser: form.pageOrAdvertiser,
      mainText: form.mainText,
      headline: form.headline,
      startDate: form.startDate || undefined,
    };

    const scores = calculateScores(partial, allAds);

    const ad: ImportedAd = {
      id: crypto.randomUUID(),
      pageOrAdvertiser: form.pageOrAdvertiser,
      mainText: form.mainText,
      headline: form.headline,
      country: form.country,
      platform: form.platform,
      status: form.status,
      link: form.link,
      importedAt: new Date().toISOString(),
      startDate: form.startDate || undefined,
      ...detected,
      promiseSummary: "",
      mechanism: "",
      proof: "",
      offer: "",
      inferredAudience: "",
      ...scores,
      savedAsReference: false,
    };

    storage.addAd(ad);
    toast.success(`Anúncio importado! Score: ${ad.overallScore}/100`);
    setForm({ pageOrAdvertiser: "", mainText: "", headline: "", country: "BR", platform: "facebook", status: "active", link: "", startDate: "" });
    onImported();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Anúncio Manualmente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Anunciante / Página *</Label>
            <Input value={form.pageOrAdvertiser} onChange={(e) => update("pageOrAdvertiser", e.target.value)} placeholder="Nome da página ou anunciante" />
          </div>

          <div className="space-y-2">
            <Label>Texto do Anúncio *</Label>
            <Textarea value={form.mainText} onChange={(e) => update("mainText", e.target.value)} placeholder="Cole o texto principal do anúncio aqui" rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Headline</Label>
            <Input value={form.headline} onChange={(e) => update("headline", e.target.value)} placeholder="Título/headline do anúncio" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={form.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={form.platform} onValueChange={(v) => update("platform", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="messenger">Messenger</SelectItem>
                  <SelectItem value="audience_network">Audience Network</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link do Anúncio</Label>
            <Input value={form.link} onChange={(e) => update("link", e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleImport}>Importar e Classificar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
