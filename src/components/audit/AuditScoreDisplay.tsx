import { Progress } from "@/components/ui/progress";
import type { AuditScore } from "@/lib/audit-types";

const DIMENSIONS = [
  { key: "clarity", label: "Clareza", emoji: "💬" },
  { key: "specificity", label: "Especificidade", emoji: "🎯" },
  { key: "dna_consistency", label: "Consistência DNA", emoji: "🧬" },
  { key: "offer", label: "Oferta", emoji: "📦" },
  { key: "claims_risk", label: "Risco de Claims", emoji: "⚠️" },
  { key: "cta", label: "CTA", emoji: "🔥" },
] as const;

function getColor(val: number) {
  if (val >= 8) return "text-primary";
  if (val >= 6) return "text-amber-400";
  return "text-destructive";
}

function getBarColor(val: number) {
  if (val >= 8) return "[&>div]:bg-primary";
  if (val >= 6) return "[&>div]:bg-amber-400";
  return "[&>div]:bg-destructive";
}

interface Props {
  score: AuditScore;
}

export function AuditScoreDisplay({ score }: Props) {
  return (
    <div className="space-y-3">
      {/* Overall */}
      <div className="flex items-center gap-3">
        <div className={`text-4xl font-bold ${getColor(score.overall)}`}>
          {score.overall.toFixed(1)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Score Geral</p>
          <p className={`text-xs ${getColor(score.overall)}`}>
            {score.overall >= 8 ? "Excelente" : score.overall >= 6 ? "Bom" : "Precisa melhorar"}
          </p>
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-1 gap-2">
        {DIMENSIONS.map(({ key, label, emoji }) => {
          const val = score[key as keyof AuditScore] as number;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm w-6 text-center">{emoji}</span>
              <span className="text-xs text-muted-foreground w-32">{label}</span>
              <Progress
                value={val * 10}
                className={`flex-1 h-2 bg-muted ${getBarColor(val)}`}
              />
              <span className={`text-xs font-semibold w-8 text-right ${getColor(val)}`}>
                {val.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
