import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  "trust-strip": "Faixa de Confiança",
  problems: "Problemas & Dores",
  solution: "Solução / Mecanismo",
  features: "Benefícios & Features",
  "social-proof": "Prova Social",
  pricing: "Oferta & Preço",
  faq: "FAQ",
  guarantee: "Garantia",
  "final-cta": "CTA Final",
  footer: "Footer",
};

const QUICK_ACTIONS = [
  "Deixe mais impactante e emocional",
  "Melhore o design visual",
  "Adicione mais elementos de prova social",
  "Adicione animações CSS",
  "Torne mais compacto e escaneável",
  "Melhore a responsividade mobile",
];

interface SectionEditDialogProps {
  open: boolean;
  onClose: () => void;
  sectionName: string;
  onSubmit: (instruction: string) => void;
  loading: boolean;
}

export function SectionEditDialog({
  open,
  onClose,
  sectionName,
  onSubmit,
  loading,
}: SectionEditDialogProps) {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = () => {
    if (!instruction.trim()) return;
    onSubmit(instruction.trim());
  };

  const handleQuickAction = (action: string) => {
    setInstruction(action);
    onSubmit(action);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Editar: {SECTION_LABELS[sectionName] || sectionName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Ações rápidas
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground/80 transition-colors disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Ou descreva o que deseja
            </label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Adicione um contador de urgência, mude o gradiente para tons de azul, inclua 3 depoimentos com fotos..."
              rows={3}
              className="resize-none"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !instruction.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Aplicando...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Aplicar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
