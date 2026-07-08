import { useState, useCallback, useRef } from "react";
import { summaryService } from "@/services/ai/services/summaryService";
import type { AIProcessingStatus } from "@/services/ai/types/common";

/**
 * useTradeSummary Hook
 * Hook for generating AI-powered trade summaries
 * Supports both single trade and multi-trade summarization
 */
export function useTradeSummary() {
  const [status, setStatus] = useState<AIProcessingStatus>({ status: "idle" });
  const [summary, setSummary] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const summarizeTrade = useCallback(async (tradeId: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Generating trade summary..." });
    setSummary(null);

    try {
      const response = await summaryService.summarizeTrade(tradeId, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setSummary(response.data);
        setStatus({ status: "success", message: "Summary generated" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Summary generation failed";
      setStatus({ status: "error", error: message });
      return null;
    }
  }, []);

  const summarizeTrades = useCallback(async (tradeIds: string[]) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: `Analyzing ${tradeIds.length} trades...` });
    setSummary(null);

    try {
      const response = await summaryService.summarizeTrades(tradeIds, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setSummary(response.data);
        setStatus({ status: "success", message: "Multi-trade summary generated" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Multi-trade summary failed";
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
    setSummary(null);
    setStatus({ status: "idle" });
  }, [cancel]);

  return {
    summarizeTrade,
    summarizeTrades,
    cancel,
    reset,
    status,
    summary,
    isLoading: status.status === "loading",
    isError: status.status === "error",
    isSuccess: status.status === "success",
  };
}
