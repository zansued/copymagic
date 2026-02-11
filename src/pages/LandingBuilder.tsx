import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/TopNav";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ProjectSelector, type ProjectOption } from "@/components/landing-builder/ProjectSelector";
import { TemplateSelector } from "@/components/landing-builder/TemplateSelector";
import { LangSelector } from "@/components/landing-builder/LangSelector";
import { BrandingOptions } from "@/components/landing-builder/BrandingOptions";
import { PreviewPanel } from "@/components/landing-builder/PreviewPanel";
import { ExportButtons } from "@/components/landing-builder/ExportButtons";

export default function LandingBuilder() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [templateKey, setTemplateKey] = useState("saas-premium");
  const [language, setLanguage] = useState("pt-BR");
  const [region, setRegion] = useState("auto");
  const [includeUpsells, setIncludeUpsells] = useState(false);
  const [brandingTitle, setBrandingTitle] = useState("");
  const [brandingLogo, setBrandingLogo] = useState("");
  const [brandingColor, setBrandingColor] = useState("#7c3aed");
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, copy_results")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) {
        setProjects(
          data.map((p) => {
            const cr = typeof p.copy_results === "string"
              ? JSON.parse(p.copy_results as string)
              : (p.copy_results as Record<string, unknown>) || {};
            return {
              id: p.id,
              name: p.name,
              hasSalesCopy: !!cr.pagina_vendas,
              hasUpsellCopy: !!cr.pagina_upsell,
            };
          })
        );
      }
    })();
  }, [user]);

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  const handleGenerate = useCallback(async () => {
    if (!selectedProject) {
      toast.error("Selecione um projeto primeiro");
      return;
    }
    if (!selectedProjectData?.hasSalesCopy) {
      toast.error("Este projeto não tem Página de Vendas gerada.");
      return;
    }

    setGenerating(true);
    setGeneratedHtml(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-site`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            projectId: selectedProject,
            templateKey,
            options: {
              includeUpsells,
              language,
              branding: {
                title: brandingTitle || undefined,
                logoUrl: brandingLogo || undefined,
                primaryColor: brandingColor || undefined,
              },
            },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao gerar página");
      }

      const result = await res.json();
      setGeneratedHtml(result.html);
      toast.success("Página gerada com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [selectedProject, selectedProjectData, templateKey, includeUpsells, language, brandingTitle, brandingLogo, brandingColor]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      <main className="flex-1 container py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold gradient-text font-[Space_Grotesk]">
            Landing Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transforme sua copy em uma landing page premium, pronta para publicar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* LEFT — Config */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProject}
              onSelect={setSelectedProject}
            />

            <TemplateSelector
              selected={templateKey}
              onSelect={setTemplateKey}
            />

            <LangSelector
              language={language}
              region={region}
              onLanguageChange={setLanguage}
              onRegionChange={setRegion}
            />

            <BrandingOptions
              includeUpsells={includeUpsells}
              onToggleUpsells={setIncludeUpsells}
              brandingTitle={brandingTitle}
              onTitleChange={setBrandingTitle}
              brandingLogo={brandingLogo}
              onLogoChange={setBrandingLogo}
              brandingColor={brandingColor}
              onColorChange={setBrandingColor}
            />

            <ExportButtons
              generating={generating}
              selectedProject={selectedProject}
              selectedProjectName={selectedProjectData?.name || ""}
              generatedHtml={generatedHtml}
              templateKey={templateKey}
              language={language}
              includeUpsells={includeUpsells}
              brandingTitle={brandingTitle}
              brandingLogo={brandingLogo}
              brandingColor={brandingColor}
              onGenerate={handleGenerate}
            />
          </motion.div>

          {/* RIGHT — Preview */}
          <PreviewPanel html={generatedHtml} generating={generating} onHtmlUpdate={setGeneratedHtml} />
        </div>
      </main>
    </div>
  );
}
