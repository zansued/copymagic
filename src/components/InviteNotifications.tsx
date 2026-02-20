import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, X, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeamInvites, PendingInvite } from "@/hooks/use-team-invites";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function InviteNotifications() {
  const { invites, acceptInvite, rejectInvite } = useTeamInvites();
  const [open, setOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    const ok = await acceptInvite(invite);
    setProcessingId(null);
    if (ok) {
      toast.success(`Você entrou na equipe ${invite.team_name}!`);
    } else {
      toast.error("Erro ao aceitar convite");
    }
  };

  const handleReject = async (invite: PendingInvite) => {
    setProcessingId(invite.id);
    const ok = await rejectInvite(invite.id);
    setProcessingId(null);
    if (ok) {
      toast.success("Convite recusado");
    } else {
      toast.error("Erro ao recusar convite");
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title="Convites pendentes"
      >
        <Bell className="h-3.5 w-3.5" />
        {/* Badge */}
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {invites.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-sm font-semibold text-foreground">
                  Convites de Equipe
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {invites.length} {invites.length === 1 ? "convite pendente" : "convites pendentes"}
                </p>
              </div>

              {/* Invites list */}
              <div className="max-h-80 overflow-y-auto">
                {invites.map((invite) => {
                  const isProcessing = processingId === invite.id;
                  const timeAgo = formatDistanceToNow(new Date(invite.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  });

                  return (
                    <div
                      key={invite.id}
                      className={cn(
                        "px-4 py-3 border-b border-border/20 last:border-b-0 transition-opacity",
                        isProcessing && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <UsersRound className="h-4 w-4 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            Convite para{" "}
                            <span className="font-semibold">
                              {invite.team_name}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Como{" "}
                            <span className="capitalize font-medium text-muted-foreground">
                              {invite.role}
                            </span>{" "}
                            · {timeAgo}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleReject(invite)}
                            disabled={isProcessing}
                            className="rounded-lg flex items-center justify-center h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Recusar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAccept(invite)}
                            disabled={isProcessing}
                            className="rounded-lg flex items-center justify-center h-8 w-8 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors"
                            title="Aceitar"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
