import { STEPS } from "@/lib/steps";
import { cn } from "@/lib/utils";

interface StepSidebarProps {
  currentStepIndex: number;
  results: Record<string, string>;
  isGenerating: boolean;
  onSelectStep: (index: number) => void;
}

const STEP_GLOW_COLORS = [
  "#a78bfa", // avatar - purple
  "#facc15", // usp - yellow
  "#fb923c", // oferta - orange
  "#38bdf8", // pagina_vendas - sky
  "#f87171", // upsells - red
  "#e879f9", // pagina_upsell - fuchsia
  "#34d399", // anuncios - emerald
  "#f472b6", // vsl_upsell - pink
  "#60a5fa", // vsl_longa - blue
];

function hexToRgba(hex: string, alpha: number = 1): string {
  let v = hex.replace("#", "");
  if (v.length === 3) v = v.split("").map(c => c + c).join("");
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function StepSidebar({ currentStepIndex, results, isGenerating, onSelectStep }: StepSidebarProps) {
  return (
    <nav className="space-y-1">
      {STEPS.map((step, i) => {
        const isCompleted = !!results[step.id];
        const isCurrent = i === currentStepIndex;
        const isClickable = isCompleted || (!isGenerating && i <= currentStepIndex + 1);
        const glowColor = STEP_GLOW_COLORS[i] || "#a78bfa";

        return (
          <button
            key={step.id}
            onClick={() => isClickable && onSelectStep(i)}
            disabled={!isClickable}
            style={{
              "--glow-color": hexToRgba(glowColor),
              "--glow-color-via": hexToRgba(glowColor, 0.075),
              "--glow-color-to": hexToRgba(glowColor, 0.2),
            } as React.CSSProperties}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm relative overflow-hidden transition-all duration-200",
              "border border-border bg-gradient-to-t from-background to-muted",
              "after:inset-0 after:absolute after:rounded-[inherit] after:bg-gradient-to-r after:from-transparent after:from-40% after:via-[var(--glow-color-via)] after:to-[var(--glow-color-to)] after:via-70%",
              "before:absolute before:w-[4px] hover:before:translate-x-full before:transition-all before:duration-200 before:h-[50%] before:bg-[var(--glow-color)] before:right-0 before:rounded-l before:shadow-[-2px_0_8px_var(--glow-color)]",
              isCurrent && "border-[var(--glow-color)] shadow-[0_0_12px_var(--glow-color-via)]",
              !isClickable && "opacity-40 cursor-not-allowed",
              isClickable && "hover:text-muted-foreground"
            )}
          >
            <span className="text-lg relative z-30">{isCompleted ? "✅" : step.icon}</span>
            <span className="font-medium truncate relative z-30 text-foreground">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
