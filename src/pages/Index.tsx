import { useCopywriter } from "@/hooks/use-copywriter";
import { ProductInputForm } from "@/components/ProductInputForm";
import { StepSidebar } from "@/components/StepSidebar";
import { StepOutput } from "@/components/StepOutput";

const Index = () => {
  const {
    productInput,
    setProductInput,
    currentStepIndex,
    setCurrentStepIndex,
    results,
    streamingText,
    isGenerating,
    provider,
    setProvider,
    generateStep,
    stopGeneration,
  } = useCopywriter();

  const isInputPhase = currentStepIndex === -1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">CopyEngine</h1>
              <p className="text-xs text-muted-foreground">Inteligência de Marketing Direto</p>
            </div>
          </div>
          {!isInputPhase && (
            <button
              onClick={() => setCurrentStepIndex(-1)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar ao Input
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="container px-4 py-8">
        {isInputPhase ? (
          <div className="max-w-2xl mx-auto">
            <ProductInputForm
              value={productInput}
              onChange={setProductInput}
              onSubmit={() => generateStep(0)}
              isGenerating={isGenerating}
              provider={provider}
              onProviderChange={setProvider}
            />
          </div>
        ) : (
          <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Sidebar */}
            <div className="w-52 shrink-0">
              <StepSidebar
                currentStepIndex={currentStepIndex}
                results={results}
                isGenerating={isGenerating}
                onSelectStep={(i) => setCurrentStepIndex(i)}
              />
            </div>
            {/* Content */}
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
};

export default Index;
