import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

  const handleLanguageChange = (lang: string) => {
    onChange({
      ...value,
      language_code: lang,
      cultural_region: "auto",
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        🌍 Idioma & Cultura
      </h3>

      {/* Language */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Idioma do conteúdo</Label>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => handleLanguageChange(l.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                value.language_code === l.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Region */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Região cultural</Label>
        <div className="flex gap-2 flex-wrap">
          {regions.map((r) => (
            <button
              key={r.code}
              onClick={() => onChange({ ...value, cultural_region: r.code })}
              className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                value.cultural_region === r.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formality */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Formalidade</Label>
        <div className="flex gap-2">
          {FORMALITY_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ ...value, tone_formality: f.value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
                value.tone_formality === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Avoid real names */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.avoid_real_names}
          onCheckedChange={(checked) =>
            onChange({ ...value, avoid_real_names: checked })
          }
        />
        <Label className="text-sm text-muted-foreground cursor-pointer">
          Não usar nomes de pessoas reais
        </Label>
      </div>
    </div>
  );
}
