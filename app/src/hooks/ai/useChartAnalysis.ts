import { useState, useCallback, useRef } from "react";
import { chartAnalysisService } from "@/services/ai/services/chartAnalysisService";
import type { ChartAnalysisRequest, ChartAnalysisResult } from "@/services/ai/types/chart-analysis";
import type { AIProcessingStatus } from "@/services/ai/types/common";

/**
 * useChartAnalysis Hook
 * Hook for analyzing chart screenshots with AI
 */
export function useChartAnalysis() {
  const [status, setStatus] = useState<AIProcessingStatus>({ status: "idle" });
  const [result, setResult] = useState<ChartAnalysisResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (request: ChartAnalysisRequest) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Analyzing chart..." });
    setResult(null);

    try {
      const response = await chartAnalysisService.analyze(request, {
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

      const message = error instanceof Error ? error.message : "Chart analysis failed";
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
    setStatus({ status: "idle" });
  }, [cancel]);

  return {
    analyze,
    cancel,
    reset,
    status,
    result,
    isLoading: status.status === "loading",
    isError: status.status === "error",
    isSuccess: status.status === "success",
  };
}
