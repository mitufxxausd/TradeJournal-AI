import { useState, useCallback, useRef } from "react";
import { providerRegistry } from "@/services/ai/providers/registry";
import { isVisionProvider } from "@/services/ai/providers/interfaces";
import type { ChartAnalysisRequest, ChartAnalysisResult } from "@/services/ai/types/chart-analysis";
import type { AIProcessingStatus } from "@/services/ai/types/common";

/**
 * useVision Hook
 * Hook for AI vision capabilities - chart analysis and image analysis
 */
export function useVision() {
  const [status, setStatus] = useState<AIProcessingStatus>({ status: "idle" });
  const [result, setResult] = useState<ChartAnalysisResult | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeChart = useCallback(async (request: ChartAnalysisRequest) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Analyzing chart with vision AI..." });
    setResult(null);

    try {
      const provider = providerRegistry.getPrimaryForCapability("vision");
      if (!provider || !isVisionProvider(provider)) {
        throw new Error("No vision provider available");
      }

      const response = await provider.analyzeChart(request, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResult(response.data);
        setStatus({ status: "success", message: "Chart analysis complete" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Vision analysis failed";
      setStatus({ status: "error", error: message });
      return null;
    }
  }, []);

  const analyzeImage = useCallback(async (imageUrl: string, prompt: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Analyzing image..." });
    setImageAnalysis(null);

    try {
      const provider = providerRegistry.getPrimaryForCapability("vision");
      if (!provider || !isVisionProvider(provider)) {
        throw new Error("No vision provider available");
      }

      const response = await provider.analyzeImage(imageUrl, prompt, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setImageAnalysis(response.data);
        setStatus({ status: "success", message: "Image analysis complete" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Image analysis failed";
      setStatus({ status: "error", error: message });
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus({ status: "idle" });
  }, []);

  const reset = useCallback(() => {
    cancel();
    setResult(null);
    setImageAnalysis(null);
    setStatus({ status: "idle" });
  }, [cancel]);

  return {
    analyzeChart,
    analyzeImage,
    cancel,
    reset,
    status,
    result,
    imageAnalysis,
    isLoading: status.status === "loading",
    isError: status.status === "error",
    isSuccess: status.status === "success",
  };
}
