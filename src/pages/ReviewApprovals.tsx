import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { TopNav } from "@/components/TopNav";
import { useReviews, type ReviewRequest, type ReviewComment } from "@/hooks/use-reviews";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Plus,
  Clock,
  Send,
  List,
  Columns3,
  GripVertical,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/ui/kanban";

const COLUMN_CONFIG: Record<string, { label: string; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", color: "border-t-amber-500", badgeVariant: "outline" },
  approved: { label: "Aprovado", color: "border-t-emerald-500", badgeVariant: "default" },
  rejected: { label: "Rejeitado", color: "border-t-destructive", badgeVariant: "destructive" },
};

function ReviewCard({
  review,
  canApprove,
  onApprove,
  onReject,
  onOpenComments,
  showHandle,
}: {
  review: ReviewRequest;
  canApprove: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenComments: (id: string) => void;
  showHandle?: boolean;
}) {
  const st = COLUMN_CONFIG[review.status] || COLUMN_CONFIG.pending;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 group">
      <div className="flex items-start gap-2">
        {showHandle && (
          <KanbanItemHandle>
            <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
          </KanbanItemHandle>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm truncate">{review.title}</h3>
            {review.agent_name && (
              <Badge variant="secondary" className="text-[10px]">
                {review.agent_name}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Content preview */}
      <div className="prose-premium max-w-none text-xs max-h-[100px] overflow-hidden relative">
        <ReactMarkdown>{review.content.slice(0, 300)}</ReactMarkdown>
        {review.content.length > 300 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-[10px] h-7 px-2"
          onClick={() => onOpenComments(review.id)}
        >
          <MessageSquare className="h-3 w-3" /> Comentar
        </Button>
        {canApprove && review.status === "pending" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 gap-1 text-[10px] h-7 px-2"
              onClick={() => onApprove(review.id)}
            >
              <CheckCircle2 className="h-3 w-3" /> Aprovar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive gap-1 text-[10px] h-7 px-2"
              onClick={() => onReject(review.id)}
            >
              <XCircle className="h-3 w-3" /> Rejeitar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReviewApprovals() {
  const { user } = useAuth();
  const { team, myRole } = useTeam();
  const { reviews, loading, createReview, updateStatus, fetchComments, addComment, refetch } = useReviews();

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAgent, setNewAgent] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  // Comment state
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const canApprove = myRole === "owner" || myRole === "admin";

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await createReview(newTitle.trim(), newContent.trim(), newAgent.trim() || undefined);
    setNewTitle("");
    setNewContent("");
    setNewAgent("");
    setShowNew(false);
  };

  const openComments = async (reviewId: string) => {
    setActiveReviewId(reviewId);
    setCommentsLoading(true);
    const data = await fetchComments(reviewId);
    setComments(data);
    setCommentsLoading(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !activeReviewId) return;
    await addComment(activeReviewId, commentText.trim());
    setCommentText("");
    const data = await fetchComments(activeReviewId);
    setComments(data);
  };

  // Kanban columns
  const kanbanColumns = useMemo(() => {
    const cols: Record<string, ReviewRequest[]> = {
      pending: [],
      approved: [],
      rejected: [],
    };
    reviews.forEach((r) => {
      if (cols[r.status]) cols[r.status].push(r);
      else cols.pending.push(r);
    });
    return cols;
  }, [reviews]);

  const handleKanbanMove = async (event: KanbanMoveEvent) => {
    const { activeContainer, overContainer } = event;
    if (activeContainer === overContainer) return;
    if (!canApprove) return;

    // Find the review that was moved
    const review = kanbanColumns[activeContainer]?.find(
      (r) => r.id === String(event.event.active.id)
    );
    if (!review) return;

    if (overContainer === "approved" || overContainer === "rejected") {
      await updateStatus(review.id, overContainer as "approved" | "rejected");
    }
  };

  const activeReview = activeReviewId
    ? reviews.find((r) => r.id === activeReviewId)
    : null;

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground">
            Crie ou entre em uma equipe para usar o fluxo de aprovações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Aprovações</h1>
            <p className="text-sm text-muted-foreground">
              Fluxo de revisão e aprovação de copies da equipe
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "p-2 transition-colors",
                  view === "kanban"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
                title="Kanban"
              >
                <Columns3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-2 transition-colors",
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                )}
                title="Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Dialog open={showNew} onOpenChange={setShowNew}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Nova revisão
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Enviar para revisão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Título da copy"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Agente usado (opcional)"
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value)}
                  />
                  <Textarea
                    placeholder="Cole o conteúdo da copy aqui..."
                    className="min-h-[200px]"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                  <Button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || !newContent.trim()}
                    className="w-full"
                  >
                    Enviar para revisão
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Carregando...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma revisão pendente</p>
          </div>
        ) : view === "kanban" ? (
          /* ── KANBAN VIEW ── */
          <Kanban
            value={kanbanColumns}
            onValueChange={() => {}} // read-only state, moves handled by onMove
            getItemValue={(item: ReviewRequest) => item.id}
            onMove={handleKanbanMove}
          >
            <KanbanBoard className="grid-cols-1 sm:grid-cols-3">
              {Object.entries(COLUMN_CONFIG).map(([status, config]) => (
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
                      <h3 className="font-semibold text-sm text-foreground">
                        {config.label}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {kanbanColumns[status]?.length || 0}
                      </Badge>
                    </div>
                  </div>

                  <KanbanColumnContent
                    value={status}
                    className="min-h-[200px] gap-3"
                  >
                    {(kanbanColumns[status] || []).map((review) => (
                      <KanbanItem
                        key={review.id}
                        value={review.id}
                        disabled={!canApprove}
                      >
                        <ReviewCard
                          review={review}
                          canApprove={canApprove}
                          onApprove={(id) => updateStatus(id, "approved")}
                          onReject={(id) => updateStatus(id, "rejected")}
                          onOpenComments={openComments}
                          showHandle={canApprove}
                        />
                      </KanbanItem>
                    ))}
                  </KanbanColumnContent>
                </KanbanColumn>
              ))}
            </KanbanBoard>

            <KanbanOverlay>
              {({ value }) => {
                const review = reviews.find((r) => r.id === String(value));
                if (!review) return null;
                return (
                  <div className="rounded-lg border border-primary/50 bg-card p-4 shadow-xl rotate-2">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {review.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                );
              }}
            </KanbanOverlay>
          </Kanban>
        ) : (
          /* ── LIST VIEW ── */
          <div className="space-y-4">
            {reviews.map((r) => {
              const st = COLUMN_CONFIG[r.status] || COLUMN_CONFIG.pending;
              return (
                <div key={r.id} className="premium-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {r.title}
                        </h3>
                        <Badge variant={st.badgeVariant}>{st.label}</Badge>
                        {r.agent_name && (
                          <Badge variant="secondary" className="text-xs">
                            {r.agent_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => openComments(r.id)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Comentar
                      </Button>
                      {canApprove && r.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 gap-1 text-xs"
                            onClick={() => updateStatus(r.id, "approved")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive gap-1 text-xs"
                            onClick={() => updateStatus(r.id, "rejected")}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="prose-premium max-w-none text-sm max-h-[200px] overflow-hidden relative">
                    <ReactMarkdown>{r.content.slice(0, 800)}</ReactMarkdown>
                    {r.content.length > 800 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Comments Dialog ── */}
      <Dialog
        open={!!activeReviewId}
        onOpenChange={(open) => {
          if (!open) setActiveReviewId(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Comentários{activeReview ? ` — ${activeReview.title}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {commentsLoading ? (
              <p className="text-muted-foreground text-sm animate-pulse">
                Carregando...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum comentário ainda.
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="text-foreground">{c.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(c.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Escreva um comentário..."
              className="min-h-[60px] text-sm"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button
              size="icon"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
