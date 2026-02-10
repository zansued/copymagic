import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { STEPS } from "@/lib/steps";

interface StepOutputProps {
  currentStepIndex: number;
  results: Record<string, string>;
  streamingText: string;
  isGenerating: boolean;
  onGenerate: (index: number) => void;
  onStop: () => void;
}

export function StepOutput({
  currentStepIndex,
  results,
  streamingText,
  isGenerating,
  onGenerate,
  onStop,
}: StepOutputProps) {
  const step = STEPS[currentStepIndex];
  if (!step) return null;

  const content = isGenerating ? streamingText : results[step.id] || "";
  const hasContent = content.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {step.icon} {step.label}
          </h2>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
        <div className="flex gap-2">
          {hasContent && !isGenerating && (
            <Button variant="outline" size="sm" onClick={handleCopy}>
              📋 Copiar
            </Button>
          )}
          {isGenerating ? (
            <Button variant="destructive" size="sm" onClick={onStop}>
              ⏹ Parar
            </Button>
          ) : (
            <Button size="sm" onClick={() => onGenerate(currentStepIndex)}>
              {results[step.id] ? "🔄 Regenerar" : "▶️ Gerar"}
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 rounded-lg border bg-card p-6">
        {hasContent ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Clique em "Gerar" para criar o conteúdo desta etapa.</p>
          </div>
        )}
        {isGenerating && (
          <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
        )}
      </ScrollArea>

      {!isGenerating && results[step.id] && currentStepIndex < STEPS.length - 1 && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => onGenerate(currentStepIndex + 1)}>
            Próxima Etapa: {STEPS[currentStepIndex + 1].icon} {STEPS[currentStepIndex + 1].label} →
          </Button>
        </div>
      )}
    </div>
  );
}
