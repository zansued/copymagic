import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { FileText, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SharedOutput() {
  const { token } = useParams<{ token: string }>();
  const [output, setOutput] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: share } = await supabase
        .from("generation_shares")
        .select("generation_id")
        .eq("share_token", token)
        .eq("is_public", true)
        .maybeSingle();

      if (!share) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: gen } = await supabase
        .from("agent_generations")
        .select("output, agent_name")
        .eq("id", share.generation_id)
        .maybeSingle();

      if (gen) {
        setOutput(gen.output);
        setAgentName(gen.agent_name);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [token]);

  const copyAll = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast.success("Copiado!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Link inválido ou conteúdo removido</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-foreground">{agentName}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5">
            <Copy className="h-4 w-4" /> Copiar
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{output || ""}</ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
