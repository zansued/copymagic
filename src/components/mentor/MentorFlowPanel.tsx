import { useState } from "react";
import { CheckCircle2, Circle, Play, ChevronDown, ChevronUp, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENTS, AGENT_CATEGORIES } from "@/lib/agents";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface FlowStep {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  step_order: number;
  output?: string | null;
}

export interface Flow {
  id: string;
  title: string;
  goal: string;
  status: "active" | "completed" | "archived";
  steps: FlowStep[];
}

interface MentorFlowPanelProps {
  flows: Flow[];
  onExecuteStep: (flowId: string, stepId: string) => void;
  activeStepId: string | null;
}

/* ── Animated Emoji Icon ── */
function AnimatedStepIcon({
  emoji,
  status,
  isActive,
  isHovered,
}: {
  emoji: string;
  status: FlowStep["status"];
  isActive: boolean;
  isHovered: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-xl text-base shrink-0 select-none",
        status === "completed"
          ? "bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          : isActive
          ? "bg-primary/15 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
          : "bg-secondary/40"
      )}
      animate={{
        scale: isHovered ? 1.15 : 1,
        rotate: isHovered ? [0, -8, 8, -4, 0] : 0,
      }}
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 15 },
        rotate: { duration: 0.5, ease: "easeInOut" },
      }}
    >
      <span className="relative z-10">{emoji}</span>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-primary/40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
      {status === "completed" && (
        <motion.div
          className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <CheckCircle2 className="h-3 w-3 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Category color helper ── */
function getCategoryGradient(agentId: string): string {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) return "from-primary/20 to-accent/20";
  const cat = AGENT_CATEGORIES.find((c) => c.id === agent.category);
  return cat?.color || "from-primary/20 to-accent/20";
}

export default function MentorFlowPanel({ flows, onExecuteStep, activeStepId }: MentorFlowPanelProps) {
  const [expandedFlow, setExpandedFlow] = useState<string | null>(flows[0]?.id || null);

  if (flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Zap className="h-6 w-6 text-primary/40" />
        </motion.div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground/60">Seus Fluxos</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Os planos de ação aparecerão aqui quando o Mentor criar um para você.
          </p>
        </div>
      </div>
    );
  }

  const getAgent = (agentId: string) => AGENTS.find((a) => a.id === agentId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Seus Fluxos
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {flows.map((flow) => {
          const completed = flow.steps.filter((s) => s.status === "completed").length;
          const total = flow.steps.length;
          const isExpanded = expandedFlow === flow.id;
          const progress = (completed / total) * 100;

          return (
            <div key={flow.id} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <button
                onClick={() => setExpandedFlow(isExpanded ? null : flow.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors"
              >
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{flow.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      {completed}/{total}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-1">
                      {flow.steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step, idx) => (
                          <StepCard
                            key={step.id}
                            step={step}
                            index={idx}
                            flowId={flow.id}
                            isActive={activeStepId === step.id}
                            onExecute={onExecuteStep}
                          />
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step Card ── */
function StepCard({
  step,
  index,
  flowId,
  isActive,
  onExecute,
}: {
  step: FlowStep;
  index: number;
  flowId: string;
  isActive: boolean;
  onExecute: (flowId: string, stepId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const agent = AGENTS.find((a) => a.id === step.agent_id);
  const emoji = agent?.emoji || "⚡";
  const gradient = getCategoryGradient(step.agent_id);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      {/* Hover glow background */}
      <AnimatePresence>
        {isHovered && step.status !== "completed" && (
          <motion.div
            className={cn("absolute inset-0 rounded-xl bg-gradient-to-r opacity-[0.06]", gradient)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.06, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative p-3 rounded-xl transition-all duration-200 border",
          isActive
            ? "bg-primary/8 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
            : step.status === "completed"
            ? "bg-emerald-500/5 border-emerald-500/15"
            : "bg-background/30 border-transparent hover:border-border/40"
        )}
      >
        <div className="flex items-start gap-3">
          <AnimatedStepIcon
            emoji={emoji}
            status={step.status}
            isActive={isActive}
            isHovered={isHovered}
          />

          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-xs font-semibold text-foreground truncate">{step.title}</p>
            </div>

            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {step.description}
            </p>

            {/* Agent tag */}
            {agent && (
              <motion.span
                className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md bg-secondary/40 text-[10px] text-muted-foreground"
                animate={{ opacity: isHovered ? 1 : 0.7 }}
              >
                {agent.name}
              </motion.span>
            )}

            {/* Action buttons */}
            {step.status !== "completed" && !isActive && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: isHovered ? 1 : 0.6, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 text-[11px] gap-1.5 text-primary hover:text-primary hover:bg-primary/10 px-2.5 rounded-lg"
                  onClick={() => onExecute(flowId, step.id)}
                >
                  <Play className="h-3 w-3" />
                  Executar
                </Button>
              </motion.div>
            )}

            {isActive && (
              <div className="mt-2 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[10px] text-primary font-medium">Processando...</span>
              </div>
            )}

            {step.status === "completed" && (
              <motion.p
                className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CheckCircle2 className="h-3 w-3" /> Concluído
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
