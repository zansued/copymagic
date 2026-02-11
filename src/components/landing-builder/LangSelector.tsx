import { motion, AnimatePresence } from "motion/react";
import { LANGUAGES, REGIONS } from "@/lib/lcm-types";

interface LangSelectorProps {
  language: string;
  region: string;
  onLanguageChange: (lang: string) => void;
  onRegionChange: (region: string) => void;
}

export function LangSelector({ language, region, onLanguageChange, onRegionChange }: LangSelectorProps) {
  const regions = REGIONS[language] || REGIONS["pt-BR"];

  return (
    <div className="premium-card p-5 space-y-4">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
        Idioma & Região
      </label>

      <div className="flex gap-2">
        {LANGUAGES.map((l) => {
          const isActive = language === l.code;
          return (
            <motion.button
              key={l.code}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { onLanguageChange(l.code); onRegionChange("auto"); }}
              className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                isActive
                  ? "border-primary bg-primary/10"
                  : "border-border/40 hover:border-muted-foreground/30"
              }`}
            >
              <span className="text-2xl">{l.flag}</span>
              <span className={`text-[11px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {l.code.split("-")[0].toUpperCase()}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={language}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex gap-2 flex-wrap"
        >
          {regions.map((r) => {
            const isActive = region === r.code;
            return (
              <button
                key={r.code}
                onClick={() => onRegionChange(r.code)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/50 text-muted-foreground hover:border-muted-foreground/30"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
