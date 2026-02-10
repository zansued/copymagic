import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Dock, DockItem, DockIcon, DockLabel } from "@/components/ui/dock";
import { FolderOpen, LogOut, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AppDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Dock
        magnification={70}
        distance={120}
        panelHeight={56}
        className="shadow-[0_8px_32px_-4px_hsl(228_12%_4%/0.7),0_0_60px_-12px_hsl(var(--glow)/0.15)]"
      >
        {/* Projects */}
        <DockItem>
          <DockLabel>Projetos</DockLabel>
          <DockIcon>
            <button
              onClick={() => navigate("/")}
              className={`flex items-center justify-center w-full h-full rounded-xl transition-colors ${
                location.pathname === "/"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderOpen className="w-full h-full p-1" />
            </button>
          </DockIcon>
        </DockItem>

        {/* New Project */}
        <DockItem>
          <DockLabel>Novo Projeto</DockLabel>
          <DockIcon>
            <button
              onClick={handleCreate}
              className="flex items-center justify-center w-full h-full rounded-xl text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-full h-full p-1" />
            </button>
          </DockIcon>
        </DockItem>

        {/* User / Logout */}
        <DockItem>
          <DockLabel>{user?.email ?? "Conta"}</DockLabel>
          <DockIcon>
            <button
              onClick={signOut}
              className="flex items-center justify-center w-full h-full rounded-xl text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-full h-full p-1" />
            </button>
          </DockIcon>
        </DockItem>
      </Dock>
    </div>
  );
}
