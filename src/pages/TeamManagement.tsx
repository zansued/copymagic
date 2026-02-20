import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import { Users, UserPlus, Loader2, X } from "lucide-react";
import { AnimatedTooltip, type TooltipItem } from "@/components/ui/animated-tooltip";
import { MemberCard } from "@/components/team/MemberCard";


export default function TeamManagement() {
  const { user } = useAuth();
  const { team, members, invites, myRole, loading, isOwnerOrAdmin, createTeam, inviteMember, cancelInvite, removeMember, updateMemberRole } = useTeam();
  const { subscription } = useSubscription();
  const memberUserIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const { profiles, updateMyProfile, uploadAvatar } = useProfiles(memberUserIds);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isAgency = subscription?.plan === "agency" || subscription?.plan === "lifetime";

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
          <Button onClick={() => window.location.href = "/pricing"} className="mt-4">
            Ver Planos
          </Button>
        </div>
      </div>
    );
  }

  // No team yet — create one
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
                  if (result) {
                    toast.success("Equipe criada com sucesso!");
                  } else {
                    toast.error("Erro ao criar equipe");
                  }
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
    owner: "Owner",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
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

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                {team.name}
              </h1>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {team.plan.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {seatsUsed} / {team.seats_limit} seats utilizados
            </p>
          </div>
          {tooltipItems.length > 0 && (
            <AnimatedTooltip items={tooltipItems} />
          )}
        </div>

        {/* Invite form */}
        {isOwnerOrAdmin && (
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
                    if (ok) {
                      toast.success(`Convite enviado para ${inviteEmail}`);
                      setInviteEmail("");
                    } else {
                      toast.error("Erro ao enviar convite");
                    }
                  }}
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members list */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Membros ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                profile={profiles[m.user_id]}
                isMe={m.user_id === user?.id}
                isOwnerOrAdmin={isOwnerOrAdmin}
                onUpdateRole={updateMemberRole}
                onRemove={removeMember}
                onUpdateProfile={updateMyProfile}
                onUploadAvatar={uploadAvatar}
              />
            ))}
          </CardContent>
        </Card>

        {/* Pending invites */}
        {invites.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Convites Pendentes ({invites.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
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
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
