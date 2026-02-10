import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Provider } from "@/hooks/use-copywriter";

interface ProductInputFormProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  provider: Provider;
  onProviderChange: (p: Provider) => void;
}

const PLACEHOLDER = `The product [NOME DO PRODUTO] is for people who [PÚBLICO-ALVO] suffer from [DOR PRINCIPAL], solves it through [SOLUÇÃO], works as [COMO FUNCIONA], and stands out for [DIFERENCIAL ÚNICO].

Exemplo:
The product "Método Fênix" is for people who "empreendedores digitais iniciantes" suffer from "não conseguir vender online mesmo depois de vários cursos", solves it through "um sistema de funil validado em 47 nichos", works as "treinamento em vídeo + templates + mentoria semanal", and stands out for "garantia de primeira venda em 21 dias ou dinheiro de volta".`;

const PROVIDERS: { id: Provider; label: string; icon: string }[] = [
  { id: "deepseek", label: "DeepSeek", icon: "🧠" },
  { id: "openai", label: "OpenAI GPT-4o", icon: "🤖" },
];

export function ProductInputForm({ value, onChange, onSubmit, isGenerating, provider, onProviderChange }: ProductInputFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Descreva seu Produto</h2>
        <p className="text-sm text-muted-foreground">
          Use o formato abaixo para o sistema gerar todos os ativos de marketing.
        </p>
      </div>

      {/* Provider selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Modelo de IA</label>
        <div className="flex gap-2">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => onProviderChange(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                provider === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              <span>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        className="min-h-[200px] font-mono text-sm"
      />
      <div className="flex gap-3">
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || isGenerating}
          size="lg"
          className="flex-1"
        >
          🚀 Gerar Etapa por Etapa
        </Button>
      </div>
    </div>
  );
}
