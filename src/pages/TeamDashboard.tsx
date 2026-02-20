import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, BookOpen, ClipboardCheck, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MemberStat {
  user_id: string;
  total_generations: number;
  last_generation_at: string | null;
  reviews_submitted: number;
  reviews_approved: number;
  reviews_rejected: number;
  library_items: number;
  role: string;
}

export default function TeamDashboard() {
  const { user } = useAuth();
  const { team, members, myRole, loading: teamLoading } = useTeam();
  const navigate = useNavigate();
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [loading, setLoading] = useState(true);

  const canView = myRole === "owner" || myRole === "admin";

  useEffect(() => {
    if (!team || !canView) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);

      // Fetch generation stats, review stats, library stats in parallel
      const [genRes, reviewRes, libRes] = await Promise.all([
        supabase.rpc("get_team_member_stats", { _team_id: team.id }),
        supabase.from("review_requests").select("requested_by, status").eq("team_id", team.id),
        supabase.from("shared_library").select("created_by").eq("team_id", team.id),
      ]);

      const genMap = new Map<string, { total_generations: number; last_generation_at: string | null }>();
      if (genRes.data) {
        for (const row of genRes.data as any[]) {
          genMap.set(row.user_id, { total_generations: Number(row.total_generations), last_generation_at: row.last_generation_at });
        }
      }

      const reviewMap = new Map<string, { submitted: number; approved: number; rejected: number }>();
      if (reviewRes.data) {
        for (const r of reviewRes.data) {
          const prev = reviewMap.get(r.requested_by) || { submitted: 0, approved: 0, rejected: 0 };
          prev.submitted++;
          if (r.status === "approved") prev.approved++;
          if (r.status === "rejected") prev.rejected++;
          reviewMap.set(r.requested_by, prev);
        }
      }

      const libMap = new Map<string, number>();
      if (libRes.data) {
        for (const l of libRes.data) {
          libMap.set(l.created_by, (libMap.get(l.created_by) || 0) + 1);
        }
      }

      const merged: MemberStat[] = members.map((m) => {
        const gen = genMap.get(m.user_id) || { total_generations: 0, last_generation_at: null };
        const rev = reviewMap.get(m.user_id) || { submitted: 0, approved: 0, rejected: 0 };
        return {
          user_id: m.user_id,
          total_generations: gen.total_generations,
          last_generation_at: gen.last_generation_at,
          reviews_submitted: rev.submitted,
          reviews_approved: rev.approved,
          reviews_rejected: rev.rejected,
          library_items: libMap.get(m.user_id) || 0,
          role: m.role,
        };
      });

      // Sort by total_generations desc
      merged.sort((a, b) => b.total_generations - a.total_generations);
      setStats(merged);
      setLoading(false);
    };

    load();
  }, [team, members, canView]);

  // Totals
  const totalGenerations = stats.reduce((s, m) => s + m.total_generations, 0);
  const totalReviews = stats.reduce((s, m) => s + m.reviews_submitted, 0);
  const totalLibrary = stats.reduce((s, m) => s + m.library_items, 0);
  const totalApproved = stats.reduce((s, m) => s + m.reviews_approved, 0);

  if (teamLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!team || !canView) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground">Acesso restrito a owners e admins da equipe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Dashboard da Equipe</h1>
          <p className="text-sm text-muted-foreground">Métricas de produtividade de {team.name}</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="premium-card">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Membros</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{stats.length}</p></CardContent>
          </Card>
          <Card className="premium-card">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Gerações</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{totalGenerations}</p></CardContent>
          </Card>
          <Card className="premium-card">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" /> Revisões</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{totalReviews}</p><p className="text-xs text-muted-foreground">{totalApproved} aprovadas</p></CardContent>
          </Card>
          <Card className="premium-card">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Biblioteca</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-foreground">{totalLibrary}</p></CardContent>
          </Card>
        </div>

        {/* Per-member table */}
        <div className="premium-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Produtividade por membro</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">Membro</th>
                  <th className="text-center p-4 font-medium">Papel</th>
                  <th className="text-center p-4 font-medium">Gerações</th>
                  <th className="text-center p-4 font-medium">Revisões</th>
                  <th className="text-center p-4 font-medium">Aprovadas</th>
                  <th className="text-center p-4 font-medium">Biblioteca</th>
                  <th className="text-center p-4 font-medium">Última atividade</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((m) => (
                  <tr key={m.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-foreground/70">{m.user_id.slice(0, 8)}...</td>
                    <td className="p-4 text-center">
                      <Badge variant={m.role === "owner" ? "default" : "secondary"} className="text-xs">{m.role}</Badge>
                    </td>
                    <td className="p-4 text-center font-semibold text-foreground">{m.total_generations}</td>
                    <td className="p-4 text-center text-foreground">{m.reviews_submitted}</td>
                    <td className="p-4 text-center text-foreground">{m.reviews_approved}</td>
                    <td className="p-4 text-center text-foreground">{m.library_items}</td>
                    <td className="p-4 text-center text-xs text-muted-foreground">
                      {m.last_generation_at ? new Date(m.last_generation_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
