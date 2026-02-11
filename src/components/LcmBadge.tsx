import type { GenerationContext } from "@/lib/lcm-types";
import { LANGUAGES, FORMALITY_OPTIONS } from "@/lib/lcm-types";

interface LcmBadgeProps {
  context: GenerationContext;
  onEdit?: () => void;
}

export function LcmBadge({ context, onEdit }: LcmBadgeProps) {
  const lang = LANGUAGES.find((l) => l.code === context.language_code);
  const tone = FORMALITY_OPTIONS.find((f) => f.value === context.tone_formality);

  return (
    <button
      onClick={onEdit}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
      title="Configurações de idioma e cultura"
    >
      <span>{lang?.flag}</span>
      <span>{context.language_code}</span>
      <span className="text-border">|</span>
      <span>{context.cultural_region === "auto" ? "Auto" : context.cultural_region}</span>
      <span className="text-border">|</span>
      <span>{tone?.icon} {tone?.label}</span>
      {onEdit && <span className="text-primary">✏️</span>}
    </button>
  );
}
