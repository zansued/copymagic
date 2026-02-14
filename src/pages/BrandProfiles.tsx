import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, ArrowLeft, MoreVertical, Star, Trash2, Copy, Download, FileText, FileJson, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PROFILE_SECTIONS, profileToMarkdown, profileToJSON, profileToPDF } from "@/lib/brand-profile-types";
import type { BrandProfileData } from "@/lib/brand-profile-types";

interface ProfileRow {
  id: string;
  name: string;
  is_default: boolean;
  personality_summary: string;
  audience_summary: string;
  product_summary: string;
  brand_identity: any;
  brand_voice: any;
  target_audience: any;
  product_service: any;
  credentials: any;
  created_at: string;
  updated_at: string;
}

export default function BrandProfiles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const fetchProfiles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    const isFirst = profiles.length === 0;
    const { data, error } = await supabase
      .from("brand_profiles")
      .insert({ user_id: user.id, name: "Novo Perfil", is_default: isFirst })
      .select()
      .single();
    if (error) {
      toast({ title: "Erro ao criar perfil", variant: "destructive" });
      return;
    }
    navigate(`/brand-profiles/${data.id}`);
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("brand_profiles").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("brand_profiles").update({ is_default: true }).eq("id", id);
    fetchProfiles();
    toast({ title: "Perfil definido como padrão" });
  };

  const handleDuplicate = async (profile: ProfileRow) => {
    if (!user) return;
    const { error } = await supabase.from("brand_profiles").insert({
      user_id: user.id,
      name: `${profile.name} (cópia)`,
      brand_identity: profile.brand_identity,
      brand_voice: profile.brand_voice,
      target_audience: profile.target_audience,
      product_service: profile.product_service,
      credentials: profile.credentials,
      personality_summary: profile.personality_summary,
      audience_summary: profile.audience_summary,
      product_summary: profile.product_summary,
    });
    if (!error) {
      fetchProfiles();
      toast({ title: "Perfil duplicado" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("brand_profiles").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchProfiles();
    toast({ title: "Perfil removido" });
  };

  const exportProfile = (profile: ProfileRow, format: "markdown" | "json") => {
    const data: BrandProfileData = {
      brand_identity: profile.brand_identity || {},
      brand_voice: profile.brand_voice || {},
      target_audience: profile.target_audience || {},
      product_service: profile.product_service || {},
      credentials: profile.credentials || {},
    };

    let content: string;
    let filename: string;
    let mime: string;

    if (format === "markdown") {
      content = profileToMarkdown(profile.name, data);
      filename = `${profile.name.replace(/\s+/g, "-").toLowerCase()}-dna.md`;
      mime = "text/markdown";
    } else {
      content = profileToJSON(profile.name, data);
      filename = `${profile.name.replace(/\s+/g, "-").toLowerCase()}-dna.json`;
      mime = "application/json";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCompletionPercentage = (profile: ProfileRow): number => {
    let filled = 0;
    let total = 0;
    for (const section of PROFILE_SECTIONS) {
      const sectionData = (profile[section.key] || {}) as Record<string, string>;
      for (const field of section.fields) {
        total++;
        if (sectionData[field.key]?.trim()) filled++;
      }
    }
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando perfis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold gradient-text">DNA de Marca</h1>
              <p className="text-xs text-muted-foreground">
                Perfis estratégicos para seus agentes de IA
              </p>
            </div>
          </div>
          <Button onClick={handleCreate} className="gap-2 premium-button border-0 text-primary-foreground">
            <Plus className="h-4 w-4" />
            Novo Perfil
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-4"
          >
            <span className="text-6xl">🧬</span>
            <h2 className="text-2xl font-bold text-foreground">Nenhum perfil criado</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Crie seu primeiro DNA de Marca para alimentar os agentes de IA com o contexto
              estratégico do seu negócio.
            </p>
            <Button onClick={handleCreate} className="gap-2 premium-button border-0 text-primary-foreground mt-4">
              <Plus className="h-4 w-4" />
              Criar primeiro perfil
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile, i) => {
              const completion = getCompletionPercentage(profile);
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card p-5 cursor-pointer group relative"
                  onClick={() => navigate(`/brand-profiles/${profile.id}`)}
                >
                  {/* Default badge */}
                  {profile.is_default && (
                    <div className="absolute top-3 right-12 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      Padrão
                    </div>
                  )}

                  {/* Menu */}
                  <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!profile.is_default && (
                          <DropdownMenuItem onClick={() => handleSetDefault(profile.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Definir como padrão
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicate(profile)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => exportProfile(profile, "markdown")}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportProfile(profile, "json")}>
                          <FileJson className="h-4 w-4 mr-2" />
                          Exportar JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const d: BrandProfileData = {
                            brand_identity: profile.brand_identity || {},
                            brand_voice: profile.brand_voice || {},
                            target_audience: profile.target_audience || {},
                            product_service: profile.product_service || {},
                            credentials: profile.credentials || {},
                          };
                          profileToPDF(profile.name, d);
                        }}>
                          <FileType className="h-4 w-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDeleteId(profile.id);
                            setDeleteName(profile.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🧬</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {profile.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Atualizado {new Date(profile.updated_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    {/* Completion bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Preenchimento</span>
                        <span className={completion === 100 ? "text-green-400 font-medium" : "text-muted-foreground"}>
                          {completion}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${completion}%`,
                            background: completion === 100
                              ? "hsl(142, 71%, 45%)"
                              : "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))",
                          }}
                        />
                      </div>
                    </div>

                    {/* Section badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {PROFILE_SECTIONS.map((section) => {
                        const sectionData = (profile[section.key] || {}) as Record<string, string>;
                        const hasSomeContent = Object.values(sectionData).some((v) => v?.trim());
                        return (
                          <span
                            key={section.key}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              hasSomeContent
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {section.emoji} {section.title.split(" ")[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{deleteName}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
