import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AiFillDialogProps {
  onFill: (data: Record<string, Record<string, string>>) => void;
}

export default function AiFillDialog({ onFill }: AiFillDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-brand-dna`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar DNA");
      }

      const dna = await res.json();
      onFill(dna);
      setOpen(false);
      setDescription("");
      toast({ title: "✨ DNA gerado com sucesso!", description: "Revise os campos e salve quando estiver pronto." });
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
          <Sparkles className="h-4 w-4" />
          Preencher com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar DNA com IA
          </DialogTitle>
          <DialogDescription>
            Descreva seu negócio, produto ou serviço. A IA vai preencher todas as seções do DNA automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Ex: Sou nutricionista esportiva com 8 anos de experiência. Atendo atletas e pessoas que querem melhorar performance. Meu diferencial é um método próprio que combina nutrição funcional com periodização. Quero lançar um curso online de R$497...`}
            className="min-h-[180px] text-sm leading-relaxed resize-y"
            disabled={loading}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {description.length}/10.000 caracteres
            </span>
            <Button
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
              className="gap-2 premium-button border-0 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando DNA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar DNA Completo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
