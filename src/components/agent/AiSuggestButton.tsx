import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { profileToMarkdown } from "@/lib/brand-profile-types";
import { toast } from "@/hooks/use-toast";

interface AiSuggestButtonProps {
  inputLabel: string;
  inputPlaceholder: string;
  agentName: string;
  selectedProfileId: string;
  onSuggestion: (text: string) => void;
}

export function AiSuggestButton({ inputLabel, inputPlaceholder, agentName, selectedProfileId, onSuggestion }: AiSuggestButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    if (!selectedProfileId) {
      toast({ title: "Selecione um DNA de Campanha primeiro", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("id", selectedProfileId)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      const brandContext = profileToMarkdown(profile.name, {
        brand_identity: profile.brand_identity as any,
        brand_voice: profile.brand_voice as any,
        target_audience: profile.target_audience as any,
        product_service: profile.product_service as any,
        credentials: profile.credentials as any,
      });

      const systemPrompt = `Você é um assistente de preenchimento de formulários para o agente "${agentName}".
Com base no DNA de Marca abaixo, gere um preenchimento ideal para o campo "${inputLabel}".
Dica do campo: "${inputPlaceholder}"

Regras:
- Entregue APENAS o texto de preenchimento, sem explicações ou introduções
- Seja específico e use as informações reais do DNA
- O texto deve estar pronto para colar no campo diretamente
- Máximo de 500 palavras

--- DNA DE MARCA ---
${brandContext}`;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Login necessário");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ system_prompt: systemPrompt, provider: "deepseek" }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Stream não disponível");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) accumulated += c;
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (accumulated.trim()) {
        onSuggestion(accumulated.trim());
        toast({ title: "Sugestão aplicada ✨" });
      }
    } catch (err: any) {
      toast({ title: err.message || "Erro ao gerar sugestão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSuggest}
      disabled={loading || !selectedProfileId}
      className="gap-1.5 text-xs text-primary hover:text-primary/80 h-7 px-2"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {loading ? "Gerando..." : "Sugerir com IA"}
    </Button>
  );
}
