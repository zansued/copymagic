import { useState, useRef, useEffect } from "react";
import { STEPS } from "@/lib/steps";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCopywriter } from "@/hooks/use-copywriter";
import { ProductInputForm } from "@/components/ProductInputForm";
import { StepSidebar } from "@/components/StepSidebar";
import { StepOutput } from "@/components/StepOutput";
import { MarketResearch } from "@/components/MarketResearch";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LcmBadge } from "@/components/LcmBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TopNav } from "@/components/TopNav";
import { DEFAULT_GENERATION_CONTEXT } from "@/lib/lcm-types";
import { ProjectCampaignTab } from "@/components/project/ProjectCampaignTab";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLcmSettings, setShowLcmSettings] = useState(false);
  const [projectTab, setProjectTab] = useState<string>("lab");

  const {
    productInput,
    setProductInput,
    currentStepIndex,
    setCurrentStepIndex,
    results,
    setResults,
    streamingText,
    isGenerating,
    provider,
    setProvider,
    generationContext,
    setGenerationContext,
    generateStep,
    stopGeneration,
  } = useCopywriter();

  const [activeTab, setActiveTab] = useState<string>("research");
  const isInputPhase = currentStepIndex === -1;

  // Load project data
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Projeto não encontrado");
        navigate("/", { replace: true });
        return;
      }
      setProjectName(data.name);
      if (data.product_input) setProductInput(data.product_input);
      setGenerationContext({
        language_code: (data as any).language_code || DEFAULT_GENERATION_CONTEXT.language_code,
        cultural_region: (data as any).cultural_region || DEFAULT_GENERATION_CONTEXT.cultural_region,
        tone_formality: (data as any).tone_formality || DEFAULT_GENERATION_CONTEXT.tone_formality,
        avoid_real_names: (data as any).avoid_real_names ?? DEFAULT_GENERATION_CONTEXT.avoid_real_names,
      });
      if (data.copy_results && typeof data.copy_results === "object") {
        const savedResults = data.copy_results as Record<string, string>;
        setResults(savedResults);
        const completedSteps = STEPS.map((s, i) => savedResults[s.id] ? i : -1).filter(i => i >= 0);
        if (completedSteps.length > 0) {
          setCurrentStepIndex(Math.max(...completedSteps));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  // Auto-save results + LCM settings when they change
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (loading || !id) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await supabase
        .from("projects")
        .update({
          product_input: productInput,
          copy_results: results,
          language_code: generationContext.language_code,
          cultural_region: generationContext.cultural_region,
          tone_formality: generationContext.tone_formality,
          avoid_real_names: generationContext.avoid_real_names,
        } as any)
        .eq("id", id);
    }, 1000);
    return () => clearTimeout(saveTimeout.current);
  }, [results, productInput, generationContext, loading, id]);

  const handleUseProduct = async (productText: string) => {
    setProductInput(productText);
    setActiveTab("manual");
    if (id) {
      await supabase
        .from("projects")
        .update({ product_input: productText })
        .eq("id", id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando projeto...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background surface-gradient">
      <TopNav projectName={projectName} />

      <main className="container px-4 py-6">
        {/* Project-level tabs: Lab de Copy | Campanha */}
        <Tabs value={projectTab} onValueChange={setProjectTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="lab" className="gap-2">
              📝 Lab de Copy
            </TabsTrigger>
            <TabsTrigger value="campanha" className="gap-2">
              🚀 Campanha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lab">
            {isInputPhase ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <LanguageSelector value={generationContext} onChange={setGenerationContext} />

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full mb-6">
                    <TabsTrigger value="research" className="flex-1">🤖 Criar produto com IA</TabsTrigger>
                    <TabsTrigger value="manual" className="flex-1">📦 Já tenho um produto</TabsTrigger>
                  </TabsList>

                  <TabsContent value="research">
                    <MarketResearch provider={provider} projectId={id!} onUseProduct={handleUseProduct} generationContext={generationContext} />
                  </TabsContent>

                  <TabsContent value="manual">
                    <ProductInputForm
                      value={productInput}
                      onChange={setProductInput}
                      onSubmit={() => generateStep(0)}
                      isGenerating={isGenerating}
                      provider={provider}
                      onProviderChange={setProvider}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <LcmBadge context={generationContext} onEdit={() => setShowLcmSettings(!showLcmSettings)} />
                </div>
                {showLcmSettings && (
                  <div className="max-w-xl">
                    <LanguageSelector value={generationContext} onChange={setGenerationContext} />
                  </div>
                )}
                <div className="flex gap-6 h-[calc(100vh-14rem)]">
                  <div className="w-52 shrink-0">
                    <StepSidebar
                      currentStepIndex={currentStepIndex}
                      results={results}
                      isGenerating={isGenerating}
                      onSelectStep={(i) => setCurrentStepIndex(i)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <StepOutput
                      currentStepIndex={currentStepIndex}
                      results={results}
                      streamingText={streamingText}
                      isGenerating={isGenerating}
                      onGenerate={generateStep}
                      onStop={stopGeneration}
                      projectId={id}
                      onResultsUpdate={(updated) => {
                        setResults(updated as Record<string, string>);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="campanha">
            <ProjectCampaignTab projectId={id!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
