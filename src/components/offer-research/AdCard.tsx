import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, Image, Layers, Megaphone, Calendar, MousePointerClick, Clock, TrendingUp } from "lucide-react";

export interface AdData {
  anunciante: string;
  texto_anuncio: string;
  plataforma: string;
  status?: string;
  data_inicio?: string;
  cta?: string;
  url_destino?: string;
  url_anuncio?: string;
  tipo_midia?: string;
  gancho?: string;
  exemplo?: boolean;
  dias_ativo?: number;
  sinais_escala?: string[];
}

const mediaIcon = (tipo?: string) => {
  if (!tipo) return <Image className="h-3.5 w-3.5" />;
  const t = tipo.toLowerCase();
  if (t.includes("vídeo") || t.includes("video")) return <Play className="h-3.5 w-3.5" />;
  if (t.includes("carrossel") || t.includes("carousel")) return <Layers className="h-3.5 w-3.5" />;
  return <Image className="h-3.5 w-3.5" />;
};

const platformColor = (plataforma?: string) => {
  const p = (plataforma || "").toLowerCase();
  if (p.includes("instagram")) return "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30";
  if (p.includes("facebook")) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  return "bg-secondary text-secondary-foreground";
};

export function AdCard({ ad }: { ad: AdData }) {
  const sanitize = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{sanitize(ad.anunciante)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge className={`text-[10px] px-1.5 py-0 ${platformColor(ad.plataforma)}`}>
                {ad.plataforma}
              </Badge>
              {ad.tipo_midia && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                  {mediaIcon(ad.tipo_midia)}
                  {ad.tipo_midia}
                </Badge>
              )}
              {ad.exemplo && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                  Exemplo
                </Badge>
              )}
            </div>
          </div>
        </div>
        {ad.status && (
          <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
            {ad.status}
          </Badge>
        )}
      </div>

      {/* Longevidade */}
      {ad.dias_ativo != null && ad.dias_ativo > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            ad.dias_ativo >= 30 ? "bg-primary/15 text-primary border border-primary/20" :
            ad.dias_ativo >= 14 ? "bg-accent/15 text-accent-foreground border border-accent/20" :
            "bg-muted text-muted-foreground border border-border"
          }`}>
            <Clock className="h-3 w-3" />
            {ad.dias_ativo} {ad.dias_ativo === 1 ? "dia ativo" : "dias ativo"}
          </div>
          {ad.dias_ativo >= 14 && (
            <span className="text-[10px] text-primary font-medium">🔥 Escala validada</span>
          )}
        </div>
      )}

      {/* Sinais de Escala */}
      {ad.sinais_escala && ad.sinais_escala.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <TrendingUp className="h-3 w-3 text-muted-foreground shrink-0" />
          {ad.sinais_escala.map((sinal, i) => (
            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary/80">
              {sinal}
            </Badge>
          ))}
        </div>
      )}

      {/* Gancho */}
      {ad.gancho && (
        <div className="p-2.5 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 mb-3">
          <p className="text-xs text-muted-foreground mb-0.5">Gancho:</p>
          <p className="text-sm font-medium text-foreground italic">"{sanitize(ad.gancho)}"</p>
        </div>
      )}

      {/* Texto do anúncio */}
      <p className="text-sm text-foreground/80 line-clamp-3 mb-3">{sanitize(ad.texto_anuncio)}</p>

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {ad.data_inicio && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {sanitize(ad.data_inicio)}
          </span>
        )}
        {ad.cta && (
          <span className="flex items-center gap-1">
            <MousePointerClick className="h-3 w-3" />
            {sanitize(ad.cta)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {ad.url_destino && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 flex-1"
            asChild
          >
            <a href={ad.url_destino} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              Página de Vendas
            </a>
          </Button>
        )}
        {ad.url_anuncio && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 flex-1"
            asChild
          >
            <a href={ad.url_anuncio} target="_blank" rel="noopener noreferrer">
              <Megaphone className="h-3 w-3" />
              Ver Anúncio
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
