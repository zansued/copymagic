import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Sparkles, Zap, Paintbrush, Smartphone, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

const SECTION_ICONS: Record<string, string> = {
  hero: "🎯",
  "trust-strip": "🏆",
  problems: "🔥",
  solution: "💡",
  features: "⭐",
  "social-proof": "💬",
  pricing: "💰",
  faq: "❓",
  guarantee: "🛡️",
  "final-cta": "🚀",
  footer: "📋",
};

const AI_SUGGESTIONS: Record<string, { text: string; icon: string }[]> = {
  hero: [
    { text: "Aumente o headline para 72px com gradiente de texto", icon: "✨" },
    { text: "Adicione um vídeo de fundo ou animação CSS de partículas", icon: "🎬" },
    { text: "Inclua um contador de urgência (vagas limitadas)", icon: "⏰" },
    { text: "Melhore o CTA com efeito glow e micro-interação", icon: "🔮" },
  ],
  "trust-strip": [
    { text: "Adicione logos de empresas/veículos de mídia", icon: "🏢" },
    { text: "Inclua número de clientes atendidos com animação de contagem", icon: "📊" },
    { text: "Adicione selos de segurança e certificações", icon: "🔒" },
  ],
  problems: [
    { text: "Torne as dores mais emocionais e específicas", icon: "💔" },
    { text: "Adicione ícones ilustrativos para cada problema", icon: "🎨" },
    { text: "Use cards com sombra e hover effect", icon: "🃏" },
  ],
  solution: [
    { text: "Adicione um diagrama visual do mecanismo", icon: "📐" },
    { text: "Inclua um before/after visual", icon: "🔄" },
    { text: "Destaque o diferencial com gradiente de destaque", icon: "🌈" },
  ],
  features: [
    { text: "Reorganize em grid de cards com ícones", icon: "📦" },
    { text: "Adicione animação de entrada ao scroll", icon: "🎞️" },
    { text: "Destaque o benefício principal com badge premium", icon: "👑" },
  ],
  "social-proof": [
    { text: "Adicione fotos e estrelas aos depoimentos", icon: "⭐" },
    { text: "Crie um carrossel animado de testimonials", icon: "🎠" },
    { text: "Inclua resultados numéricos em destaque", icon: "📈" },
  ],
  pricing: [
    { text: "Adicione um comparativo de preços (de/por)", icon: "💵" },
    { text: "Inclua badges de bônus no card de preço", icon: "🎁" },
    { text: "Adicione efeito de destaque no plano recomendado", icon: "💎" },
  ],
  faq: [
    { text: "Melhore o accordion com animação suave", icon: "🎹" },
    { text: "Adicione ícones de + e - animados", icon: "➕" },
    { text: "Destaque as perguntas mais importantes", icon: "📌" },
  ],
  guarantee: [
    { text: "Adicione um selo visual de garantia grande", icon: "🏅" },
    { text: "Inclua ícone de escudo ou cadeado", icon: "🔐" },
    { text: "Torne a linguagem mais confiante e direta", icon: "💪" },
  ],
  "final-cta": [
    { text: "Adicione urgência com countdown timer", icon: "⏳" },
    { text: "Inclua resumo dos bônus antes do botão", icon: "📋" },
    { text: "Adicione efeito pulse no botão CTA", icon: "💫" },
  ],
  footer: [
    { text: "Melhore o layout com múltiplas colunas", icon: "📰" },
    { text: "Adicione links de navegação e redes sociais", icon: "🔗" },
    { text: "Inclua disclaimer legal e política de privacidade", icon: "⚖️" },
  ],
};

const GENERIC_ACTIONS = [
  { text: "Deixe mais impactante e emocional", icon: Sparkles },
  { text: "Melhore o design visual", icon: Paintbrush },
  { text: "Adicione animações CSS", icon: Zap },
  { text: "Torne mais compacto e escaneável", icon: Minimize2 },
  { text: "Melhore a responsividade mobile", icon: Smartphone },
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

  const sectionIcon = SECTION_ICONS[sectionName] || "✏️";
  const sectionLabel = SECTION_LABELS[sectionName] || sectionName;
  const suggestions = AI_SUGGESTIONS[sectionName] || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-primary/20">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-5 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              <span className="text-2xl">{sectionIcon}</span>
              <div>
                <span className="font-bold">Editar: {sectionLabel}</span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  Escolha uma sugestão ou descreva o que deseja
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edite a seção {sectionLabel} com instruções de IA
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Wand2 className="h-3 w-3" />
                Sugestões de IA
              </label>
              <div className="grid gap-1.5">
                <AnimatePresence>
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={s.text}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleQuickAction(s.text)}
                      disabled={loading}
                      className="flex items-center gap-2.5 text-left text-sm px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/25 text-foreground/90 transition-all disabled:opacity-50 group"
                    >
                      <span className="text-base flex-shrink-0">{s.icon}</span>
                      <span className="flex-1">{s.text}</span>
                      <Wand2 className="h-3 w-3 text-primary/40 group-hover:text-primary transition-colors flex-shrink-0" />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Generic Actions */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Ações rápidas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENERIC_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.text}
                    onClick={() => handleQuickAction(action.text)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground/70 hover:text-foreground border border-border/50 hover:border-border transition-all disabled:opacity-50"
                  >
                    <Icon className="h-3 w-3" />
                    {action.text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom instruction */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Instrução personalizada
            </label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Adicione um contador de urgência, mude o gradiente para tons de azul, inclua 3 depoimentos com fotos..."
              rows={3}
              className="resize-none text-sm"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Ctrl+Enter para enviar
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/50 bg-secondary/20">
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={loading || !instruction.trim()} className="gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Aplicar
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
