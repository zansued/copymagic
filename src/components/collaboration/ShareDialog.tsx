import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Mail, Copy, UserPlus, Loader2, Trash2, Link2 } from "lucide-react";

type ShareType = "project" | "generation";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceName: string;
  type: ShareType;
}

interface ShareEntry {
  id: string;
  shared_with_email: string;
  permission?: string;
  status?: string;
  is_public?: boolean;
  share_token?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  resourceId,
  resourceName,
  type,
}: ShareDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [fetched, setFetched] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const fetchShares = async () => {
    if (!user || fetched) return;
    if (type === "project") {
      const { data } = await supabase
        .from("project_shares")
        .select("id, shared_with_email, permission, status")
        .eq("project_id", resourceId)
        .eq("owner_id", user.id);
      setShares((data as ShareEntry[]) || []);
    } else {
      const { data } = await supabase
        .from("generation_shares")
        .select("id, shared_with_email, is_public, share_token")
        .eq("generation_id", resourceId)
        .eq("owner_id", user.id);
      setShares((data as ShareEntry[]) || []);
      const pub = data?.find((d: any) => d.is_public);
      if (pub) {
        setPublicLink(`${window.location.origin}/shared/${pub.share_token}`);
      }
    }
    setFetched(true);
  };

  const handleOpen = (v: boolean) => {
    onOpenChange(v);
    if (v) {
      fetchShares();
    } else {
      setFetched(false);
      setShares([]);
      setPublicLink(null);
      setEmail("");
    }
  };

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    setLoading(true);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("agent_configs")
      .select("user_id")
      .eq("user_id", email)
      .maybeSingle();

    if (type === "project") {
      const { error } = await supabase.from("project_shares").insert({
        project_id: resourceId,
        owner_id: user.id,
        shared_with_email: email.trim().toLowerCase(),
        permission,
        status: "pending",
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Este email já foi convidado");
        } else {
          toast.error("Erro ao compartilhar");
        }
      } else {
        toast.success(`Convite enviado para ${email}`);
        setShares((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            shared_with_email: email.trim().toLowerCase(),
            permission,
            status: "pending",
          },
        ]);
        setEmail("");
      }
    } else {
      const { error } = await supabase.from("generation_shares").insert({
        generation_id: resourceId,
        owner_id: user.id,
        shared_with_email: email.trim().toLowerCase(),
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Este email já foi convidado");
        } else {
          toast.error("Erro ao compartilhar");
        }
      } else {
        toast.success(`Convite enviado para ${email}`);
        setShares((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            shared_with_email: email.trim().toLowerCase(),
          },
        ]);
        setEmail("");
      }
    }
    setLoading(false);
  };

  const handleCreatePublicLink = async () => {
    if (!user || type !== "generation") return;
    setLoading(true);
    const { data, error } = await supabase
      .from("generation_shares")
      .insert({
        generation_id: resourceId,
        owner_id: user.id,
        is_public: true,
      })
      .select("share_token")
      .single();
    if (error) {
      toast.error("Erro ao gerar link");
    } else {
      const link = `${window.location.origin}/shared/${data.share_token}`;
      setPublicLink(link);
      navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    }
    setLoading(false);
  };

  const handleRemoveShare = async (shareId: string) => {
    const table = type === "project" ? "project_shares" : "generation_shares";
    await supabase.from(table).delete().eq("id", shareId);
    setShares((prev) => prev.filter((s) => s.id !== shareId));
    toast.success("Acesso removido");
  };

  const copyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      toast.success("Link copiado!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Compartilhar
          </DialogTitle>
          <DialogDescription className="truncate">
            {resourceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite by email */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            {type === "project" && (
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleInvite} disabled={loading || !email.trim()} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convidar"}
            </Button>
          </div>

          {/* Public link for generation outputs */}
          {type === "generation" && (
            <div className="space-y-2">
              {publicLink ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
                  <Link2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">{publicLink}</span>
                  <Button variant="ghost" size="sm" onClick={copyLink} className="h-7 gap-1 text-xs">
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleCreatePublicLink}
                  disabled={loading}
                >
                  <Link2 className="h-4 w-4" />
                  Gerar link público
                </Button>
              )}
            </div>
          )}

          {/* Existing shares */}
          {shares.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Compartilhado com</p>
              {shares
                .filter((s) => s.shared_with_email)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {s.shared_with_email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate">{s.shared_with_email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.status === "pending" ? "Pendente" : s.status === "accepted" ? "Aceito" : s.permission || "Viewer"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveShare(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
