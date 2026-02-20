import { useState, useRef, useEffect } from "react";
import { useTeamMessages, TeamMessage } from "@/hooks/use-team-messages";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { cn } from "@/lib/utils";
import { Send, Trash2, Pin, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function TeamChat() {
  const { user } = useAuth();
  const { team, isOwnerOrAdmin } = useTeam();
  const { messages, loading, sendMessage, deleteMessage, pinMessage } = useTeamMessages(team?.id);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const ok = await sendMessage(input);
    setSending(false);
    if (ok) {
      setInput("");
    } else {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteMessage(id);
    if (!ok) toast.error("Erro ao excluir");
  };

  const handlePin = async (msg: TeamMessage) => {
    const ok = await pinMessage(msg.id, !msg.is_pinned);
    if (ok) {
      toast.success(msg.is_pinned ? "Mensagem desafixada" : "Mensagem fixada");
    }
  };

  if (!team) return null;

  // Separate pinned messages
  const pinned = messages.filter((m) => m.is_pinned);
  const regular = messages.filter((m) => !m.is_pinned);

  return (
    <div className="flex flex-col h-full">
      {/* Pinned messages */}
      {pinned.length > 0 && (
        <div className="px-3 py-2 border-b border-border/30 space-y-1.5 bg-primary/5">
          {pinned.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 text-xs">
              <Pin className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{msg.author_name}: </span>
                <span className="text-muted-foreground">{msg.content}</span>
              </div>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => handlePin(msg)}
                  className="text-muted-foreground/50 hover:text-foreground shrink-0"
                >
                  <Pin className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : regular.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Clock className="h-6 w-6 mx-auto text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/50">
              Sem mensagens. As mensagens expiram em 24h.
            </p>
          </div>
        ) : (
          regular.map((msg) => {
            const isMe = msg.author_id === user?.id;
            const canDelete = isMe || isOwnerOrAdmin;
            const timeAgo = formatDistanceToNow(new Date(msg.created_at), {
              addSuffix: true,
              locale: ptBR,
            });

            return (
              <div key={msg.id} className="group flex items-start gap-2.5">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  {msg.author_avatar && (
                    <AvatarImage src={msg.author_avatar} alt={msg.author_name} />
                  )}
                  <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                    {(msg.author_name || "M")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-xs font-semibold",
                      isMe ? "text-primary" : "text-foreground"
                    )}>
                      {msg.author_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">
                      {timeAgo}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => handlePin(msg)}
                      className="p-1 rounded text-muted-foreground/40 hover:text-primary transition-colors"
                      title="Fixar"
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem para a equipe..."
            className="flex-1 bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/30 mt-1 text-center">
          Mensagens expiram em 24h
        </p>
      </div>
    </div>
  );
}
