import { useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Activity, Zap, Bot, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Generation {
  id: string;
  agent_id: string;
  agent_name: string;
  provider: string;
  created_at: string;
}

const COLORS = [
  "hsl(262, 83%, 65%)",
  "hsl(220, 90%, 56%)",
  "hsl(292, 70%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(45, 90%, 55%)",
  "hsl(15, 80%, 55%)",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [profileCount, setProfileCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("agent_generations")
        .select("id, agent_id, agent_name, provider, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("brand_profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]).then(([genRes, projRes, profRes]) => {
      setGenerations((genRes.data as Generation[]) || []);
      setProjectCount(projRes.count || 0);
      setProfileCount(profRes.count || 0);
      setLoading(false);
    });
  }, [user]);

  // Stats
  const totalGenerations = generations.length;
  const thisWeek = generations.filter(
    (g) => new Date(g.created_at) > subDays(new Date(), 7)
  ).length;
  const today = generations.filter(
    (g) => new Date(g.created_at) > startOfDay(new Date())
  ).length;

  // By agent
  const byAgent = Object.entries(
    generations.reduce<Record<string, { name: string; count: number }>>((acc, g) => {
      if (!acc[g.agent_id]) acc[g.agent_id] = { name: g.agent_name, count: 0 };
      acc[g.agent_id].count++;
      return acc;
    }, {})
  )
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // By provider
  const byProvider = Object.entries(
    generations.reduce<Record<string, number>>((acc, g) => {
      acc[g.provider] = (acc[g.provider] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Timeline (last 14 days)
  const timeline = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayStr = format(date, "yyyy-MM-dd");
    const label = format(date, "dd/MM");
    const count = generations.filter(
      (g) => format(new Date(g.created_at), "yyyy-MM-dd") === dayStr
    ).length;
    return { label, count };
  });

  const StatCard = ({
    icon: Icon,
    label,
    value,
    accent,
  }: {
    icon: typeof Activity;
    label: string;
    value: number | string;
    accent?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card p-5 flex items-center gap-4"
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent || "hsl(262, 83%, 65%, 0.15)" }}
      >
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className="flex-1 container py-8 px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold gradient-text font-[Space_Grotesk]">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de uso e consumo da plataforma
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground animate-pulse text-sm">Carregando métricas…</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Zap} label="Total de Gerações" value={totalGenerations} />
              <StatCard icon={TrendingUp} label="Últimos 7 dias" value={thisWeek} accent="hsl(220, 90%, 56%, 0.15)" />
              <StatCard icon={Calendar} label="Hoje" value={today} accent="hsl(160, 60%, 45%, 0.15)" />
              <StatCard icon={Bot} label="Agentes Usados" value={byAgent.length} accent="hsl(292, 70%, 50%, 0.15)" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="premium-card p-5 lg:col-span-2"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">Gerações — Últimos 14 dias</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262, 83%, 65%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(262, 83%, 65%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(228, 14%, 11%)",
                        border: "1px solid hsl(228, 12%, 18%)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "hsl(210, 20%, 92%)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(262, 83%, 65%)"
                      strokeWidth={2}
                      fill="url(#areaGrad)"
                      name="Gerações"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Provider Pie */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="premium-card p-5"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">Por Provider</h3>
                {byProvider.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={byProvider}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {byProvider.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(228, 14%, 11%)",
                            border: "1px solid hsl(228, 12%, 18%)",
                            borderRadius: 8,
                            fontSize: 12,
                            color: "hsl(210, 20%, 92%)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2">
                      {byProvider.map((p, i) => (
                        <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: COLORS[i % COLORS.length] }}
                          />
                          {p.name} ({p.value})
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
                )}
              </motion.div>
            </div>

            {/* Top Agents Bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="premium-card p-5"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">Top Agentes Mais Usados</h3>
              {byAgent.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byAgent} layout="vertical" margin={{ left: 10 }}>
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "hsl(210, 20%, 85%)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={180}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(228, 14%, 11%)",
                        border: "1px solid hsl(228, 12%, 18%)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "hsl(210, 20%, 92%)",
                      }}
                    />
                    <Bar dataKey="count" name="Gerações" radius={[0, 6, 6, 0]}>
                      {byAgent.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Nenhuma geração ainda. Use os agentes para ver estatísticas aqui.
                </p>
              )}
            </motion.div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="premium-card p-5 text-center">
                <p className="text-2xl font-bold text-foreground">{projectCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Projetos Criados</p>
              </div>
              <div className="premium-card p-5 text-center">
                <p className="text-2xl font-bold text-foreground">{profileCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Perfis de DNA</p>
              </div>
              <div className="premium-card p-5 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {byAgent.length > 0 ? byAgent[0].name : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Agente Favorito</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
