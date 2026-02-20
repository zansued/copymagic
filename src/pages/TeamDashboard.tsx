import { useState, useEffect, useMemo } from "react";
import * as React from "react";
import { TopNav } from "@/components/TopNav";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles } from "@/hooks/use-profiles";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, Sparkles, ClipboardCheck, BookOpen, TrendingUp,
  ArrowRight, Zap, Crown, ShieldCheck, Pencil, Eye, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// ── Animated number ──
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) =>
    decimals > 0 ? (Math.round(v * 10) / 10).toFixed(decimals) : Math.round(v).toString()
  );

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{display}</motion.span>;
}

// ── Role config ──
const roleConfig: Record<string, { label: string; icon: React.ElementType; gradient: string }> = {
  owner: { label: "Owner", icon: Crown, gradient: "from-amber-500 to-yellow-400" },
  admin: { label: "Admin", icon: ShieldCheck, gradient: "from-primary to-violet-400" },
  editor: { label: "Editor", icon: Pencil, gradient: "from-blue-500 to-cyan-400" },
  viewer: { label: "Viewer", icon: Eye, gradient: "from-muted-foreground to-muted" },
};

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

// ── Variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};
const hoverSpring = { type: "spring" as const, stiffness: 300, damping: 15 };

export default function TeamDashboard() {
  const { user } = useAuth();
  const { team, members, myRole, loading: teamLoading } = useTeam();
  const navigate = useNavigate();
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [loading, setLoading] = useState(true);

  const memberUserIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const { profiles } = useProfiles(memberUserIds);

  const canView = myRole === "owner" || myRole === "admin";

  useEffect(() => {
    if (!team || !canView) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
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

      merged.sort((a, b) => b.total_generations - a.total_generations);
      setStats(merged);
      setLoading(false);
    };

    load();
  }, [team, members, canView]);

  const totalGenerations = stats.reduce((s, m) => s + m.total_generations, 0);
  const totalReviews = stats.reduce((s, m) => s + m.reviews_submitted, 0);
  const totalLibrary = stats.reduce((s, m) => s + m.library_items, 0);
  const totalApproved = stats.reduce((s, m) => s + m.reviews_approved, 0);

  if (teamLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
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

  // Activity breakdown for progress bar
  const activityTotal = totalGenerations + totalReviews + totalLibrary || 1;
  const activityStats = [
    { label: "Gerações", value: (totalGenerations / activityTotal) * 100, colorClass: "bg-primary" },
    { label: "Revisões", value: (totalReviews / activityTotal) * 100, colorClass: "bg-blue-500" },
    { label: "Biblioteca", value: (totalLibrary / activityTotal) * 100, colorClass: "bg-emerald-500" },
  ];

  const getName = (userId: string) => profiles[userId]?.display_name || userId.slice(0, 8) + "...";
  const getAvatar = (userId: string) => profiles[userId]?.avatar_url || undefined;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <motion.div
        className="max-w-6xl mx-auto px-6 py-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Dashboard da Equipe</h1>
            <p className="text-sm text-muted-foreground mt-1">Métricas de produtividade de {team.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/team")}>
            <Users className="h-4 w-4 mr-2" /> Gerenciar
          </Button>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Membros", value: stats.length, accent: "text-primary" },
            { icon: Sparkles, label: "Gerações", value: totalGenerations, accent: "text-amber-400" },
            { icon: ClipboardCheck, label: "Revisões", value: totalReviews, sub: `${totalApproved} aprovadas`, accent: "text-blue-400" },
            { icon: BookOpen, label: "Biblioteca", value: totalLibrary, accent: "text-emerald-400" },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={hoverSpring}
            >
              <Card className="border-border bg-card overflow-hidden relative group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <card.icon className={cn("h-4 w-4", card.accent)} />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    <AnimatedNumber value={card.value} />
                  </p>
                  {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
                </CardContent>
                {/* Glow on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                  "bg-gradient-to-br from-primary/5 to-transparent"
                )} />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Activity breakdown + Team members row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Activity card */}
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -3 }} transition={hoverSpring}>
            <Card className="h-full border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium text-muted-foreground text-sm">Atividade Total</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-4">
                  <AnimatedNumber value={totalGenerations + totalReviews + totalLibrary} />
                  <span className="ml-2 text-base font-normal text-muted-foreground">ações</span>
                </p>
                {/* Animated progress bar */}
                <div className="w-full h-2.5 rounded-full bg-muted flex overflow-hidden mb-3">
                  {activityStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      className={cn("h-full", stat.colorClass)}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.15, ease: "easeOut" }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {activityStats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", stat.colorClass)} />
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Team members card */}
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -3 }} transition={hoverSpring}>
            <Card className="h-full border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium text-primary text-sm">Equipe</p>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-6">
                  <AnimatedNumber value={stats.length} />
                  <span className="ml-2 text-base font-normal text-muted-foreground">membros</span>
                </p>
                {/* Avatar stack */}
                <div className="flex -space-x-2">
                  {stats.slice(0, 6).map((m, index) => {
                    const rc = roleConfig[m.role] || roleConfig.viewer;
                    return (
                      <motion.div
                        key={m.user_id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                        whileHover={{ scale: 1.2, zIndex: 10, y: -4 }}
                        className="relative"
                      >
                        <Avatar className="border-2 border-background h-10 w-10">
                          <AvatarImage src={getAvatar(m.user_id)} alt={getName(m.user_id)} />
                          <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs font-bold", rc.gradient)}>
                            {getName(m.user_id).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    );
                  })}
                  {stats.length > 6 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.4 }}
                      className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold text-muted-foreground"
                    >
                      +{stats.length - 6}
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA Banner */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} transition={hoverSpring}>
          <div className="flex items-center justify-between p-5 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-background border border-border">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Potencialize sua equipe com os agentes de IA
              </p>
            </div>
            <Button onClick={() => navigate("/agents")} size="sm">
              Explorar Agentes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Per-member table */}
        <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Produtividade por membro
            </h2>
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
                {stats.map((m, i) => {
                  const rc = roleConfig[m.role] || roleConfig.viewer;
                  const RoleIcon = rc.icon;
                  const maxGen = Math.max(...stats.map((s) => s.total_generations), 1);
                  const barWidth = (m.total_generations / maxGen) * 100;

                  return (
                    <motion.tr
                      key={m.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getAvatar(m.user_id)} />
                            <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs font-bold", rc.gradient)}>
                              {getName(m.user_id).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{getName(m.user_id)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="text-xs gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {rc.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground w-8 text-right">{m.total_generations}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-foreground">{m.reviews_submitted}</td>
                      <td className="p-4 text-center text-foreground">{m.reviews_approved}</td>
                      <td className="p-4 text-center text-foreground">{m.library_items}</td>
                      <td className="p-4 text-center text-xs text-muted-foreground">
                        {m.last_generation_at ? new Date(m.last_generation_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
