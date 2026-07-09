/**
 * useOCR Hook
 * Hook for running OCR on images with progress tracking.
 * Uses the intelligent parser layer for trade extraction.
 */

import { useState, useCallback, useRef } from "react";
import { runOCR, cancelOCR, preloadTesseract } from "@/services/ocr";
import type { OCRResult, OCROptions } from "@/services/ocr";
import { CONFIDENCE_THRESHOLDS } from "@/services/ocr";

export type OCRStatus = "idle" | "processing" | "completed" | "error";

export interface UseOCRReturn {
  status: OCRStatus;
  result: OCRResult | null;
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
}

export function useOCR(): UseOCRReturn {
  const [status, setStatus] = useState<OCRStatus>("idle");
  const [result, setResult] = useState<OCRResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const run = useCallback(async (imageFile: File, options: OCROptions = {}) => {
    isCancelledRef.current = false;
    setStatus("processing");
    setProgress(0);
    setError(null);
    setResult(null);

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
    setProgress(0);
    setError(null);
  }, []);

  const preload = useCallback(() => {
    preloadTesseract();
  }, []);

  // Derive auto-fill capability from confidence
  const canAutoFill = result !== null &&
    result.overallConfidence >= CONFIDENCE_THRESHOLDS.MEDIUM &&
    result.confidenceLevel !== "low";

  // Human-readable confidence message
  const confidenceMessage = result
    ? getConfidenceMessage(result)
    : null;

  return {
    status,
    result,
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
  };
}

function getConfidenceMessage(result: OCRResult): string {
  if (result.error) return `Error: ${result.error}`;

  switch (result.confidenceLevel) {
    case "high":
      return `High confidence (${result.overallConfidence}%) - Results look reliable.`;
    case "medium":
      return `Medium confidence (${result.overallConfidence}%) - Please review before importing.`;
    case "low":
      return `Low confidence (${result.overallConfidence}%) - Please review OCR results before importing.`;
    default:
      return `Confidence: ${result.overallConfidence}%`;
  }
}
