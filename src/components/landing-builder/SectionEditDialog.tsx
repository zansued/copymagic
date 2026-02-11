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

const AI_SUGGESTIONS: Record<string, string[]> = {
  hero: [
    "Aumente o headline para 72px com gradiente de texto",
    "Adicione um vídeo de fundo ou animação CSS de partículas",
    "Inclua um contador de urgência (vagas limitadas)",
    "Melhore o CTA com efeito glow e micro-interação",
  ],
  "trust-strip": [
    "Adicione logos de empresas/veículos de mídia",
    "Inclua número de clientes atendidos com animação de contagem",
    "Adicione selos de segurança e certificações",
  ],
  problems: [
    "Torne as dores mais emocionais e específicas",
    "Adicione ícones ilustrativos para cada problema",
    "Use cards com sombra e hover effect",
  ],
  solution: [
    "Adicione um diagrama visual do mecanismo",
    "Inclua um before/after visual",
    "Destaque o diferencial com gradiente de destaque",
  ],
  features: [
    "Reorganize em grid de cards com ícones",
    "Adicione animação de entrada ao scroll",
    "Destaque o benefício principal com badge premium",
  ],
  "social-proof": [
    "Adicione fotos e estrelas aos depoimentos",
    "Crie um carrossel animado de testimonials",
    "Inclua resultados numéricos em destaque",
  ],
  pricing: [
    "Adicione um comparativo de preços (de/por)",
    "Inclua badges de bônus no card de preço",
    "Adicione efeito de destaque no plano recomendado",
  ],
  faq: [
    "Melhore o accordion com animação suave",
    "Adicione ícones de + e - animados",
    "Destaque as perguntas mais importantes",
  ],
  guarantee: [
    "Adicione um selo visual de garantia grande",
    "Inclua ícone de escudo ou cadeado",
    "Torne a linguagem mais confiante e direta",
  ],
  "final-cta": [
    "Adicione urgência com countdown timer",
    "Inclua resumo dos bônus antes do botão",
    "Adicione efeito pulse no botão CTA",
  ],
  footer: [
    "Melhore o layout com múltiplas colunas",
    "Adicione links de navegação e redes sociais",
    "Inclua disclaimer legal e política de privacidade",
  ],
};

const GENERIC_ACTIONS = [
  "Deixe mais impactante e emocional",
  "Melhore o design visual",
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
              🤖 Sugestões de IA para "{SECTION_LABELS[sectionName] || sectionName}"
            </label>
            <div className="flex flex-wrap gap-2">
              {(AI_SUGGESTIONS[sectionName] || []).map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors disabled:opacity-50"
                >
                  ✨ {action}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Ações gerais
            </label>
            <div className="flex flex-wrap gap-2">
              {GENERIC_ACTIONS.map((action) => (
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
