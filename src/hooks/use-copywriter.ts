import { useState, useRef, useCallback } from "react";
import { streamCopy } from "@/lib/stream-chat";
import { STEPS } from "@/lib/steps";
import { type GenerationContext, DEFAULT_GENERATION_CONTEXT } from "@/lib/lcm-types";

export type Provider = "deepseek" | "openai";

export function useCopywriter() {
  const [productInput, setProductInput] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [results, setResults] = useState<Record<string, string>>({});
  const [streamingText, setStreamingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [provider, setProvider] = useState<Provider>("deepseek");
  const [generationContext, setGenerationContext] = useState<GenerationContext>(DEFAULT_GENERATION_CONTEXT);
  const abortRef = useRef<AbortController | null>(null);

  const generateStep = useCallback(async (stepIndex: number, continueFrom?: string) => {
    const step = STEPS[stepIndex];
    if (!step) return;

    setCurrentStepIndex(stepIndex);
    const existingContent = continueFrom || "";
    setStreamingText(existingContent);
    setIsGenerating(true);

    const previousSteps = STEPS.slice(0, stepIndex);
    const previousContext = previousSteps
      .map(s => results[s.id] ? `## ${s.label}\n${results[s.id]}` : "")
      .filter(Boolean)
      .join("\n\n---\n\n");

    abortRef.current = new AbortController();
    let accumulated = existingContent;

    try {
      await streamCopy({
        productInput,
        step: step.id,
        previousContext: previousContext || undefined,
        provider,
        continueFrom: continueFrom || undefined,
        generationContext,
        onDelta: (text) => {
          accumulated += text;
          setStreamingText(accumulated);
        },
        onDone: () => {
          setResults(prev => ({ ...prev, [step.id]: accumulated }));
          setIsGenerating(false);
        },
        signal: abortRef.current.signal,
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
        setStreamingText(`❌ Erro: ${err.message}`);
      }
      setIsGenerating(false);
    }
  }, [productInput, results, provider, generationContext]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  return {
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
  };
}
