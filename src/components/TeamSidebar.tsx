import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, ClipboardCheck, TrendingUp, UsersRound, FolderOpen, MessageCircle, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamChat } from "@/components/team/TeamChat";

interface TeamSidebarProps {
  open: boolean;
  onClose: () => void;
}

const teamItems = [
  {
    icon: UsersRound,
    label: "Equipe",
    path: "/team",
    description: "Gerenciar membros e convites",
    iconColor: "text-violet-400",
  },
  {
    icon: FolderOpen,
    label: "Projetos",
    path: "/team-projects",
    description: "Projetos colaborativos do time",
    iconColor: "text-blue-400",
  },
  {
    icon: BookOpen,
    label: "Biblioteca",
    path: "/library",
    description: "Repositório de copies do time",
    iconColor: "text-emerald-400",
  },
  {
    icon: ClipboardCheck,
    label: "Aprovações",
    path: "/reviews",
    description: "Revisar e aprovar copies",
    iconColor: "text-amber-400",
  },
  {
    icon: TrendingUp,
    label: "Métricas",
    path: "/team-dashboard",
    description: "Dashboard de produtividade",
    iconColor: "text-cyan-400",
  },
];

type SidebarTab = "nav" | "chat";

export function TeamSidebar({ open, onClose }: TeamSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<SidebarTab>("nav");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            className="fixed top-0 right-0 z-50 h-full w-80 bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header with tabs */}
            <div className="px-4 pt-3 pb-0 border-b border-border/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Equipe</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5">
                <button
                  onClick={() => setTab("nav")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    tab === "nav"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Navigation className="h-3 w-3" />
                  Navegação
                </button>
                <button
                  onClick={() => setTab("chat")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    tab === "chat"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageCircle className="h-3 w-3" />
                  Chat
                </button>
              </div>
            </div>

            {/* Content */}
            {tab === "nav" ? (
              <>
                <nav className="flex-1 p-3 space-y-1">
                  {teamItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          onClose();
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? item.iconColor : "")} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground/70 truncate">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </nav>

                <div className="px-5 py-3 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground/50 text-center">
                    Plano Agency · Workspace colaborativo
                  </p>
                </div>
              </>
            ) : (
              <TeamChat />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
