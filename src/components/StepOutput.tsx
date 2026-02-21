import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlowButton } from "@/components/ui/glow-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CopyScoreCard } from "@/components/agent/CopyScoreCard";
import { STEPS } from "@/lib/steps";

interface StepOutputProps {
  currentStepIndex: number;
  results: Record<string, string>;
  streamingText: string;
  isGenerating: boolean;
  onGenerate: (index: number, continueFrom?: string) => void;
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const step = STEPS[currentStepIndex];
  if (!step) return null;

  const allCompleted = STEPS.every(s => results[s.id]);

  const content = isGenerating ? streamingText : results[step.id] || "";
  const hasContent = content.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleExportPdf = () => {
    const md = content;
    // Simple markdown → HTML
    const html = md
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
      .replace(/\n{2,}/g, "<br/><br/>")
      .replace(/\n/g, "<br/>");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${step.icon} ${step.label}</title>
      <style>
        @media print { body { background:#fff!important; color:#000!important; } }
        body { font-family: Georgia, 'Times New Roman', serif; padding:40px 50px; line-height:1.8; color:#000; background:#fff; max-width:800px; margin:0 auto; }
        h1 { font-size:22px; margin-bottom:4px; } h2 { font-size:18px; margin-top:24px; } h3 { font-size:16px; margin-top:18px; }
        ul { padding-left:20px; } li { margin-bottom:4px; }
        .header { border-bottom:2px solid #333; padding-bottom:12px; margin-bottom:24px; }
        .meta { font-size:12px; color:#666; }
      </style></head><body>
      <div class="header"><h1>${step.icon} ${step.label}</h1><p class="meta">🤖 ${step.agent} — ${step.description}</p></div>
      ${html}
    </body></html>`);
    win.document.close();
    win.onload = () => setTimeout(() => win.print(), 400);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {step.icon} {step.label}
          </h2>
          <p className="text-sm text-muted-foreground">
            🤖 <span className="font-medium">{step.agent}</span> — {step.description}
          </p>
        </div>
        <div className="flex gap-2">
          {hasContent && !isGenerating && (
            <>
              <CopyScoreCard copy={content} agentName={step.agent} />
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                📄 PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                📋 Copiar
              </Button>
              <GlowButton glowColor="#38bdf8" className="h-9 px-3 text-sm" onClick={() => onGenerate(currentStepIndex, content)}>
                ▶️ Continuar
              </GlowButton>
            </>
          )}
          {isGenerating ? (
            <GlowButton glowColor="#ef4444" className="h-9 px-3 text-sm" onClick={onStop}>
              ⏹ Parar
            </GlowButton>
          ) : (
            <GlowButton glowColor="#a78bfa" className="h-9 px-3 text-sm" onClick={() => onGenerate(currentStepIndex)}>
              {results[step.id] ? "🔄 Regenerar" : "▶️ Gerar"}
            </GlowButton>
          )}
        </div>
      </div>

      <div className="relative flex-1 rounded-lg">
        <GlowingEffect
          blur={8}
          borderWidth={2}
          spread={30}
          proximity={100}
          inactiveZone={0.4}
          disabled={false}
        />
        <ScrollArea className="h-full rounded-lg border bg-card p-6">
          {hasContent ? (
            <div className="prose-premium max-w-none">
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
      </div>

      {!isGenerating && results[step.id] && currentStepIndex < STEPS.length - 1 && (
        <div className="mt-4 flex justify-end">
          <GlowButton glowColor="#34d399" onClick={() => onGenerate(currentStepIndex + 1)}>
            Próxima Etapa: {STEPS[currentStepIndex + 1].icon} {STEPS[currentStepIndex + 1].label} →
          </GlowButton>
        </div>
      )}

      {!isGenerating && allCompleted && currentStepIndex === STEPS.length - 1 && (
        <div className="mt-4 flex justify-center gap-4">
          <GlowButton glowColor="#facc15" className="px-6 py-3 text-base" onClick={() => navigate(`/project/${id}/summary`)}>
            📊 Ver Resumo Completo →
          </GlowButton>
          <GlowButton glowColor="#8b5cf6" className="px-6 py-3 text-base" onClick={() => navigate(`/project/${id}/campaign`)}>
            🚀 Planejamento de Campanha →
          </GlowButton>
        </div>
      )}
    </div>
  );
}
