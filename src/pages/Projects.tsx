import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
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
import { Trash2, Edit2, FolderOpen, Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  product_input: string;
  research_data: any;
  copy_results: any;
  created_at: string;
  updated_at: string;
}

export default function Projects() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user!.id, name: "Novo Projeto" })
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">CopyEngine</h1>
              <p className="text-xs text-muted-foreground">Seus Projetos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl mx-auto space-y-6">
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
            <Plus className="h-4 w-4 mr-1" /> Novo Projeto
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">📂</p>
            <p className="text-muted-foreground">
              {search ? "Nenhum projeto encontrado" : "Você ainda não tem projetos"}
            </p>
            {!search && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" /> Criar primeiro projeto
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => navigate(`/project/${p.id}`)}
                    className="flex-1 text-left min-w-0"
                  >
                    {editingId === p.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(p.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-xs"
                      />
                    ) : (
                      <>
                        <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedSteps(p.copy_results)}/9 etapas •{" "}
                          {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                        </p>
                      </>
                    )}
                  </button>
                  <div className="flex gap-1 shrink-0">
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
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todas as copys desse projeto serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
