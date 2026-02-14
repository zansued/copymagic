import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MenuBar } from "@/components/ui/menu-bar";
import { FolderOpen, Plus, LogOut, Globe, Dna, Bot, Brain, BarChart3, Users, CreditCard } from "lucide-react";

const menuItems = [
  {
    icon: FolderOpen,
    label: "Lab de Copy",
    path: "/",
    gradient: "radial-gradient(circle, hsl(262 83% 65% / 0.15) 0%, transparent 70%)",
    iconColor: "text-primary",
  },
  {
    icon: Bot,
    label: "Agentes",
    path: "/agents",
    gradient: "radial-gradient(circle, hsl(220 90% 56% / 0.15) 0%, transparent 70%)",
    iconColor: "text-blue-400",
  },
  {
    icon: Brain,
    label: "Mentor",
    path: "/mentor",
    gradient: "radial-gradient(circle, hsl(292 70% 50% / 0.15) 0%, transparent 70%)",
    iconColor: "text-fuchsia-400",
  },
  {
    icon: Dna,
    label: "DNA",
    path: "/brand-profiles",
    gradient: "radial-gradient(circle, hsl(262 83% 65% / 0.15) 0%, transparent 70%)",
    iconColor: "text-violet-400",
  },
  {
    icon: Globe,
    label: "Landing",
    path: "/landing-builder",
    gradient: "radial-gradient(circle, hsl(200 80% 50% / 0.15) 0%, transparent 70%)",
    iconColor: "text-cyan-400",
  },
  {
    icon: BarChart3,
    label: "Dashboard",
    path: "/dashboard",
    gradient: "radial-gradient(circle, hsl(160 60% 45% / 0.15) 0%, transparent 70%)",
    iconColor: "text-emerald-400",
  },
  {
    icon: Users,
    label: "Compartilhados",
    path: "/shared-with-me",
    gradient: "radial-gradient(circle, hsl(40 80% 55% / 0.15) 0%, transparent 70%)",
    iconColor: "text-amber-400",
  },
  {
    icon: CreditCard,
    label: "Planos",
    path: "/pricing",
    gradient: "radial-gradient(circle, hsl(142 70% 45% / 0.15) 0%, transparent 70%)",
    iconColor: "text-green-400",
  },
];

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
      .insert({ user_id: user.id, name: "Nova Oferta" })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar projeto");
      return;
    }
    navigate(`/project/${data.id}`);
  };

  const activeLabel = menuItems.find(
    (i) => i.path !== "__create__" && location.pathname === i.path
  )?.label;

  const handleItemClick = (label: string) => {
    const item = menuItems.find((i) => i.label === label);
    if (!item) return;
    if (item.path === "__create__") {
      handleCreate();
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-header">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: branding + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0 w-40 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-bold gradient-text shrink-0 hover:opacity-80 transition-opacity"
          >
            CopyEngine
          </button>

          {isProjectPage && projectName && (
            <>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span className="text-sm text-foreground/70 truncate max-w-[120px]">
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

        {/* Center: MenuBar */}
        <div className="flex-1 flex justify-center">
          <MenuBar
            items={menuItems}
            activeItem={activeLabel}
            onItemClick={handleItemClick}
          />
        </div>

        {/* Right: logout */}
        <div className="w-40 shrink-0 flex justify-end">
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
