import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTeamMessages, TeamMessage } from "@/hooks/use-team-messages";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useProfiles } from "@/hooks/use-profiles";
import { cn } from "@/lib/utils";
import { Send, Trash2, Pin, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Renders message content with highlighted @mentions
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(@\w[\w\s]*?\b)/g);
  return (
    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="text-primary font-medium bg-primary/10 rounded px-0.5">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export function TeamChat() {
  const { user } = useAuth();
  const { team, members, isOwnerOrAdmin } = useTeam();
  const memberUserIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const { profiles } = useProfiles(memberUserIds);
  const { messages, loading, sendMessage, deleteMessage, pinMessage } = useTeamMessages(team?.id);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  // Build member names list for autocomplete
  const memberNames = useMemo(() => {
    return members.map((m) => {
      const p = profiles[m.user_id];
      return {
        userId: m.user_id,
        name: p?.display_name || m.user_id.slice(0, 8),
        avatar: p?.avatar_url || undefined,
      };
    });
  }, [members, profiles]);

  // Filtered suggestions
  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return memberNames.filter(
      (m) => m.name.toLowerCase().includes(q) && m.userId !== user?.id
    );
  }, [mentionQuery, memberNames, user?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset mention index when suggestions change
  useEffect(() => {
    setMentionIndex(0);
  }, [suggestions.length]);

  const detectMention = useCallback((value: string, cursor: number) => {
    // Look backwards from cursor to find @
    const before = value.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  }, []);

  const insertMention = useCallback(
    (name: string) => {
      const before = input.slice(0, cursorPos);
      const after = input.slice(cursorPos);
      const mentionStart = before.lastIndexOf("@");
      const newValue = before.slice(0, mentionStart) + `@${name} ` + after;
      setInput(newValue);
      setMentionQuery(null);
      inputRef.current?.focus();
    },
    [input, cursorPos]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setInput(val);
    setCursorPos(cursor);
    detectMention(val, cursor);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const ok = await sendMessage(input);
    setSending(false);
    if (ok) {
      setInput("");
      setMentionQuery(null);
    } else {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If autocomplete is open, handle navigation
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[mentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

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
                  <MessageContent content={msg.content} />
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
      <div className="px-3 py-2 border-t border-border/30 relative">
        {/* Mention autocomplete popup */}
        {mentionQuery !== null && suggestions.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {suggestions.map((s, i) => (
              <button
                key={s.userId}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(s.name);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                  i === mentionIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-foreground"
                )}
              >
                <Avatar className="h-5 w-5">
                  {s.avatar && <AvatarImage src={s.avatar} alt={s.name} />}
                  <AvatarFallback className="text-[9px] bg-secondary text-secondary-foreground">
                    {s.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              const cursor = (e.target as HTMLInputElement).selectionStart || 0;
              setCursorPos(cursor);
              detectMention(input, cursor);
            }}
            placeholder="Mensagem... use @ para mencionar"
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
