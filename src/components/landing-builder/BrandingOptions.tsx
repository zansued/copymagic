import { Palette, ToggleLeft, ToggleRight } from "lucide-react";

interface BrandingOptionsProps {
  includeUpsells: boolean;
  onToggleUpsells: (v: boolean) => void;
  brandingTitle: string;
  onTitleChange: (v: string) => void;
  brandingLogo: string;
  onLogoChange: (v: string) => void;
  brandingColor: string;
  onColorChange: (v: string) => void;
}

export function BrandingOptions({
  includeUpsells, onToggleUpsells,
  brandingTitle, onTitleChange,
  brandingLogo, onLogoChange,
  brandingColor, onColorChange,
}: BrandingOptionsProps) {
  return (
    <div className="premium-card p-5 space-y-4">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
        Opções
      </label>

      <button
        onClick={() => onToggleUpsells(!includeUpsells)}
        className="flex items-center justify-between w-full py-2"
      >
        <span className="text-sm text-foreground/80">Incluir seções de Upsell</span>
        {includeUpsells ? (
          <ToggleRight className="h-5 w-5 text-primary" />
        ) : (
          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="space-y-3 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Branding (opcional)</span>
        <input
          type="text"
          value={brandingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Título do site"
          className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="text"
          value={brandingLogo}
          onChange={(e) => onLogoChange(e.target.value)}
          placeholder="URL do logo (opcional)"
          className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Cor primária</span>
          <input
            type="color"
            value={brandingColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-7 w-10 rounded cursor-pointer border-0"
          />
          <span className="text-xs text-muted-foreground font-mono">{brandingColor}</span>
        </div>
      </div>
    </div>
  );
}
