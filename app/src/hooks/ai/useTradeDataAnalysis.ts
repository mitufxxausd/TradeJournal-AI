/**
 * useTradeDataAnalysis Hook
 * Phase 7D-2: Structured Trade Data → Mesh AI Analysis
 *
 * Routes extracted trade data through aiService → getAIProvider → MeshAIProvider → Mesh API
 * to generate a Professional Trade Analysis. Does NOT send images — only structured data.
 */

import { useState, useCallback } from "react";
import { analyzeTradeData } from "@/services/ai/aiService";
import type { ExtractedTradeData, ProfessionalTradeAnalysis } from "@/services/ai/types";
import type { SubscriptionTier } from "@/services/ai/types";

export type TradeDataAnalysisStatus = "idle" | "loading" | "success" | "error";

export interface UseTradeDataAnalysisReturn {
  status: TradeDataAnalysisStatus;
  result: ProfessionalTradeAnalysis | null;
  error: string | null;
  analyze: (extractedData: ExtractedTradeData, userTier?: SubscriptionTier) => Promise<ProfessionalTradeAnalysis | null>;
  reset: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useTradeDataAnalysis(): UseTradeDataAnalysisReturn {
  const [status, setStatus] = useState<TradeDataAnalysisStatus>("idle");
  const [result, setResult] = useState<ProfessionalTradeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (
    extractedData: ExtractedTradeData,
    userTier: SubscriptionTier = "pro"
  ): Promise<ProfessionalTradeAnalysis | null> => {
    if (!extractedData || !extractedData.symbol) {
      setError("No trade data available for analysis");
      setStatus("error");
      return null;
    }

    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeTradeData(userTier, extractedData);

      if (analysis) {
        setResult(analysis);
        setStatus("success");
        return analysis;
      } else {
        setError("AI analysis returned no result");
        setStatus("error");
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI trade analysis failed";
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    analyze,
    reset,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
  };
}
