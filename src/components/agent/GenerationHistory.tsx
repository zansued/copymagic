import { useState, useEffect } from "react";
import { History, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";

interface Generation {
  id: string;
  agent_name: string;
  inputs: Record<string, string>;
  output: string;
  provider: string;
  created_at: string;
}

interface GenerationHistoryProps {
  agentId: string;
  userId: string;
  onLoad: (output: string, generationId?: string) => void;
}

export function GenerationHistory({ agentId, userId, onLoad }: GenerationHistoryProps) {
  const [items, setItems] = useState<Generation[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("agent_generations")
      .select("id, agent_name, inputs, output, provider, created_at")
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as Generation[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && items.length === 0) {
      fetchHistory();
    }
  }, [open]);

  const handleDelete = async (id: string) => {
    await supabase.from("agent_generations").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const getPreview = (output: string) => {
    const clean = output.replace(/[#*_`]/g, "").trim();
    return clean.length > 120 ? clean.slice(0, 120) + "…" : clean;
  };

  const getInputSummary = (inputs: Record<string, string>) => {
    const mainKey = Object.keys(inputs).find(
      (k) => !["tone", "style", "duration", "platform", "slides_count", "objective", "page_format", "framework", "format", "email_format", "scraped_content"].includes(k) && inputs[k]?.trim()
    );
    if (!mainKey) return "";
    const val = inputs[mainKey];
    return val.length > 80 ? val.slice(0, 80) + "…" : val;
  };

  return (
    <div className="premium-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <History className="h-4 w-4 text-primary" />
          Histórico ({open ? items.length : "…"})
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
              {loading && (
                <p className="text-xs text-muted-foreground animate-pulse py-3 text-center">Carregando…</p>
              )}

              {!loading && items.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 text-center">Nenhuma geração salva ainda.</p>
              )}

              {items.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-border/50 p-3 hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer"
                  onClick={() => onLoad(item.output, item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.created_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50">{item.provider}</span>
                      </p>
                      {getInputSummary(item.inputs as Record<string, string>) && (
                        <p className="text-xs text-foreground/70 truncate">
                          📝 {getInputSummary(item.inputs as Record<string, string>)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/80 line-clamp-2">
                        {getPreview(item.output)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
