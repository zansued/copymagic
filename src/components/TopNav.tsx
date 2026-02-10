import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FolderOpen, Plus, LogOut, BarChart3, ArrowLeft } from "lucide-react";

export function TopNav({ projectName }: { projectName?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();

  const isProjectPage = location.pathname.startsWith("/project/");
  const isSummaryPage = location.pathname.endsWith("/summary");

  const handleCreate = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: "Novo Projeto" })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar projeto");
      return;
    }
    navigate(`/project/${data.id}`);
  };

  return (
    <nav className="sticky top-0 z-50 glass-header">
      <div className="container flex items-center justify-between h-14 px-4">
        {/* Left: branding + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-bold gradient-text shrink-0 hover:opacity-80 transition-opacity"
          >
            CopyEngine
          </button>

          {isProjectPage && projectName && (
            <>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span className="text-sm text-foreground/70 truncate max-w-[200px]">
                {projectName}
              </span>
              {isSummaryPage && (
                <>
                  <span className="text-muted-foreground/40 text-xs">/</span>
                  <span className="text-xs text-muted-foreground">Resumo</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {isProjectPage && !isSummaryPage && id && (
            <button
              onClick={() => navigate(`/project/${id}/summary`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Resumo
            </button>
          )}

          {isProjectPage && isSummaryPage && id && (
            <button
              onClick={() => navigate(`/project/${id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Editar
            </button>
          )}

          {!isProjectPage && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Projetos
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title={user?.email ?? "Sair"}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
