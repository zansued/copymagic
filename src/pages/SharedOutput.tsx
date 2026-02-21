import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { FileText, Copy, Loader2, MessageCircle, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SharedOutput() {
  const { token } = useParams<{ token: string }>();
  const [output, setOutput] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    (async () => {
      // Increment view
      await supabase.rpc("increment_share_view", { p_token: token });

      const { data: share } = await supabase
        .from("generation_shares")
        .select("generation_id, view_count")
        .eq("share_token", token)
        .eq("is_public", true)
        .maybeSingle();

      if (!share) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setViewCount((share.view_count ?? 0) + 1);

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

  const shareWhatsApp = () => {
    const link = window.location.href;
    const text = `🔥 Olha essa copy incrível!\n\n📝 *${agentName}*\n\n👉 ${link}\n\nCria a sua também de graça no CopyEngine Pro!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
      {/* Header with branding */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm">{agentName}</h1>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                Criado com <span className="font-semibold text-primary">CopyEngine Pro</span>
                <span className="mx-1">•</span>
                <Eye className="h-3 w-3" /> {viewCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5 text-xs">
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
            <Button
              size="sm"
              onClick={shareWhatsApp}
              className="gap-1.5 text-xs bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{output || ""}</ReactMarkdown>
        </div>
      </main>

      {/* CTA Footer - Referral Loop */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Criado com CopyEngine Pro</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Gere copies de alta conversão com IA em segundos. Headlines, VSLs, e-mails, anúncios e muito mais.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                <Sparkles className="h-4 w-4" />
                Criar minha conta grátis
              </Button>
            </Link>
            <Button variant="outline" onClick={shareWhatsApp} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
