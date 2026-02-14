import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  /** CSS selector for the target element */
  target: string;
  /** Title of the tooltip */
  title: string;
  /** Description */
  description: string;
  /** Position relative to target */
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  storageKey: string;
  onComplete?: () => void;
}

export function OnboardingTour({ steps, storageKey, onComplete }: OnboardingTourProps) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if user already completed the tour
  useEffect(() => {
    const done = localStorage.getItem(storageKey);
    if (!done) {
      // Small delay so the page renders first
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let pos = step.position || "bottom";
    const gap = 14;
    const pad = 16;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Measure real tooltip dimensions (fallback to estimates on first render)
    const tooltipEl = tooltipRef.current;
    const tooltipW = tooltipEl ? tooltipEl.offsetWidth : 340;
    const tooltipH = tooltipEl ? tooltipEl.offsetHeight : 200;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Auto-flip if not enough space
    if (pos === "bottom" && rect.bottom + gap + tooltipH > vh - pad) pos = "top";
    else if (pos === "top" && rect.top - gap - tooltipH < pad) pos = "bottom";
    else if (pos === "right" && rect.right + gap + tooltipW > vw - pad) pos = "left";
    else if (pos === "left" && rect.left - gap - tooltipW < pad) pos = "right";

    const style: React.CSSProperties = { position: "fixed", zIndex: 10001 };
    const arrow: React.CSSProperties = { position: "absolute" };

    if (pos === "bottom") {
      style.top = rect.bottom + gap;
      style.left = rect.left + rect.width / 2 - tooltipW / 2;
      arrow.top = -6;
      arrow.left = "50%";
      arrow.transform = "translateX(-50%) rotate(45deg)";
    } else if (pos === "top") {
      style.top = rect.top - tooltipH - gap;
      style.left = rect.left + rect.width / 2 - tooltipW / 2;
      arrow.bottom = -6;
      arrow.left = "50%";
      arrow.transform = "translateX(-50%) rotate(45deg)";
    } else if (pos === "right") {
      style.top = rect.top + rect.height / 2 - tooltipH / 2;
      style.left = rect.right + gap;
      arrow.left = -6;
      arrow.top = "50%";
      arrow.transform = "translateY(-50%) rotate(45deg)";
    } else if (pos === "left") {
      style.top = rect.top + rect.height / 2 - tooltipH / 2;
      style.left = rect.left - tooltipW - gap;
      arrow.right = -6;
      arrow.top = "50%";
      arrow.transform = "translateY(-50%) rotate(45deg)";
    }

    // Clamp to viewport
    style.top = Math.max(pad, Math.min(style.top as number, vh - tooltipH - pad));
    style.left = Math.max(pad, Math.min(style.left as number, vw - tooltipW - pad));

    setTooltipStyle(style);
    setArrowStyle(arrow);
  }, [currentStep, steps]);

  useEffect(() => {
    if (!active) return;
    positionTooltip();
    // Recalculate after render so real tooltip dimensions are used
    const raf = requestAnimationFrame(() => positionTooltip());
    const handler = () => positionTooltip();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [active, positionTooltip]);

  // Highlight current target
  useEffect(() => {
    if (!active) return;
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) return;

    el.style.position = "relative";
    el.style.zIndex = "10000";
    el.style.boxShadow = "0 0 0 4px hsl(262, 83%, 65%, 0.4), 0 0 30px hsl(262, 83%, 65%, 0.15)";
    el.style.borderRadius = "12px";
    el.style.transition = "box-shadow 0.3s ease";

    return () => {
      el.style.zIndex = "";
      el.style.boxShadow = "";
      el.style.position = "";
    };
  }, [active, currentStep, steps]);

  const finish = () => {
    localStorage.setItem(storageKey, "true");
    setActive(false);
    onComplete?.();
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!active) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-[2px]"
        onClick={finish}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          style={{ ...tooltipStyle, width: 340 }}
          className="z-[10001]"
        >
          <div className="relative rounded-xl border border-primary/20 bg-card shadow-[0_8px_40px_-8px_hsl(262,83%,65%,0.25)] p-5">
            {/* Arrow */}
            <div
              style={arrowStyle}
              className="w-3 h-3 bg-card border-l border-t border-primary/20"
            />

            {/* Close */}
            <button
              onClick={finish}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-5">
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} de {steps.length}
              </span>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={prev} className="gap-1 text-xs h-8">
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </Button>
                )}
                <Button size="sm" onClick={next} className="gap-1 text-xs h-8 bg-primary hover:bg-primary/90">
                  {currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? "w-4 bg-primary"
                      : i < currentStep
                      ? "w-1.5 bg-primary/50"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
