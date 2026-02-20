import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { useReviews, ReviewComment } from "@/hooks/use-reviews";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, MessageSquare, Plus, Clock, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export default function ReviewApprovals() {
  const { user } = useAuth();
  const { team, myRole } = useTeam();
  const { reviews, loading, createReview, updateStatus, fetchComments, addComment } = useReviews();

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAgent, setNewAgent] = useState("");

  // Comment state
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const canApprove = myRole === "owner" || myRole === "admin";

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await createReview(newTitle.trim(), newContent.trim(), newAgent.trim() || undefined);
    setNewTitle(""); setNewContent(""); setNewAgent(""); setShowNew(false);
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

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground">Crie ou entre em uma equipe para usar o fluxo de aprovações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Aprovações</h1>
            <p className="text-sm text-muted-foreground">Fluxo de revisão e aprovação de copies da equipe</p>
          </div>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova revisão</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Enviar para revisão</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Título da copy" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <Input placeholder="Agente usado (opcional)" value={newAgent} onChange={(e) => setNewAgent(e.target.value)} />
                <Textarea placeholder="Cole o conteúdo da copy aqui..." className="min-h-[200px]" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
                <Button onClick={handleCreate} disabled={!newTitle.trim() || !newContent.trim()} className="w-full">Enviar para revisão</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">Carregando...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma revisão pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => {
              const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
              return (
                <div key={r.id} className="premium-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{r.title}</h3>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {r.agent_name && <Badge variant="secondary" className="text-xs">{r.agent_name}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Comments */}
                      <Dialog onOpenChange={(open) => { if (open) openComments(r.id); else setActiveReviewId(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <MessageSquare className="h-3.5 w-3.5" /> Comentar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>Comentários — {r.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                            {commentsLoading ? (
                              <p className="text-muted-foreground text-sm animate-pulse">Carregando...</p>
                            ) : comments.length === 0 ? (
                              <p className="text-muted-foreground text-sm">Nenhum comentário ainda.</p>
                            ) : (
                              comments.map((c) => (
                                <div key={c.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                                  <p className="text-foreground">{c.content}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString("pt-BR")}</p>
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
                            <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Approve / Reject */}
                      {canApprove && r.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1 text-xs" onClick={() => updateStatus(r.id, "approved")}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive gap-1 text-xs" onClick={() => updateStatus(r.id, "rejected")}>
                            <XCircle className="h-3.5 w-3.5" /> Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content preview */}
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
    </div>
  );
}
