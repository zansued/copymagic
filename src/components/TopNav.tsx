import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MenuBar } from "@/components/ui/menu-bar";
import { Menu, LogOut, Globe, Dna, Bot, Brain, BarChart3, UsersRound, CreditCard, Shield, FolderOpen, Telescope } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useSubscription } from "@/hooks/use-subscription";
import { TeamSidebar } from "@/components/TeamSidebar";
import { InviteNotifications } from "@/components/InviteNotifications";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DnaBadge } from "@/components/brand/DnaBadge";

const menuItems = [
  {
    icon: BarChart3,
    label: "Roadmap",
    path: "/",
    gradient: "radial-gradient(circle, hsl(45 90% 55% / 0.15) 0%, transparent 70%)",
    iconColor: "text-amber-400",
  },
  {
    icon: FolderOpen,
    label: "Lab de Copy",
    path: "/projects",
    gradient: "radial-gradient(circle, hsl(262 83% 65% / 0.15) 0%, transparent 70%)",
    iconColor: "text-primary",
  },
  {
    icon: Bot,
    label: "Agentes",
    path: "/agents",
    gradient: "radial-gradient(circle, hsl(220 90% 56% / 0.15) 0%, transparent 70%)",
    iconColor: "text-blue-400",
    dataTour: "nav-agents",
  },
  {
    icon: Brain,
    label: "Mentor",
    path: "/mentor",
    gradient: "radial-gradient(circle, hsl(292 70% 50% / 0.15) 0%, transparent 70%)",
    iconColor: "text-fuchsia-400",
    dataTour: "nav-mentor",
  },
  {
    icon: Dna,
    label: "DNA",
    path: "/brand-profiles",
    gradient: "radial-gradient(circle, hsl(262 83% 65% / 0.15) 0%, transparent 70%)",
    iconColor: "text-violet-400",
    dataTour: "nav-dna",
  },
  {
    icon: Telescope,
    label: "Ofertas",
    path: "/offer-research",
    gradient: "radial-gradient(circle, hsl(30 90% 50% / 0.15) 0%, transparent 70%)",
    iconColor: "text-orange-400",
  },
  {
    icon: Globe,
    label: "Landing",
    path: "/landing-builder",
    gradient: "radial-gradient(circle, hsl(200 80% 50% / 0.15) 0%, transparent 70%)",
    iconColor: "text-cyan-400",
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
  const { isAdmin } = useAdmin();
  const { subscription } = useSubscription();
  const [teamSidebarOpen, setTeamSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dnaName, setDnaName] = useState<string | null>(null);

  // Fetch active DNA profile name
  useEffect(() => {
    if (!user) return;
    supabase
      .from("brand_profiles")
      .select("name")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDnaName(data.name);
      });
  }, [user]);

  const isAgency = subscription?.plan === "agency" || subscription?.plan === "lifetime";

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

  const filteredMenuItems = menuItems;

  const activeLabel = filteredMenuItems.find(
    (i) => location.pathname === i.path
  )?.label;

  const handleItemClick = (label: string) => {
    const item = filteredMenuItems.find((i) => i.label === label);
    if (!item) return;
    navigate(item.path);
  };

  // Check if current route is a team page (to highlight team button)
  const isTeamPage = ["/team", "/library", "/reviews", "/team-dashboard", "/team-projects"].includes(location.pathname);

  return (
    <>
      <nav className="sticky top-0 z-50 glass-header">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: hamburger (mobile) + branding */}
          <div className="flex items-center gap-3 min-w-0 w-40 shrink-0">
            {/* Mobile hamburger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
                  <SheetTitle className="text-left gradient-text text-lg">CopyEngine</SheetTitle>
                </SheetHeader>
                {dnaName && (
                  <div className="px-4 py-3 border-b border-border">
                    <DnaBadge name={dnaName} compact onClick={() => { setMobileMenuOpen(false); navigate("/brand-profiles"); }} />
                  </div>
                )}
                <div className="flex flex-col py-2">
                  {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                          isActive
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className={`h-4.5 w-4.5 ${isActive ? item.iconColor : ""}`} />
                        {item.label}
                      </button>
                    );
                  })}
                  {isAgency && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTeamSidebarOpen(true);
                      }}
                      className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                        isTeamPage
                          ? "text-primary bg-primary/10 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <UsersRound className="h-4.5 w-4.5" />
                      Equipe
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        navigate("/admin");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Shield className="h-4.5 w-4.5" />
                      Admin
                    </button>
                  )}
                  <div className="border-t border-border mt-2 pt-2">
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      Sair
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

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

          {/* Center: MenuBar (hidden on mobile) */}
          <div className="flex-1 justify-center hidden md:flex">
            <MenuBar
              items={filteredMenuItems}
              activeItem={activeLabel}
              onItemClick={handleItemClick}
            />
          </div>

          {/* Right: team + admin + logout (desktop only) */}
          <div className="w-auto shrink-0 flex justify-end items-center gap-1">
            {dnaName && <DnaBadge name={dnaName} compact />}
            <InviteNotifications />
            {isAgency && (
              <button
                onClick={() => setTeamSidebarOpen(true)}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isTeamPage
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
                title="Equipe"
              >
                <UsersRound className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Equipe</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Admin"
              >
                <Shield className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={signOut}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={user?.email ?? "Sair"}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Team Sidebar (Agency only) */}
      {isAgency && (
        <TeamSidebar open={teamSidebarOpen} onClose={() => setTeamSidebarOpen(false)} />
      )}
    </>
  );
}
