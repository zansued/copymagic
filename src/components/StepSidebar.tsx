import { STEPS } from "@/lib/steps";
import { cn } from "@/lib/utils";

interface StepSidebarProps {
  currentStepIndex: number;
  results: Record<string, string>;
  isGenerating: boolean;
  onSelectStep: (index: number) => void;
}

export function StepSidebar({ currentStepIndex, results, isGenerating, onSelectStep }: StepSidebarProps) {
  return (
    <nav className="space-y-1">
      {STEPS.map((step, i) => {
        const isCompleted = !!results[step.id];
        const isCurrent = i === currentStepIndex;
        const isClickable = isCompleted || (!isGenerating && i <= currentStepIndex + 1);

        return (
          <button
            key={step.id}
            onClick={() => isClickable && onSelectStep(i)}
            disabled={!isClickable}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm",
              isCurrent && "bg-primary text-primary-foreground shadow-sm",
              !isCurrent && isCompleted && "bg-accent/50 text-accent-foreground hover:bg-accent",
              !isCurrent && !isCompleted && "text-muted-foreground",
              !isClickable && "opacity-40 cursor-not-allowed"
            )}
          >
            <span className="text-lg">{isCompleted ? "✅" : step.icon}</span>
            <span className="font-medium truncate">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
