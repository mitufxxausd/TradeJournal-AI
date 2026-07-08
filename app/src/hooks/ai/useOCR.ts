import { useState, useCallback, useRef } from "react";
import { ocrService } from "@/services/ai/services/ocrService";
import type { OCRResult, OCROptions } from "@/services/ai/types/ocr";
import type { AIProcessingStatus } from "@/services/ai/types/common";

/**
 * useOCR Hook
 * Hook for extracting trade data from screenshots using OCR
 */
export function useOCR() {
  const [status, setStatus] = useState<AIProcessingStatus>({ status: "idle" });
  const [result, setResult] = useState<OCRResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const extractTradeData = useCallback(async (imageUrl: string, options?: OCROptions) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Extracting trade data..." });
    setResult(null);

    try {
      const response = await ocrService.extractTradeData(imageUrl, {
        ...options,
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResult(response.data);
        setStatus({ status: "success", message: "Data extracted" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "OCR extraction failed";
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
    extractTradeData,
    cancel,
    reset,
    status,
    result,
    isLoading: status.status === "loading",
    isError: status.status === "error",
    isSuccess: status.status === "success",
  };
}
