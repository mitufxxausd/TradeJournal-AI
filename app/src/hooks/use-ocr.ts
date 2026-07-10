/**
 * useOCR Hook
 * Manages OCR processing state and integrates with the TradeFusionEngine
 * for combining OCR and Vision analysis outputs.
 */

import { useState, useCallback, useRef } from "react";
import { runOCR, cancelOCR, preloadTesseract } from "@/services/ocr";
import { runFusion, getVisionProviderStatus } from "@/services/ai/fusion";
import type { OCRResult, OCROptions } from "@/services/ocr";
import type { FusionResult, VisionProviderStatus } from "@/services/ai/fusion";
import { CONFIDENCE_THRESHOLDS } from "@/services/ocr";

export type OCRStatus = "idle" | "processing" | "completed" | "error";

export interface UseOCRReturn {
  status: OCRStatus;
  result: OCRResult | null;
  fusionResult: FusionResult | null;
  progress: number;
  error: string | null;
  run: (imageFile: File, options?: OCROptions) => Promise<OCRResult | null>;
  cancel: () => void;
  reset: () => void;
  preload: () => void;
  isProcessing: boolean;
  isCompleted: boolean;
  isError: boolean;
  /** Whether OCR confidence is high enough for auto-fill */
  canAutoFill: boolean;
  /** Human-readable confidence status message */
  confidenceMessage: string | null;
  /** Current AI Vision provider status */
  visionStatus: VisionProviderStatus;
}

export function useOCR(): UseOCRReturn {
  const [status, setStatus] = useState<OCRStatus>("idle");
  const [result, setResult] = useState<OCRResult | null>(null);
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const run = useCallback(async (imageFile: File, options: OCROptions = {}) => {
    isCancelledRef.current = false;
    setStatus("processing");
    setProgress(0);
    setError(null);
    setResult(null);
    setFusionResult(null);

    try {
      const ocrResult = await runOCR(imageFile, {
        ...options,
        onProgress: (p) => {
          if (!isCancelledRef.current) {
            setProgress(p);
          }
        },
      });

      if (isCancelledRef.current) {
        return null;
      }

      // Run the Trade Fusion Engine to combine OCR results
      const fusion = await runFusion(imageFile, ocrResult, null);
      setFusionResult(fusion);

      if (ocrResult.error && ocrResult.trades.length === 0) {
        setError(ocrResult.error);
        setStatus("error");
      } else {
        setResult(ocrResult);
        setStatus("completed");
      }

      return ocrResult;
    } catch (err) {
      if (isCancelledRef.current) return null;

      const message = err instanceof Error ? err.message : "OCR failed";
      setError(message);
      setStatus("error");
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    cancelOCR();
    setStatus("idle");
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    isCancelledRef.current = true;
    cancelOCR();
    setStatus("idle");
    setResult(null);
    setFusionResult(null);
    setProgress(0);
    setError(null);
  }, []);

  const preload = useCallback(() => {
    preloadTesseract();
  }, []);

  // Determine confidence status
  const canAutoFill = result ? result.overallConfidence >= CONFIDENCE_THRESHOLDS.HIGH : false;

  const confidenceMessage = (() => {
    if (!result) return null;
    if (result.confidenceLevel === "high") return "High confidence - review recommended before importing";
    if (result.confidenceLevel === "medium") return "Medium confidence - please review fields before importing";
    return "Low confidence - all fields must be verified before importing";
  })();

  return {
    status,
    result,
    fusionResult,
    progress,
    error,
    run,
    cancel,
    reset,
    preload,
    isProcessing: status === "processing",
    isCompleted: status === "completed",
    isError: status === "error",
    canAutoFill,
    confidenceMessage,
    visionStatus: getVisionProviderStatus(),
  };
}
