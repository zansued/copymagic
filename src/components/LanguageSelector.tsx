import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "motion/react";
import {
  type GenerationContext,
  LANGUAGES,
  REGIONS,
  FORMALITY_OPTIONS,
} from "@/lib/lcm-types";

interface LanguageSelectorProps {
  value: GenerationContext;
  onChange: (ctx: GenerationContext) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const regions = REGIONS[value.language_code] || REGIONS["pt-BR"];
  const activeLang = LANGUAGES.find((l) => l.code === value.language_code);

  const handleLanguageChange = (lang: string) => {
    onChange({
      ...value,
      language_code: lang,
      cultural_region: "auto",
    });
  };

  return (
    <div className="relative rounded-xl border border-border bg-card/60 backdrop-blur-md overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-xl">
            🌍
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground font-[Space_Grotesk]">
              Idioma & Cultura
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure o idioma, região e tom do conteúdo gerado
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-6 space-y-6">
        {/* ── Language Selection ── */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Idioma do conteúdo
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {LANGUAGES.map((l) => {
              const isActive = value.language_code === l.code;
              return (
                <motion.button
                  key={l.code}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200
                    ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_-4px_hsl(var(--glow)/0.3)]"
                        : "border-border/50 bg-card/40 hover:border-muted-foreground/30 hover:bg-card/80"
                    }
                  `}
                >
                  <span className="text-3xl">{l.flag}</span>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {l.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="lang-indicator"
                      className="absolute -bottom-px left-1/4 right-1/4 h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Region ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={value.language_code}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Região cultural
            </Label>
            <div className="flex gap-2 flex-wrap">
              {regions.map((r) => {
                const isActive = value.cultural_region === r.code;
                return (
                  <motion.button
                    key={r.code}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      onChange({ ...value, cultural_region: r.code })
                    }
                    className={`
                      px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? "border-primary bg-primary/10 text-foreground shadow-[0_0_12px_-4px_hsl(var(--glow)/0.25)]"
                          : "border-border/50 bg-card/40 text-muted-foreground hover:border-muted-foreground/30 hover:bg-card/80"
                      }
                    `}
                  >
                    {r.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Formality ── */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Formalidade
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {FORMALITY_OPTIONS.map((f) => {
              const isActive = value.tone_formality === f.value;
              return (
                <motion.button
                  key={f.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    onChange({ ...value, tone_formality: f.value })
                  }
                  className={`
                    relative flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200
                    ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_-4px_hsl(var(--glow)/0.3)]"
                        : "border-border/50 bg-card/40 hover:border-muted-foreground/30 hover:bg-card/80"
                    }
                  `}
                >
                  <span className="text-xl">{f.icon}</span>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {f.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Avoid real names ── */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 p-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <Label className="text-sm font-medium text-foreground cursor-pointer">
                Nomes fictícios
              </Label>
              <p className="text-xs text-muted-foreground">
                Não usar nomes de pessoas reais no conteúdo
              </p>
            </div>
          </div>
          <Switch
            checked={value.avoid_real_names}
            onCheckedChange={(checked) =>
              onChange({ ...value, avoid_real_names: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
