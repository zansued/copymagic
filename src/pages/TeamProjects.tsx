import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useProfiles } from "@/hooks/use-profiles";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  FolderOpen,
  Trash2,
  Edit2,
  Users,
  Loader2,
  ArrowUpDown,
  Filter,
  BarChart3,
  Clock,
  CheckCircle2,
  Pause,
  AlertCircle,
  Layers,
  Columns3,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MorphingCardStack, type CardData } from "@/components/ui/morphing-card-stack";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/ui/kanban";

// ── Types ──
type ProjectStatus = "active" | "completed" | "paused";

interface TeamProject {
  id: string;
  name: string;
  product_input: string;
  copy_results: any;
  created_at: string;
  updated_at: string;
  user_id: string;
  team_id: string | null;
}

type SortBy = "updated" | "name" | "progress";
type SortDir = "asc" | "desc";

// ── Animated number ──
function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

// ── Helpers ──
const STEP_IDS = ["avatar", "oferta", "usp", "pagina_vendas", "upsells", "anuncios", "vsl_longa", "pagina_upsell", "vsl_upsell"];

function completedSteps(results: any): number {
  if (!results || typeof results !== "object") return 0;
  return STEP_IDS.filter(id => !!(results as Record<string, any>)[id]).length;
}

function getProjectProgress(p: TeamProject): number {
  return Math.round((completedSteps(p.copy_results) / STEP_IDS.length) * 100);
}

function getProjectStatus(p: TeamProject): ProjectStatus {
  const progress = getProjectProgress(p);
  if (progress >= 100) return "completed";
  if (progress === 0) return "paused";
  return "active";
}

