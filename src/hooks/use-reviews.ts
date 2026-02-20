import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { toast } from "sonner";

export interface ReviewRequest {
  id: string;
  team_id: string;
  requested_by: string;
  reviewer_id: string | null;
  generation_id: string | null;
  title: string;
  content: string;
  agent_name: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export function useReviews() {
  const { user } = useAuth();
  const { team } = useTeam();
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!team) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("review_requests")
      .select("*")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); }
    setReviews((data as ReviewRequest[]) || []);
    setLoading(false);
  }, [team]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const createReview = async (title: string, content: string, agentName?: string) => {
    if (!user || !team) return;
    const { error } = await supabase.from("review_requests").insert({
      team_id: team.id,
      requested_by: user.id,
      title,
      content,
      agent_name: agentName || null,
    });
    if (error) { toast.error("Erro ao enviar para revisão"); return; }
    toast.success("Enviado para revisão!");
    fetchReviews();
  };

  const updateStatus = async (reviewId: string, status: "approved" | "rejected") => {
    if (!user) return;
    const { error } = await supabase
      .from("review_requests")
      .update({ status, reviewer_id: user.id, resolved_at: new Date().toISOString() })
      .eq("id", reviewId);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    toast.success(status === "approved" ? "Aprovado!" : "Rejeitado");
    fetchReviews();
  };

  const fetchComments = async (reviewId: string): Promise<ReviewComment[]> => {
    const { data } = await supabase
      .from("review_comments")
      .select("*")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });
    return (data as ReviewComment[]) || [];
  };

  const addComment = async (reviewId: string, content: string) => {
    if (!user) return;
    const { error } = await supabase.from("review_comments").insert({
      review_id: reviewId,
      author_id: user.id,
      content,
    });
    if (error) { toast.error("Erro ao comentar"); return; }
    toast.success("Comentário adicionado");
  };

  return { reviews, loading, createReview, updateStatus, fetchComments, addComment, refetch: fetchReviews };
}
