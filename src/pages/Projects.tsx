import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useTeam } from "@/hooks/use-team";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, Edit2, FolderOpen, Plus, Search, BarChart3, Share2, Lock, UsersRound, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TopNav } from "@/components/TopNav";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface Project {
  id: string;
  name: string;
  product_input: string;
  research_data: any;
  copy_results: any;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function Projects() {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const { teams } = useTeam();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [assigningTeam, setAssigningTeam] = useState(false);

  const projectsLimit = subscription?.projects_limit ?? 1;

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar projetos");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (projects.length >= projectsLimit) {
      toast.error(`Limite de ${projectsLimit} projeto${projectsLimit > 1 ? "s" : ""} atingido. Faça upgrade do seu plano.`);
      navigate("/pricing");
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user!.id, name: "Nova Oferta" })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar projeto");
      return;
    }
    navigate(`/project/${data.id}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("projects").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      setProjects((p) => p.filter((x) => x.id !== deleteId));
      toast.success("Projeto excluído");
    }
    setDeleteId(null);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("projects").update({ name: editName.trim() }).eq("id", id);
    if (error) {
      toast.error("Erro ao renomear");
    } else {
      setProjects((p) => p.map((x) => (x.id === id ? { ...x, name: editName.trim() } : x)));
    }
    setEditingId(null);
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const completedSteps = (results: any) => {
    if (!results || typeof results !== "object") return 0;
    return Object.keys(results).length;
  };

  return (
    <div className="min-h-screen bg-background surface-gradient">
      <TopNav />
      <header className="pt-8 pb-2 px-4 text-center space-y-2">
        <h1 className="text-2xl font-bold gradient-text">Laboratório de Copy</h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Crie um projeto para cada produto ou oferta. A IA guia você por 9 etapas — do perfil do cliente até a VSL — gerando todo o copy necessário para vender.
        </p>
      </header>

      <main className="container px-4 py-6 max-w-3xl mx-auto space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projetos..."
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" /> Nova Oferta
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🧪</p>
            <p className="text-lg font-semibold text-foreground">Nenhuma oferta criada</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {search ? "Nenhum resultado encontrado" : "Crie seu primeiro projeto de copy. A IA vai guiar você pelas 9 etapas para gerar todo o material de vendas do seu produto."}
            </p>
            {!search && (
              <Button onClick={handleCreate} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Criar primeira oferta
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <Card key={p.id} className="premium-card relative">
                <GlowingEffect
                  blur={6}
                  borderWidth={2}
                  spread={25}
                  proximity={80}
                  inactiveZone={0.5}
                  disabled={false}
                />
                <CardContent className="flex items-center gap-4 p-4">
                  {editingId === p.id ? (
                    <div className="flex-1 min-w-0">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(p.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="max-w-xs"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/project/${p.id}`)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                        {p.team_id && (() => {
                          const teamName = teams.find(t => t.id === p.team_id)?.name;
                          return teamName ? (
                            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                              <UsersRound className="h-3 w-3 mr-1" />
                              {teamName}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completedSteps(p.copy_results)}/9 etapas •{" "}
                        {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                      </p>
                    </button>
                  )}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (subscription?.plan === "agency" || (subscription?.plan as string) === "agency_plus") {
                          setShareProject(p);
                        } else {
                          toast.info("Compartilhamento de projetos disponível no plano Agency");
                        }
                      }}
                      title="Compartilhar"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(p.id);
                        setEditName(p.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project/${p.id}/summary`);
                      }}
                      title="Resumo"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project/${p.id}`);
                      }}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir oferta?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir <strong>"{projects.find(p => p.id === deleteId)?.name}"</strong>? Essa ação não pode ser desfeita. Todo o copy gerado para essa oferta será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {shareProject && (
        <Dialog open={!!shareProject} onOpenChange={(v) => !v && setShareProject(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                Compartilhar com equipe
              </DialogTitle>
              <DialogDescription className="truncate">
                {shareProject.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {teams.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-sm text-muted-foreground">Você ainda não tem equipes.</p>
                  <Button size="sm" variant="outline" onClick={() => navigate("/team")}>
                    Criar equipe
                  </Button>
                </div>
              ) : (
                teams.map((t) => {
                  const isAssigned = (shareProject as any).team_id === t.id;
                  return (
                    <button
                      key={t.id}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                        isAssigned
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                      }`}
                      onClick={async () => {
                        const newTeamId = isAssigned ? null : t.id;
                        const { error } = await supabase
                          .from("projects")
                          .update({ team_id: newTeamId })
                          .eq("id", shareProject.id);
                        if (error) {
                          toast.error("Erro ao atualizar equipe");
                        } else {
                          toast.success(newTeamId ? `Projeto vinculado à equipe "${t.name}"` : "Projeto desvinculado da equipe");
                          setProjects((prev) =>
                            prev.map((p) =>
                              p.id === shareProject.id ? { ...p, team_id: newTeamId } as any : p
                            )
                          );
                          setShareProject(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t.name}</span>
                      </div>
                      {isAssigned && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
