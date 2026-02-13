import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Play, ArrowRight, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
  const navigate = useNavigate();

  if (flows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
        <span className="text-5xl opacity-30">🗺️</span>
        <p className="text-sm text-muted-foreground">
          Seus fluxos aparecerão aqui quando o Mentor criar um plano para você.
        </p>
      </div>
    );
  }

  const getAgent = (agentId: string) => AGENTS.find((a) => a.id === agentId);

  const statusIcon = (status: FlowStep["status"], stepId: string) => {
    if (activeStepId === stepId) return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "in_progress": return <Play className="h-4 w-4 text-primary" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-3 p-4 overflow-y-auto h-full">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        🗺️ Seus Fluxos
      </h3>

      {flows.map((flow) => {
        const completed = flow.steps.filter((s) => s.status === "completed").length;
        const total = flow.steps.length;
        const isExpanded = expandedFlow === flow.id;

        return (
          <div key={flow.id} className="premium-card overflow-hidden">
            <button
              onClick={() => setExpandedFlow(isExpanded ? null : flow.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{flow.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completed}/{total} etapas completas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent-foreground transition-all"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
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
                  <div className="px-4 pb-4 space-y-2">
                    {flow.steps
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step, idx) => {
                        const agent = getAgent(step.agent_id);
                        const isActive = activeStepId === step.id;

                        return (
                          <div
                            key={step.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              isActive
                                ? "border-primary/50 bg-primary/5"
                                : step.status === "completed"
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-border bg-background/50"
                            }`}
                          >
                            <div className="mt-0.5">{statusIcon(step.status, step.id)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                                {agent && <span className="text-sm">{agent.emoji}</span>}
                                <p className="text-sm font-medium text-foreground truncate">{step.title}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{step.description}</p>
                              {step.status !== "completed" && !isActive && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2 h-7 text-xs gap-1 text-primary hover:text-primary"
                                  onClick={() => onExecuteStep(flow.id, step.id)}
                                >
                                  <Play className="h-3 w-3" /> Executar com {agent?.name || step.agent_id}
                                </Button>
                              )}
                              {step.status === "completed" && step.output && (
                                <p className="text-xs text-emerald-400 mt-1">✓ Concluído</p>
                              )}
                            </div>
                          </div>
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
  );
}
