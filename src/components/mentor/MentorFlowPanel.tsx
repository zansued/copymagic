import { useState } from "react";
import { CheckCircle2, Circle, Play, ChevronDown, ChevronUp, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENTS } from "@/lib/agents";
import { motion, AnimatePresence } from "motion/react";

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

export default function MentorFlowPanel({ flows, onExecuteStep, activeStepId }: MentorFlowPanelProps) {
  const [expandedFlow, setExpandedFlow] = useState<string | null>(flows[0]?.id || null);

  if (flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary/40" />
        </div>
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

  const statusIcon = (status: FlowStep["status"], stepId: string) => {
    if (activeStepId === stepId) return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "in_progress": return <Play className="h-4 w-4 text-primary" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground/40" />;
    }
  };

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
                    <div className="px-3 pb-3 space-y-1.5">
                      {flow.steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step, idx) => {
                          const agent = getAgent(step.agent_id);
                          const isActive = activeStepId === step.id;

                          return (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`relative p-3 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? "bg-primary/8 border border-primary/30"
                                  : step.status === "completed"
                                  ? "bg-emerald-500/5 border border-emerald-500/15"
                                  : "bg-background/30 border border-transparent hover:border-border/50 hover:bg-secondary/20"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5">{statusIcon(step.status, step.id)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                                    <p className="text-xs font-medium text-foreground truncate">{step.title}</p>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                    {step.description}
                                  </p>
                                  {step.status !== "completed" && !isActive && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="mt-1.5 h-6 text-[10px] gap-1 text-primary hover:text-primary px-2"
                                      onClick={() => onExecuteStep(flow.id, step.id)}
                                    >
                                      <Play className="h-2.5 w-2.5" /> Executar com {agent?.name || step.agent_id}
                                    </Button>
                                  )}
                                  {step.status === "completed" && (
                                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Concluído
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
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
