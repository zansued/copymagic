import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import {
  PROFILE_SECTIONS,
  EMPTY_BRAND_IDENTITY,
  EMPTY_BRAND_VOICE,
  EMPTY_TARGET_AUDIENCE,
  EMPTY_PRODUCT_SERVICE,
  EMPTY_CREDENTIALS,
} from "@/lib/brand-profile-types";

const DEFAULTS: Record<string, any> = {
  brand_identity: EMPTY_BRAND_IDENTITY,
  brand_voice: EMPTY_BRAND_VOICE,
  target_audience: EMPTY_TARGET_AUDIENCE,
  product_service: EMPTY_PRODUCT_SERVICE,
  credentials: EMPTY_CREDENTIALS,
};

export default function BrandProfileEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [sections, setSections] = useState<Record<string, Record<string, string>>>({
    brand_identity: { ...EMPTY_BRAND_IDENTITY },
    brand_voice: { ...EMPTY_BRAND_VOICE },
    target_audience: { ...EMPTY_TARGET_AUDIENCE },
    product_service: { ...EMPTY_PRODUCT_SERVICE },
    credentials: { ...EMPTY_CREDENTIALS },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("brand_profiles")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate("/brand-profiles");
          return;
        }
        setName(data.name);
        setSections({
          brand_identity: { ...EMPTY_BRAND_IDENTITY, ...(data.brand_identity as any || {}) },
          brand_voice: { ...EMPTY_BRAND_VOICE, ...(data.brand_voice as any || {}) },
          target_audience: { ...EMPTY_TARGET_AUDIENCE, ...(data.target_audience as any || {}) },
          product_service: { ...EMPTY_PRODUCT_SERVICE, ...(data.product_service as any || {}) },
          credentials: { ...EMPTY_CREDENTIALS, ...(data.credentials as any || {}) },
        });
        setLoading(false);
      });
  }, [user, id, navigate]);

  const updateField = useCallback((sectionKey: string, fieldKey: string, value: string) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [fieldKey]: value },
    }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!user || !id) return;
    setSaving(true);
    try {
      // Build summaries from first fields
      const personalitySummary = [
        sections.brand_voice?.voice_essence,
        sections.brand_voice?.brand_persona,
      ].filter(Boolean).join(" — ").slice(0, 200);
      
      const audienceSummary = [
        sections.target_audience?.demographics,
        sections.target_audience?.central_problem,
      ].filter(Boolean).join(" — ").slice(0, 200);
      
      const productSummary = [
        sections.product_service?.offer_name,
        sections.product_service?.main_promise,
      ].filter(Boolean).join(" — ").slice(0, 200);

      const { error } = await supabase
        .from("brand_profiles")
        .update({
          name,
          brand_identity: sections.brand_identity,
          brand_voice: sections.brand_voice,
          target_audience: sections.target_audience,
          product_service: sections.product_service,
          credentials: sections.credentials,
          personality_summary: personalitySummary,
          audience_summary: audienceSummary,
          product_summary: productSummary,
        })
        .eq("id", id);

      if (error) throw error;
      setSaved(true);
      toast({ title: "Perfil salvo com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando perfil...</div>
      </div>
    );
  }

  const currentSection = PROFILE_SECTIONS[activeSection];
  const currentData = sections[currentSection.key] || {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass-header sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/brand-profiles")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false); }}
              className="text-lg font-bold bg-transparent border-none focus-visible:ring-1 h-9 w-[260px]"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className="gap-2 premium-button border-0 text-primary-foreground"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : saved ? "Salvo" : "Salvar"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 border-r border-border p-4 space-y-1 hidden md:block sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {PROFILE_SECTIONS.map((section, i) => {
            const sectionData = sections[section.key] || {};
            const filledFields = Object.values(sectionData).filter((v) => (v as string)?.trim()).length;
            const totalFields = section.fields.length;

            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                  i === activeSection
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <span className="text-lg">{section.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{section.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {filledFields}/{totalFields} campos
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Mobile section tabs */}
        <div className="md:hidden flex overflow-x-auto gap-1 p-3 border-b border-border">
          {PROFILE_SECTIONS.map((section, i) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(i)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-all ${
                i === activeSection
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {section.emoji} {section.title.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Main form */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl space-y-8"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentSection.emoji}</span>
                <div>
                  <h2 className="text-2xl font-bold gradient-text">{currentSection.title}</h2>
                  <p className="text-muted-foreground text-sm">{currentSection.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {currentSection.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{field.label}</label>
                  {field.multiline ? (
                    <Textarea
                      value={currentData[field.key] || ""}
                      onChange={(e) => updateField(currentSection.key, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="min-h-[140px] text-sm leading-relaxed resize-y"
                    />
                  ) : (
                    <Input
                      value={currentData[field.key] || ""}
                      onChange={(e) => updateField(currentSection.key, field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Section navigation */}
            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
              >
                ← Anterior
              </Button>
              {activeSection < PROFILE_SECTIONS.length - 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection(activeSection + 1)}
                >
                  Próximo →
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="premium-button border-0 text-primary-foreground">
                  {saving ? "Salvando..." : "💾 Salvar Perfil"}
                </Button>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
