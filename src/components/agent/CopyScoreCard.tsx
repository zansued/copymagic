import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart3, Loader2, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CopyScore {
  clarity: number;
  persuasion: number;
  cta: number;
  structure: number;
  originality: number;
  overall: number;
  suggestions: string[];
}

const CRITERIA = [
  { key: "clarity", label: "Clareza", emoji: "💬" },
  { key: "persuasion", label: "Persuasão", emoji: "🧠" },
  { key: "cta", label: "CTA", emoji: "🎯" },
  { key: "structure", label: "Estrutura", emoji: "📐" },
  { key: "originality", label: "Originalidade", emoji: "✨" },
] as const;

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-amber-400";
  return "text-destructive";
}

function getProgressColor(score: number) {
  if (score >= 80) return "[&>div]:bg-primary";
  if (score >= 60) return "[&>div]:bg-amber-400";
  return "[&>div]:bg-destructive";
}

function getOverallLabel(score: number) {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Muito bom";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Precisa melhorar";
  return "Fraco";
}

interface CopyScoreCardProps {
  copy: string;
  agentName?: string;
}

export function CopyScoreCard({ copy, agentName }: CopyScoreCardProps) {
  const [score, setScore] = useState<CopyScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleScore = async () => {
    if (!copy || copy.length < 50) {
      toast.error("Copy muito curta para avaliar");
      return;
    }

    setLoading(true);
    setScore(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-copy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ copy: copy.slice(0, 6000), agent_name: agentName }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      const data = await resp.json();
      setScore(data);
      setExpanded(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao avaliar copy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Trigger button */}
      {!score && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleScore}
          disabled={loading || !copy || copy.length < 50}
          className="gap-2 text-xs"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BarChart3 className="h-3.5 w-3.5" />
          )}
          {loading ? "Avaliando..." : "Score de Copy"}
        </Button>
      )}

      {/* Score card */}
      <AnimatePresence>
        {score && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="premium-card p-4 space-y-3"
          >
            {/* Header with overall score */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${getScoreColor(score.overall)}`}>
                  {score.overall}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Score de Copy</p>
                  <p className={`text-xs font-medium ${getScoreColor(score.overall)}`}>
                    {getOverallLabel(score.overall)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScore();
                  }}
                  className="text-xs gap-1 h-7"
                >
                  <BarChart3 className="h-3 w-3" />
                  Reavaliar
                </Button>
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="space-y-3"
              >
                {/* Criteria bars */}
                <div className="grid grid-cols-1 gap-2">
                  {CRITERIA.map(({ key, label, emoji }) => {
                    const val = score[key as keyof CopyScore] as number;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm w-6 text-center">{emoji}</span>
                        <span className="text-xs text-muted-foreground w-24">{label}</span>
                        <Progress
                          value={val}
                          className={`flex-1 h-2 bg-muted ${getProgressColor(val)}`}
                        />
                        <span className={`text-xs font-semibold w-8 text-right ${getScoreColor(val)}`}>
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Suggestions */}
                {score.suggestions?.length > 0 && (
                  <div className="pt-2 border-t border-border/30 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      Sugestões de melhoria
                    </p>
                    {score.suggestions.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground pl-5">
                        • {s}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
