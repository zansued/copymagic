import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, DollarSign, BarChart3, Crown, Building2, Sparkles, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNav } from "@/components/TopNav";
import { useAdmin } from "@/hooks/use-admin";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AdminUser {
  user_id: string;
  email: string;
  registered_at: string;
  last_sign_in_at: string | null;
  plan: string;
  subscription_status: string;
  generations_used: number;
  generations_limit: number;
  mp_subscription_id: string | null;
  mp_payer_email: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface Metrics {
  total_users: number;
  total_pro: number;
  total_agency: number;
  total_free: number;
  total_generations: number;
  mrr: number;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 100,
  agency: 999999,
  lifetime: 999999,
};

export default function AdminPanel() {
  const { isAdmin, loading: adminLoading, adminFetch } = useAdmin();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) return;

    Promise.all([
      adminFetch("users"),
      adminFetch("metrics"),
    ]).then(([usersData, metricsData]) => {
      setUsers(usersData || []);
      setMetrics(metricsData || null);
      setLoadingData(false);
    }).catch((err) => {
      toast.error(err.message);
      setLoadingData(false);
    });
  }, [isAdmin, adminLoading, adminFetch]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 text-destructive mx-auto opacity-50" />
            <p className="text-muted-foreground">Acesso restrito a administradores.</p>
            <Button variant="outline" onClick={() => navigate("/")}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  const handlePlanChange = async (userId: string, newPlan: string) => {
    setUpdatingUser(userId);
    try {
      await adminFetch("update-plan", "POST", {
        target_user_id: userId,
        plan: newPlan,
        generations_limit: PLAN_LIMITS[newPlan] || 5,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? { ...u, plan: newPlan, generations_limit: PLAN_LIMITS[newPlan] || 5, generations_used: 0 }
            : u
        )
      );
      toast.success("Plano atualizado!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.plan?.toLowerCase().includes(search.toLowerCase())
  );

  const planIcon = (plan: string) => {
    if (plan === "agency") return <Building2 className="h-3.5 w-3.5" />;
    if (plan === "pro") return <Crown className="h-3.5 w-3.5" />;
    if (plan === "lifetime") return <Shield className="h-3.5 w-3.5" />;
    if (plan === "starter") return <BarChart3 className="h-3.5 w-3.5" />;
    return <Sparkles className="h-3.5 w-3.5" />;
  };

  const planColor = (plan: string) => {
    if (plan === "agency") return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    if (plan === "pro") return "text-violet-400 bg-violet-400/10 border-violet-400/20";
    if (plan === "lifetime") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (plan === "starter") return "text-sky-400 bg-sky-400/10 border-sky-400/20";
    return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 container py-8 px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold gradient-text font-[Space_Grotesk]">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie usuários, planos e métricas da plataforma.</p>
        </motion.div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Usuários", value: metrics.total_users, icon: Users, color: "text-blue-400" },
              { label: "MRR", value: `R$ ${metrics.mrr}`, icon: DollarSign, color: "text-green-400" },
              { label: "Plano Pro", value: metrics.total_pro, icon: Crown, color: "text-primary" },
              { label: "Plano Agency", value: metrics.total_agency, icon: Building2, color: "text-amber-400" },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="premium-card p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{m.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Secondary Metrics */}
        {metrics && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="premium-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Free</p>
              <p className="text-xl font-bold text-foreground">{metrics.total_free}</p>
            </div>
            <div className="premium-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Gerações</p>
              <p className="text-xl font-bold text-foreground">{metrics.total_generations}</p>
            </div>
            <div className="premium-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Taxa Conversão</p>
              <p className="text-xl font-bold text-foreground">
                {metrics.total_users > 0
                  ? `${(((metrics.total_pro + metrics.total_agency) / metrics.total_users) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="premium-card"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Usuários ({filteredUsers.length})
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar email ou plano..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Plano</th>
                    <th className="text-center p-3">Gerações</th>
                    <th className="text-left p-3">Cadastro</th>
                    <th className="text-left p-3">Último Acesso</th>
                    <th className="text-center p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-foreground text-xs">{u.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${planColor(u.plan)}`}>
                          {planIcon(u.plan)}
                          {u.plan}
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {u.generations_used}/{u.generations_limit >= 999999 ? "∞" : u.generations_limit}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(u.registered_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <Select
                          value={u.plan}
                          onValueChange={(v) => handlePlanChange(u.user_id, v)}
                          disabled={updatingUser === u.user_id}
                        >
                          <SelectTrigger className="h-7 text-xs w-28 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="agency">Agency</SelectItem>
                            <SelectItem value="lifetime">Vitalício</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
