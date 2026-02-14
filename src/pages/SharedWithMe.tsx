import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TopNav } from "@/components/TopNav";
import { FolderOpen, Check, X, Users, Inbox } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

interface SharedProject {
  id: string;
  project_id: string;
  owner_id: string;
  shared_with_email: string;
  permission: string;
  status: string;
  created_at: string;
  project_name?: string;
}

export default function SharedWithMe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shares, setShares] = useState<SharedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchShares();
  }, [user]);

  const fetchShares = async () => {
    if (!user?.email) return;

    // First update any pending shares that match this user's email
    await supabase
      .from("project_shares")
      .update({ shared_with_user_id: user.id })
      .eq("shared_with_email", user.email.toLowerCase())
      .is("shared_with_user_id", null);

    const { data } = await supabase
      .from("project_shares")
      .select("*")
      .eq("shared_with_user_id", user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Fetch project names
      const projectIds = data.map((d) => d.project_id);
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", projectIds);

      const enriched = data.map((s) => ({
        ...s,
        project_name: projects?.find((p) => p.id === s.project_id)?.name || "Projeto",
      }));
      setShares(enriched);
    }
    setLoading(false);
  };

  const handleAccept = async (shareId: string) => {
    const { error } = await supabase
      .from("project_shares")
      .update({ status: "accepted" })
      .eq("id", shareId);
    if (error) {
      toast.error("Erro ao aceitar convite");
    } else {
      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, status: "accepted" } : s))
      );
      toast.success("Convite aceito!");
    }
  };

  const handleReject = async (shareId: string) => {
    const { error } = await supabase
      .from("project_shares")
      .update({ status: "rejected" })
      .eq("id", shareId);
    if (error) {
      toast.error("Erro ao recusar");
    } else {
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      toast.success("Convite recusado");
    }
  };

  const pendingShares = shares.filter((s) => s.status === "pending");
  const acceptedShares = shares.filter((s) => s.status === "accepted");

  return (
    <div className="min-h-screen bg-background surface-gradient">
      <TopNav />
      <header className="pt-8 pb-2 px-4 text-center">
        <h1 className="text-2xl font-bold gradient-text flex items-center justify-center gap-2">
          <Users className="h-6 w-6" />
          Compartilhados comigo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Projetos que outras pessoas compartilharam com você
        </p>
      </header>

      <main className="container px-4 py-6 max-w-3xl mx-auto space-y-8">
        {loading ? (
          <p className="text-muted-foreground text-center py-12 animate-pulse">Carregando...</p>
        ) : shares.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">
              Nenhum projeto compartilhado com você ainda
            </p>
          </div>
        ) : (
          <>
            {/* Pending invitations */}
            {pendingShares.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  📩 Convites pendentes ({pendingShares.length})
                </h2>
                {pendingShares.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="premium-card border-primary/20">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{s.project_name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Permissão: {s.permission === "editor" ? "Editor" : "Visualizador"} •{" "}
                            {new Date(s.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(s.id)}
                            className="gap-1"
                          >
                            <Check className="h-4 w-4" /> Aceitar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(s.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </section>
            )}

            {/* Accepted shares */}
            {acceptedShares.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  ✅ Projetos acessíveis ({acceptedShares.length})
                </h2>
                {acceptedShares.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="premium-card">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{s.project_name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {s.permission === "editor" ? "Editor" : "Visualizador"} •{" "}
                            {new Date(s.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/project/${s.project_id}`)}
                          className="gap-1"
                        >
                          <FolderOpen className="h-4 w-4" /> Abrir
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
