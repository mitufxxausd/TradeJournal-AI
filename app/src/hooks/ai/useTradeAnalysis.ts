import { useState, useCallback, useRef } from "react";
import { tradeAnalysisService } from "@/services/ai/services/tradeAnalysisService";
import type { TradeAnalysisRequest, TradeAnalysisResult, TradeScore } from "@/services/ai/types/trade-analysis";
import type { AIProcessingStatus } from "@/services/ai/types/common";

/**
 * useTradeAnalysis Hook
 * Hook for analyzing trades with AI
 */
export function useTradeAnalysis() {
  const [status, setStatus] = useState<AIProcessingStatus>({ status: "idle" });
  const [result, setResult] = useState<TradeAnalysisResult | null>(null);
  const [score, setScore] = useState<TradeScore | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (request: TradeAnalysisRequest) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Analyzing trade..." });
    setResult(null);

    try {
      const response = await tradeAnalysisService.analyze(request, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResult(response.data);
        setStatus({ status: "success", message: "Analysis complete" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Analysis failed";
      setStatus({ status: "error", error: message });
      return null;
    }
  }, []);

  const getScore = useCallback(async (tradeId: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Calculating score..." });
    setScore(null);

    try {
      const response = await tradeAnalysisService.scoreTrade(tradeId, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setScore(response.data);
        setStatus({ status: "success", message: "Score calculated" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Score calculation failed";
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
    setScore(null);
    setStatus({ status: "idle" });
  }, [cancel]);

  return {
    analyze,
    getScore,
    cancel,
    reset,
    status,
    result,
    score,
    isLoading: status.status === "loading",
    isError: status.status === "error",
    isSuccess: status.status === "success",
  };
}
