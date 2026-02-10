import { useState, useRef, useCallback, useEffect } from "react";
import { STEPS } from "@/lib/steps";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCopywriter } from "@/hooks/use-copywriter";
import { ProductInputForm } from "@/components/ProductInputForm";
import { StepSidebar } from "@/components/StepSidebar";
import { StepOutput } from "@/components/StepOutput";
import { MarketResearch } from "@/components/MarketResearch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TopNav } from "@/components/TopNav";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

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
      if (data.copy_results && typeof data.copy_results === "object") {
        const savedResults = data.copy_results as Record<string, string>;
        setResults(savedResults);
        // Restore step index to last completed step
        const completedSteps = STEPS.map((s, i) => savedResults[s.id] ? i : -1).filter(i => i >= 0);
        if (completedSteps.length > 0) {
          setCurrentStepIndex(Math.max(...completedSteps));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  // Auto-save results when they change
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (loading || !id) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await supabase
        .from("projects")
        .update({ product_input: productInput, copy_results: results })
        .eq("id", id);
    }, 1000);
    return () => clearTimeout(saveTimeout.current);
  }, [results, productInput, loading, id]);

  const handleUseProduct = async (productText: string) => {
    setProductInput(productText);
    setActiveTab("manual");
    // Save research product to project
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
        {isInputPhase ? (
          <div className="max-w-2xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="research" className="flex-1">🔍 Pesquisa de Mercado</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1">✍️ Input Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="research">
                <MarketResearch provider={provider} projectId={id!} onUseProduct={handleUseProduct} />
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
          <div className="flex gap-6 h-[calc(100vh-8rem)]">
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
              />
            </div>
          </div>
        )}
      </main>

      
    </div>
  );
}