const statusConfig: Record<ProjectStatus, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  active: { label: "Em andamento", icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  completed: { label: "Concluído", icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  paused: { label: "Sem progresso", icon: Pause, color: "text-muted-foreground", bgColor: "bg-muted/50" },
};

// ── Container variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const hoverSpring = { type: "spring" as const, stiffness: 300, damping: 20 };

// ── Main ──
export default function TeamProjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { team, members, myRole, loading: teamLoading } = useTeam();
  const memberIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const { profiles } = useProfiles(memberIds);

  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list" | "stack" | "kanban">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editProject, setEditProject] = useState<TeamProject | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canEdit = myRole === "owner" || myRole === "admin" || myRole === "editor";

  // Fetch team projects
  const fetchProjects = useCallback(async () => {
    if (!team) return;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", team.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar projetos da equipe");
    } else {
      setProjects((data ?? []) as unknown as TeamProject[]);
    }
    setLoading(false);
  }, [team]);

  useEffect(() => {
    if (!teamLoading && team) fetchProjects();
    else if (!teamLoading) setLoading(false);
  }, [teamLoading, team, fetchProjects]);

  // Filter & sort
  const prepared = useMemo(() => {
    let list = [...projects];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    if (statusFilter !== "all") list = list.filter((p) => getProjectStatus(p) === statusFilter);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "updated": cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "progress": cmp = getProjectProgress(a) - getProjectProgress(b); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [projects, search, statusFilter, sortBy, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => getProjectStatus(p) === "active").length;
    const completed = projects.filter((p) => getProjectStatus(p) === "completed").length;
    return { total, active, completed };
  }, [projects]);

  // Actions
  const handleCreate = async () => {
    if (!user || !team || !createName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name: createName.trim(), team_id: team.id })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error("Erro ao criar projeto");
    } else {
      toast.success("Projeto criado!");
      setCreateOpen(false);
      setCreateName("");
      fetchProjects();
    }
  };

  const handleRename = async () => {
    if (!editProject || !editName.trim()) return;
    const { error } = await supabase.from("projects").update({ name: editName.trim() }).eq("id", editProject.id);
    if (error) toast.error("Erro ao renomear");
    else {
      toast.success("Projeto renomeado");
      setEditProject(null);
      fetchProjects();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("projects").delete().eq("id", deleteId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Projeto excluído");
      setProjects((p) => p.filter((x) => x.id !== deleteId));
    }
    setDeleteId(null);
  };

  const getCreatorName = (userId: string) => {
    const p = profiles[userId];
    return p?.display_name || userId.slice(0, 8);
  };

  const getCreatorAvatar = (userId: string) => profiles[userId]?.avatar_url || undefined;

  // ── Guards ──
  if (teamLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">Nenhuma equipe encontrada</h1>
          <p className="text-muted-foreground text-sm">Crie uma equipe primeiro para gerenciar projetos colaborativos.</p>
          <Button onClick={() => navigate("/team")}>Ir para Equipes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <motion.div
        className="max-w-6xl mx-auto px-4 py-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Header + Stats ── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              Projetos — {team.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os projetos de copy da sua equipe
            </p>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Ativos", value: stats.active, color: "text-blue-500" },
              { label: "Concluídos", value: stats.completed, color: "text-emerald-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
                <span className={cn("text-lg font-bold", s.color)}>
                  <AnimatedNumber value={s.value} />
                </span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Team Avatars ── */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 6).map((m, i) => {
              const p = profiles[m.user_id];
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ scale: 1.15, zIndex: 10, y: -2 }}
                >
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={p?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(p?.display_name || m.user_id).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground">{members.length} membros</span>
        </motion.div>

        {/* ── Controls bar ── */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projetos..."
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Em andamento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="paused">Sem progresso</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[150px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Atualização</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="progress">Progresso</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            title={sortDir === "asc" ? "Crescente" : "Decrescente"}
          >
            <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortDir === "asc" && "rotate-180")} />
          </Button>

          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            {([
              { key: "kanban" as const, icon: Columns3, label: "Kanban" },
              { key: "stack" as const, icon: Layers, label: "Stack" },
              { key: "grid" as const, icon: LayoutGrid, label: "Grid" },
              { key: "list" as const, icon: List, label: "Lista" },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  "p-2 transition-colors",
                  view === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
                )}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {canEdit && (
            <Button onClick={() => setCreateOpen(true)} className="ml-auto">
              <Plus className="h-4 w-4 mr-1" /> Novo Projeto
            </Button>
          )}
        </motion.div>

        {/* ── Activity bar ── */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Progresso da equipe</span>
                <span className="text-xs text-muted-foreground">
                  {stats.completed}/{stats.total} concluídos
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted flex overflow-hidden">
                {stats.total > 0 && (
                  <>
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.active / stats.total) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Concluído
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Em andamento
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Sem progresso
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Projects Grid/List/Stack ── */}
        {prepared.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-16 space-y-3">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-semibold text-foreground">
              {search || statusFilter !== "all" ? "Nenhum projeto encontrado" : "Nenhum projeto da equipe"}
            </p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {search || statusFilter !== "all"
                ? "Tente ajustar os filtros."
                : "Crie o primeiro projeto colaborativo da equipe."}
            </p>
            {canEdit && !search && statusFilter === "all" && (
              <Button onClick={() => setCreateOpen(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-1" /> Criar Projeto
              </Button>
            )}
          </motion.div>
        ) : view === "kanban" ? (
          <motion.div variants={itemVariants}>
            {(() => {
              const kanbanCols: Record<string, TeamProject[]> = {
                paused: prepared.filter((p) => getProjectStatus(p) === "paused"),
                active: prepared.filter((p) => getProjectStatus(p) === "active"),
                completed: prepared.filter((p) => getProjectStatus(p) === "completed"),
              };
              const colConfig: Record<string, { label: string; color: string }> = {
                paused: { label: "Sem progresso", color: "border-t-muted-foreground" },
                active: { label: "Em andamento", color: "border-t-blue-500" },
                completed: { label: "Concluído", color: "border-t-emerald-500" },
              };
              return (
                <Kanban
                  value={kanbanCols}
                  onValueChange={() => {}}
                  getItemValue={(item: TeamProject) => item.id}
                >
                  <KanbanBoard className="grid-cols-1 sm:grid-cols-3">
                    {Object.entries(colConfig).map(([status, config]) => (
                      <KanbanColumn
                        key={status}
                        value={status}
                        disabled
                        className={cn(
                          "rounded-xl border border-border bg-card/50 p-3 border-t-4",
                          config.color
                        )}
                      >
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-foreground">{config.label}</h3>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {kanbanCols[status]?.length || 0}
                            </Badge>
                          </div>
                        </div>
                        <KanbanColumnContent value={status} className="min-h-[200px] gap-3">
                          {(kanbanCols[status] || []).map((p) => {
                            const progress = getProjectProgress(p);
                            return (
                              <KanbanItem key={p.id} value={p.id} disabled>
                                <div
                                  className="rounded-lg border border-border bg-card p-3 space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
                                  onClick={() => navigate(`/project/${p.id}`)}
                                >
                                  <h4 className="font-semibold text-sm text-foreground truncate">{p.name}</h4>
                                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={getCreatorAvatar(p.user_id)} />
                                        <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                                          {getCreatorName(p.user_id).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                        {getCreatorName(p.user_id)}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{progress}%</span>
                                  </div>
                                </div>
                              </KanbanItem>
                            );
                          })}
                        </KanbanColumnContent>
                      </KanbanColumn>
                    ))}
                  </KanbanBoard>
                  <KanbanOverlay />
                </Kanban>
              );
            })()}
          </motion.div>
        ) : view === "stack" ? (
          <motion.div variants={itemVariants}>
            <MorphingCardStack
              cards={prepared.map((p) => {
                const progress = getProjectProgress(p);
                const status = getProjectStatus(p);
                const sc = statusConfig[status];
                const StatusIcon = sc.icon;
                return {
                  id: p.id,
                  title: p.name,
                  description: `${completedSteps(p.copy_results)}/${STEP_IDS.length} etapas · ${progress}%`,
                  icon: <StatusIcon className={cn("h-5 w-5", sc.color)} />,
                  footer: (
                    <div className="space-y-2">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={getCreatorAvatar(p.user_id)} />
                            <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                              {getCreatorName(p.user_id).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                            {getCreatorName(p.user_id)}
                          </span>
                        </div>
                        <Badge variant="secondary" className={cn("text-[9px] gap-0.5", sc.bgColor, sc.color)}>
                          {sc.label}
                        </Badge>
                      </div>
                    </div>
                  ),
                } as CardData;
              })}
              onCardClick={(card) => navigate(`/project/${card.id}`)}
              className="py-4"
            />
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              view === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            )}
          >
            <AnimatePresence mode="popLayout">
              {prepared.map((p) => {
                const progress = getProjectProgress(p);
                const status = getProjectStatus(p);
                const sc = statusConfig[status];
                const StatusIcon = sc.icon;
                const isMyProject = p.user_id === user?.id;
                const canModify = myRole === "owner" || myRole === "admin" || isMyProject;

                return (
                  <motion.div
                    key={p.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={hoverSpring}
                  >
                    <Card
                      className={cn(
                        "border-border bg-card cursor-pointer group relative overflow-hidden transition-shadow hover:shadow-lg",
                        view === "list" && "flex-row"
                      )}
                      onClick={() => navigate(`/project/${p.id}`)}
                    >
                      {/* Accent top bar */}
                      <div
                        className={cn("h-1", sc.bgColor)}
                        style={{ background: progress >= 100 ? "hsl(var(--primary))" : undefined }}
                      />

                      <CardContent className={cn(
                        "p-4",
                        view === "list" && "flex items-center gap-4"
                      )}>
                        {/* Status + Title */}
                        <div className={cn("flex-1 min-w-0", view === "list" && "flex items-center gap-4")}>
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className={cn("text-[10px] gap-1", sc.bgColor, sc.color)}>
                                  <StatusIcon className="h-3 w-3" />
                                  {sc.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {completedSteps(p.copy_results)}/{STEP_IDS.length} etapas
                                </span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2" onClick={(e) => e.stopPropagation()}>
                              {canModify && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => { setEditProject(p); setEditName(p.name); }}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(p.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => navigate(`/project/${p.id}/summary`)}
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-muted-foreground">Progresso</span>
                              <span className="text-[10px] font-medium text-foreground">{progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>

                          {/* Footer: creator + date */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={getCreatorAvatar(p.user_id)} />
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {getCreatorName(p.user_id).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                {getCreatorName(p.user_id)}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Projeto da Equipe</DialogTitle>
            <DialogDescription>
              Crie um novo projeto de copy para a equipe "{team.name}". Todos os membros terão acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="project-name">Nome do projeto</Label>
            <Input
              id="project-name"
              placeholder="Ex: Lançamento Produto X"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!createName.trim() || creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editProject} onOpenChange={(v) => !v && setEditProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Nome</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProject(null)}>Cancelar</Button>
            <Button onClick={handleRename} disabled={!editName.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Todo o copy gerado será perdido. Esta ação não pode ser desfeita.
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
