export interface GenerationContext {
  language_code: string;
  cultural_region: string;
  tone_formality: "casual" | "neutral" | "formal";
  avoid_real_names: boolean;
}

export const DEFAULT_GENERATION_CONTEXT: GenerationContext = {
  language_code: "pt-BR",
  cultural_region: "auto",
  tone_formality: "neutral",
  avoid_real_names: true,
};

export const LANGUAGES = [
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
] as const;

export const REGIONS: Record<string, { code: string; label: string }[]> = {
  "pt-BR": [
    { code: "auto", label: "Auto" },
    { code: "pt-BR", label: "Brasil" },
  ],
  es: [
    { code: "auto", label: "Auto" },
    { code: "es-ES", label: "Espanha" },
    { code: "es-MX", label: "México" },
    { code: "es-AR", label: "Argentina" },
    { code: "es-CO", label: "Colômbia" },
    { code: "es-CL", label: "Chile" },
  ],
  en: [
    { code: "auto", label: "Auto" },
    { code: "en-US", label: "Estados Unidos" },
    { code: "en-GB", label: "Reino Unido" },
    { code: "en-CA", label: "Canadá" },
    { code: "en-AU", label: "Austrália" },
  ],
};

export const FORMALITY_OPTIONS = [
  { value: "casual" as const, label: "Casual", icon: "😎" },
  { value: "neutral" as const, label: "Neutro", icon: "🤝" },
  { value: "formal" as const, label: "Formal", icon: "🎩" },
];
