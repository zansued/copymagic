import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dock, DockItem, DockIcon, DockLabel } from "@/components/ui/dock";
import { FolderOpen, Plus, LogOut, Globe, Dna, Bot, Brain, ArrowLeft, BarChart3 } from "lucide-react";

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

  const isActive = (path: string) => location.pathname === path;

  const iconClass = (active: boolean) =>
    `flex items-center justify-center w-full h-full rounded-xl transition-colors ${
      active
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="sticky top-0 z-50 glass-header">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: branding + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0 w-48 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-bold gradient-text shrink-0 hover:opacity-80 transition-opacity"
          >
            CopyEngine
          </button>

          {isProjectPage && projectName && (
            <>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span className="text-sm text-foreground/70 truncate max-w-[140px]">
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

        {/* Center: Dock navigation */}
        <div className="flex-1 flex justify-center">
          <Dock
            magnification={60}
            distance={100}
            panelHeight={44}
            className="shadow-[0_4px_20px_-4px_hsl(228_12%_4%/0.5),0_0_40px_-12px_hsl(var(--glow)/0.1)]"
          >
            <DockItem>
              <DockLabel>Projetos</DockLabel>
              <DockIcon>
                <button onClick={() => navigate("/")} className={iconClass(isActive("/"))}>
                  <FolderOpen className="w-full h-full p-1" />
                </button>
              </DockIcon>
            </DockItem>

            <DockItem>
              <DockLabel>Novo Projeto</DockLabel>
              <DockIcon>
                <button onClick={handleCreate} className={iconClass(false)}>
                  <Plus className="w-full h-full p-1" />
                </button>
              </DockIcon>
            </DockItem>

            <DockItem>
              <DockLabel>Agentes IA</DockLabel>
              <DockIcon>
                <button onClick={() => navigate("/agents")} className={iconClass(isActive("/agents"))}>
                  <Bot className="w-full h-full p-1" />
                </button>
              </DockIcon>
            </DockItem>

            <DockItem>
              <DockLabel>Mentor de Riqueza</DockLabel>
              <DockIcon>
                <button onClick={() => navigate("/mentor")} className={iconClass(isActive("/mentor"))}>
                  <Brain className="w-full h-full p-1" />
                </button>
              </DockIcon>
            </DockItem>

            <DockItem>
              <DockLabel>DNA de Marca</DockLabel>
              <DockIcon>
                <button onClick={() => navigate("/brand-profiles")} className={iconClass(isActive("/brand-profiles"))}>
                  <Dna className="w-full h-full p-1" />
                </button>
              </DockIcon>
            </DockItem>

            <DockItem>
              <DockLabel>Landing Builder</DockLabel>
              <DockIcon>
                <button onClick={() => navigate("/landing-builder")} className={iconClass(isActive("/landing-builder"))}>
                  <Globe className="w-full h-full p-1" />
                </button>
              </DockIcon>
            </DockItem>

            {isProjectPage && !isSummaryPage && id && (
              <DockItem>
                <DockLabel>Resumo</DockLabel>
                <DockIcon>
                  <button onClick={() => navigate(`/project/${id}/summary`)} className={iconClass(false)}>
                    <BarChart3 className="w-full h-full p-1" />
                  </button>
                </DockIcon>
              </DockItem>
            )}

            {isProjectPage && isSummaryPage && id && (
              <DockItem>
                <DockLabel>Voltar ao Editor</DockLabel>
                <DockIcon>
                  <button onClick={() => navigate(`/project/${id}`)} className={iconClass(false)}>
                    <ArrowLeft className="w-full h-full p-1" />
                  </button>
                </DockIcon>
              </DockItem>
            )}
          </Dock>
        </div>

        {/* Right: logout */}
        <div className="w-48 shrink-0 flex justify-end">
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
