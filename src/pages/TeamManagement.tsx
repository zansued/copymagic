import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TopNav } from "@/components/TopNav";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useProfiles } from "@/hooks/use-profiles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users, UserPlus, Loader2, X, Pencil, Check, Plus, ArrowRightLeft, Trash2, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedTooltip, type TooltipItem } from "@/components/ui/animated-tooltip";
import { MemberCard } from "@/components/team/MemberCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function TeamManagement() {
  const { user } = useAuth();
  const {
    team, teams, members, invites, myRole, loading, isOwnerOrAdmin,
    createTeam, updateTeamName, deleteTeam, inviteMember, cancelInvite,
    removeMember, updateMemberRole, transferMember, switchTeam,
  } = useTeam();
  const { subscription } = useSubscription();
  const memberUserIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const { profiles, updateMyProfile, uploadAvatar } = useProfiles(memberUserIds);

  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Inline rename
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Create new team dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTeamDialogName, setNewTeamDialogName] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  // Remove member confirmation
  const [removingMember, setRemovingMember] = useState<{ id: string; name: string } | null>(null);

  // Transfer member dialog
  const [transferring, setTransferring] = useState<{ id: string; name: string } | null>(null);
  const [transferTarget, setTransferTarget] = useState("");

  // Delete team
  const [showDeleteTeam, setShowDeleteTeam] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [teamProjectsCount, setTeamProjectsCount] = useState<number | null>(null);
  const [checkingProjects, setCheckingProjects] = useState(false);

  const isAgency = subscription?.plan === "agency" || subscription?.plan === "lifetime";
  const MAX_TEAMS = subscription?.plan === "lifetime" ? 5 : 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAgency) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <Users className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Equipes é exclusivo do plano Agency</h1>
          <p className="text-muted-foreground">
            Faça upgrade para o plano Agency para criar sua equipe e convidar até 5 membros.
          </p>
          <Button onClick={() => (window.location.href = "/pricing")} className="mt-4">
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  // No team yet
  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-md mx-auto px-4 py-20 space-y-6">
          <div className="text-center space-y-2">
            <Users className="h-12 w-12 mx-auto text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Crie sua Equipe</h1>
            <p className="text-muted-foreground text-sm">
              Dê um nome à sua equipe e comece a convidar membros.
            </p>
          </div>
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-4">
              <Input
                placeholder="Nome da equipe"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!teamName.trim() || creating}
                onClick={async () => {
                  setCreating(true);
                  const result = await createTeam(teamName.trim());
                  setCreating(false);
                  if (result) toast.success("Equipe criada com sucesso!");
                  else toast.error("Erro ao criar equipe");
                }}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                Criar Equipe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const seatsUsed = members.length + invites.length;
  const seatsAvailable = team.seats_limit - seatsUsed;

  const roleLabel: Record<string, string> = {
    owner: "Owner", admin: "Admin", editor: "Editor", viewer: "Viewer",
  };

  const tooltipItems: TooltipItem[] = members.map((m) => {
    const p = profiles[m.user_id];
    return {
      id: m.id,
      name: p?.display_name || m.user_id.slice(0, 8),
      designation: roleLabel[m.role] || "Membro",
      initials: (p?.display_name || m.user_id).charAt(0).toUpperCase(),
      image: p?.avatar_url || undefined,
    };
  });

  const otherTeams = teams.filter((t) => t.id !== team.id);

  const handleSaveName = async () => {
    if (!newTeamName.trim()) return;
    setSavingName(true);
    const ok = await updateTeamName(newTeamName.trim());
    setSavingName(false);
    if (ok) {
      toast.success("Nome atualizado!");
      setEditingName(false);
    } else {
      toast.error("Erro ao atualizar nome");
    }
  };

  const handleConfirmRemove = async () => {
    if (!removingMember) return;
    const ok = await removeMember(removingMember.id);
    if (ok) toast.success("Membro removido");
    else toast.error("Erro ao remover membro");
    setRemovingMember(null);
  };

  const handleConfirmTransfer = async () => {
    if (!transferring || !transferTarget) return;
    const ok = await transferMember(transferring.id, transferTarget);
    if (ok) toast.success("Membro transferido!");
    else toast.error("Erro ao transferir membro");
    setTransferring(null);
    setTransferTarget("");
  };

  const handleDeleteTeamClick = async () => {
    if (!team) return;
    setCheckingProjects(true);
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id);
    setTeamProjectsCount(count ?? 0);
    setCheckingProjects(false);
    setShowDeleteTeam(true);
  };

  const handleConfirmDeleteTeam = async () => {
    if (!team) return;
    setDeletingTeam(true);
    const ok = await deleteTeam(team.id);
    setDeletingTeam(false);
    setShowDeleteTeam(false);
    if (ok) toast.success("Equipe excluída");
    else toast.error("Erro ao excluir equipe");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <motion.div
        className="max-w-3xl mx-auto px-4 py-8 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Team selector (if multiple teams) */}
        {teams.length > 1 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 flex-wrap">
              {teams.map((t) => (
                <Button
                  key={t.id}
                  variant={t.id === team.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchTeam(t.id)}
                  className="transition-all"
                >
                  {t.name}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="h-9 w-56 text-lg font-bold"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName} disabled={savingName}>
                    {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-primary" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingName(false)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 group">
                  <Users className="h-6 w-6 text-primary" />
                  {team.name}
                  {myRole === "owner" && (
                    <button
                      onClick={() => { setNewTeamName(team.name); setEditingName(true); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </button>
                  )}
                </h1>
              )}
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {team.plan.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {seatsUsed} / {team.seats_limit} seats utilizados
            </p>
          </div>

          <div className="flex items-center gap-3">
            {tooltipItems.length > 0 && <AnimatedTooltip items={tooltipItems} />}
            {isOwnerOrAdmin && teams.length < MAX_TEAMS && (
              <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nova Equipe
              </Button>
            )}
            {myRole === "owner" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleDeleteTeamClick}
                disabled={checkingProjects}
              >
                {checkingProjects ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Excluir Equipe
              </Button>
            )}
          </div>
        </motion.div>

        {/* Invite form */}
        {isOwnerOrAdmin && (
          <motion.div variants={itemVariants}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Convidar Membro
                </CardTitle>
                <CardDescription>
                  {seatsAvailable > 0
                    ? `${seatsAvailable} seat(s) disponível(is)`
                    : "Limite de seats atingido"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@exemplo.com"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                    disabled={seatsAvailable <= 0}
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!inviteEmail.trim() || seatsAvailable <= 0 || inviting}
                    onClick={async () => {
                      setInviting(true);
                      const ok = await inviteMember(inviteEmail.trim(), inviteRole);
                      setInviting(false);
                      if (ok) { toast.success(`Convite enviado para ${inviteEmail}`); setInviteEmail(""); }
                      else toast.error("Erro ao enviar convite");
                    }}
                  >
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Members list */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Membros ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((m) => {
                const profile = profiles[m.user_id];
                const memberName = profile?.display_name || m.user_id.slice(0, 8);

                return (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <MemberCard
                        member={m}
                        profile={profile}
                        isMe={m.user_id === user?.id}
                        isOwnerOrAdmin={isOwnerOrAdmin}
                        onUpdateRole={updateMemberRole}
                        onRemove={(id) => setRemovingMember({ id, name: memberName })}
                        onUpdateProfile={updateMyProfile}
                        onUploadAvatar={uploadAvatar}
                      />
                    </div>
                    {/* Transfer button */}
                    {isOwnerOrAdmin && m.role !== "owner" && m.user_id !== user?.id && otherTeams.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                        title="Transferir para outra equipe"
                        onClick={() => setTransferring({ id: m.id, name: memberName })}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending invites */}
        <AnimatePresence>
          {invites.length > 0 && (
            <motion.div variants={itemVariants} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Convites Pendentes ({invites.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {invites.map((inv) => (
                    <motion.div
                      key={inv.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50"
                    >
                      <div>
                        <p className="text-sm text-foreground">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Role: {inv.role} · Expira em {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {isOwnerOrAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => cancelInvite(inv.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Create new team dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
            <DialogDescription>
              Você pode ter até {MAX_TEAMS} equipes. ({teams.length}/{MAX_TEAMS} criadas)
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Nome da equipe"
            value={newTeamDialogName}
            onChange={(e) => setNewTeamDialogName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button
              disabled={!newTeamDialogName.trim() || creatingNew}
              onClick={async () => {
                setCreatingNew(true);
                const result = await createTeam(newTeamDialogName.trim());
                setCreatingNew(false);
                if (result) {
                  toast.success("Equipe criada!");
                  setShowCreateDialog(false);
                  setNewTeamDialogName("");
                } else {
                  toast.error("Erro ao criar equipe");
                }
              }}
            >
              {creatingNew && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove member confirmation */}
      <AlertDialog open={!!removingMember} onOpenChange={(open) => !open && setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{removingMember?.name}</strong> da equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer member dialog */}
      <Dialog open={!!transferring} onOpenChange={(open) => { if (!open) { setTransferring(null); setTransferTarget(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Membro</DialogTitle>
            <DialogDescription>
              Transferir <strong>{transferring?.name}</strong> para outra equipe.
            </DialogDescription>
          </DialogHeader>
          <Select value={transferTarget} onValueChange={setTransferTarget}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a equipe destino" />
            </SelectTrigger>
            <SelectContent>
              {otherTeams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransferring(null); setTransferTarget(""); }}>
              Cancelar
            </Button>
            <Button disabled={!transferTarget} onClick={handleConfirmTransfer}>
              <ArrowRightLeft className="h-4 w-4 mr-2" /> Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete team confirmation */}
      <AlertDialog open={showDeleteTeam} onOpenChange={setShowDeleteTeam}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {teamProjectsCount && teamProjectsCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              ) : (
                <Trash2 className="h-5 w-5 text-destructive" />
              )}
              Excluir equipe "{team.name}"
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {teamProjectsCount && teamProjectsCount > 0 ? (
                  <>
                    <p>
                      Esta equipe possui <strong>{teamProjectsCount} projeto(s) ativo(s)</strong>.
                      Não é possível excluí-la enquanto houver projetos vinculados.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Remova ou transfira todos os projetos antes de excluir a equipe.
                    </p>
                  </>
                ) : (
                  <p>
                    Esta ação é irreversível. Todos os membros serão removidos e os convites pendentes cancelados.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {(!teamProjectsCount || teamProjectsCount === 0) && (
              <AlertDialogAction
                onClick={handleConfirmDeleteTeam}
                disabled={deletingTeam}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingTeam && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Trash2 className="h-4 w-4 mr-2" /> Excluir Equipe
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
