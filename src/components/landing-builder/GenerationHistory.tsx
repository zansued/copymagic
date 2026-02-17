import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Clock, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface SiteGeneration {
  id: string;
  project_id: string;
  template_key: string;
  status: string;
  generated_html: string | null;
  language_code: string | null;
  branding: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface GenerationHistoryProps {
  projectId: string;
  onLoad: (gen: SiteGeneration) => void;
  refreshKey?: number;
}

const TEMPLATE_LABELS: Record<string, string> = {
  "saas-premium": "SaaS Premium",
  "vsl-page": "VSL Page",
  "longform-dr": "Longform DR",
  "upsell-focus": "Upsell Focus",
};

export function GenerationHistory({ projectId, onLoad, refreshKey }: GenerationHistoryProps) {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<SiteGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchGenerations = useCallback(async () => {
    if (!user || !projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("site_generations")
      .select("id, project_id, template_key, status, generated_html, language_code, branding, created_at, updated_at")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching generations:", error);
    } else {
      setGenerations((data || []) as SiteGeneration[]);
    }
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations, refreshKey]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("site_generations")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast.error("Erro ao excluir geração");
    } else {
      toast.success("Geração excluída");
      setGenerations((prev) => prev.filter((g) => g.id !== deleteId));
    }
    setDeleteId(null);
  };

  if (!projectId) return null;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Gerações Salvas</span>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        {generations.length === 0 && !loading ? (
          <p className="text-[11px] text-muted-foreground py-2">
            Nenhuma geração salva para este projeto.
          </p>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1.5">
              {generations.map((gen) => {
                const date = new Date(gen.created_at);
                const dateStr = date.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={gen.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors group"
                  >
                    <button
                      onClick={() => onLoad(gen)}
                      className="flex-1 text-left min-w-0"
                      disabled={!gen.generated_html}
                    >
                      <p className="text-xs font-medium text-foreground truncate">
                        {TEMPLATE_LABELS[gen.template_key] || gen.template_key}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{dateStr}</p>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {gen.generated_html && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const w = window.open("", "_blank");
                            if (w && gen.generated_html) {
                              w.document.write(gen.generated_html);
                              w.document.close();
                            }
                          }}
                          title="Abrir em nova aba"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(gen.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir geração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O HTML gerado será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
