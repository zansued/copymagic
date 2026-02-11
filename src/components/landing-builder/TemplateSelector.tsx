import { motion } from "motion/react";
import { Sparkles, PlayCircle, FileText, ArrowUpCircle } from "lucide-react";

const TEMPLATES = [
  {
    key: "saas-premium",
    label: "SaaS Premium",
    icon: Sparkles,
    description: "Hero + features + proof + pricing + FAQ",
    preview: "linear-gradient(135deg, #0b0d12, #141728)",
  },
  {
    key: "vsl-page",
    label: "VSL Page",
    icon: PlayCircle,
    description: "Hero com vídeo + bullets + prova + CTA sticky",
    preview: "linear-gradient(135deg, #0a0a0f, #12121f)",
  },
  {
    key: "longform-dr",
    label: "Longform DR",
    icon: FileText,
    description: "Headline forte + story + mecanismo + oferta",
    preview: "linear-gradient(135deg, #fafaf8, #f0efe8)",
  },
  {
    key: "upsell-focus",
    label: "Upsell Focus",
    icon: ArrowUpCircle,
    description: "Comparativo + bônus + urgência + garantia",
    preview: "linear-gradient(135deg, #0d0f14, #1a1040)",
  },
];

interface TemplateSelectorProps {
  selected: string;
  onSelect: (key: string) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="premium-card p-5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
        Template
      </label>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const isActive = selected === t.key;
          return (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(t.key)}
              className={`relative rounded-xl p-3 text-left transition-all border ${
                isActive
                  ? "border-primary/50 ring-2 ring-primary/20 bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div
                className="h-16 rounded-lg mb-2"
                style={{ background: t.preview }}
              />
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium">{t.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                {t.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
