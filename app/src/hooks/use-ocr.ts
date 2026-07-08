/**
 * useOCR Hook
 * Hook for running Tesseract.js OCR on images with progress tracking.
 */

import { useState, useCallback, useRef } from "react";
import { runOCR, cancelOCR } from "@/services/ocr";
import type { OCRResult, OCROptions } from "@/services/ocr";

export type OCRStatus = "idle" | "processing" | "completed" | "error";

export interface UseOCRReturn {
  status: OCRStatus;
  result: OCRResult | null;
  progress: number;
  error: string | null;
  run: (imageFile: File, options?: OCROptions) => Promise<OCRResult | null>;
  cancel: () => void;
  reset: () => void;
  isProcessing: boolean;
  isCompleted: boolean;
  isError: boolean;
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

  return {
    status,
    result,
    progress,
    error,
    run,
    cancel,
    reset,
    isProcessing: status === "processing",
    isCompleted: status === "completed",
    isError: status === "error",
  };
}
