/**
 * useOCR Hook
 * Phase 7D-1: Enhanced OCR with Cloudinary Upload + AI Extraction
 *
 * Pipeline:
 *   Image -> Cloudinary Upload -> OCR -> AI Extraction ->
 *   Advice Generation -> Enhanced Result
 *
 * Integrates with TradeFusionEngine for backward compatibility.
 */

import { useState, useCallback, useRef } from "react";
import { runOCR, cancelOCR, preloadTesseract } from "@/services/ocr";
import { runFusion, getVisionProviderStatus } from "@/services/ai/fusion";
import { extractTradeWithAI } from "@/services/ai/aiExtraction";
import { uploadToCloudinary } from "@/services/cloudinary";
import type { OCRResult, OCROptions } from "@/services/ocr";
import type { FusionResult, VisionProviderStatus } from "@/services/ai/fusion";
import type { AIExtractionResult } from "@/services/ai/types/ai-extraction";
import { CONFIDENCE_THRESHOLDS } from "@/services/ocr";

// ─── Types ───

export type OCRPhase =
  | "idle"
  | "uploading"
  | "ocr"
  | "ai_extracting"
  | "completed"
  | "error";

export interface OCRStatus {
  phase: OCRPhase;
  message: string;
}

export interface EnhancedOCRResult {
  /** Original OCR result from Tesseract */
  ocrResult: OCRResult;
  /** Cloudinary image URL */
  imageUrl: string | null;
  /** AI extraction result */
  aiExtraction: AIExtractionResult | null;
  /** Fusion engine result (backward compatibility) */
  fusionResult: FusionResult | null;
}

export interface UseOCRReturn {
  status: OCRStatus;
  result: OCRResult | null;
  enhancedResult: EnhancedOCRResult | null;
  fusionResult: FusionResult | null;
  aiExtraction: AIExtractionResult | null;
  imageUrl: string | null;
  progress: number;
  error: string | null;
  run: (imageFile: File, options?: OCROptions) => Promise<EnhancedOCRResult | null>;
  cancel: () => void;
  reset: () => void;
  preload: () => void;
  isProcessing: boolean;
  isUploading: boolean;
  isRunningOCR: boolean;
  isAIExtracting: boolean;
  isCompleted: boolean;
  isError: boolean;
  canAutoFill: boolean;
  confidenceMessage: string | null;
  visionStatus: VisionProviderStatus;
}

// ─── Hook ───

export function useOCR(): UseOCRReturn {
  const [status, setStatus] = useState<OCRStatus>({ phase: "idle", message: "" });
  const [result, setResult] = useState<OCRResult | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedOCRResult | null>(null);
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const [aiExtraction, setAiExtraction] = useState<AIExtractionResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = useRef(false);

  const run = useCallback(async (imageFile: File, options: OCROptions = {}) => {
    isCancelledRef.current = false;
    setStatus({ phase: "uploading", message: "Uploading image..." });
    setProgress(5);
    setError(null);
    setResult(null);
    setEnhancedResult(null);
    setFusionResult(null);
    setAiExtraction(null);
    setImageUrl(null);

    let uploadedImageUrl: string | null = null;

    try {
      // ─── Step 1: Upload to Cloudinary ───
      try {
        const uploadResult = await uploadToCloudinary(imageFile);
        uploadedImageUrl = uploadResult.secure_url;
        setImageUrl(uploadedImageUrl);
        setProgress(15);
      } catch (uploadErr) {
        // Cloudinary upload failure is non-critical - continue without image URL
        console.warn("[useOCR] Cloudinary upload failed:", uploadErr);
        uploadedImageUrl = null;
        setProgress(15);
      }

      if (isCancelledRef.current) return null;

      // ─── Step 2: Run OCR ───
      setStatus({ phase: "ocr", message: "Extracting text from image..." });

      const ocrResult = await runOCR(imageFile, {
        ...options,
        onProgress: (p) => {
          if (!isCancelledRef.current) {
            // Map OCR progress from 15% to 60%
            setProgress(15 + Math.round(p * 0.45));
          }
        },
      });

      if (isCancelledRef.current) return null;

      setResult(ocrResult);
      setProgress(60);

      // ─── Step 3: Run Trade Fusion Engine ───
      const fusion = await runFusion(imageFile, ocrResult, null);
      setFusionResult(fusion);

      if (isCancelledRef.current) return null;

      // ─── Step 4: AI Extraction ───
      setStatus({ phase: "ai_extracting", message: "Analyzing with AI..." });
      setProgress(65);

      let extractionResult: AIExtractionResult | null = null;

      try {
        extractionResult = await extractTradeWithAI(
          {
            ocrText: ocrResult.rawText || "",
            imageUrl: uploadedImageUrl || undefined,
          },
          ocrResult.overallConfidence,
          { includeAdvice: true, timeoutMs: 25000 }
        );

        // Attach the image URL if it wasn't set by the extraction service
        if (extractionResult && uploadedImageUrl && !extractionResult.imageUrl) {
          extractionResult.imageUrl = uploadedImageUrl;
        }

        setAiExtraction(extractionResult);
      } catch (aiErr) {
        // AI extraction failure is non-critical - we still have OCR results
        console.warn("[useOCR] AI extraction failed:", aiErr);
        extractionResult = null;
        setAiExtraction(null);
      }

      if (isCancelledRef.current) return null;

      setProgress(100);

      // ─── Build Enhanced Result ───
      const enhanced: EnhancedOCRResult = {
        ocrResult,
        imageUrl: uploadedImageUrl,
        aiExtraction: extractionResult,
        fusionResult: fusion,
      };

      setEnhancedResult(enhanced);

      // ─── Set Final Status ───
      if (ocrResult.error && ocrResult.trades.length === 0) {
        setStatus({ phase: "error", message: ocrResult.error });
        setError(ocrResult.error);
      } else {
        setStatus({
          phase: "completed",
          message: extractionResult
            ? `Analysis complete (AI confidence: ${extractionResult.confidence.overall}%)`
            : "OCR analysis complete",
        });
      }

      return enhanced;
    } catch (err) {
      if (isCancelledRef.current) return null;

      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setStatus({ phase: "error", message });
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    cancelOCR();
    setStatus({ phase: "idle", message: "" });
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    isCancelledRef.current = true;
    cancelOCR();
    setStatus({ phase: "idle", message: "" });
    setResult(null);
    setEnhancedResult(null);
    setFusionResult(null);
    setAiExtraction(null);
    setImageUrl(null);
    setProgress(0);
    setError(null);
  }, []);

  const preload = useCallback(() => {
    preloadTesseract();
  }, []);

  // Derive status flags
  const isProcessing = status.phase === "uploading" || status.phase === "ocr" || status.phase === "ai_extracting";
  const isUploading = status.phase === "uploading";
  const isRunningOCR = status.phase === "ocr";
  const isAIExtracting = status.phase === "ai_extracting";
  const isCompleted = status.phase === "completed";
  const isError = status.phase === "error";

  // Determine confidence status
  const canAutoFill = aiExtraction
    ? aiExtraction.confidence.overall >= CONFIDENCE_THRESHOLDS.HIGH
    : result
      ? result.overallConfidence >= CONFIDENCE_THRESHOLDS.HIGH
      : false;

  const confidenceMessage = (() => {
    if (aiExtraction) {
      const { overall, ocr, ai } = aiExtraction.confidence;
      if (overall >= 80) return `High confidence (OCR: ${ocr}%, AI: ${ai}%) - review recommended`;
      if (overall >= 60) return `Medium confidence (OCR: ${ocr}%, AI: ${ai}%) - please review fields`;
      return `Low confidence (OCR: ${ocr}%, AI: ${ai}%) - verify all fields`;
    }
    if (!result) return null;
    if (result.confidenceLevel === "high") return "High confidence - review recommended before importing";
    if (result.confidenceLevel === "medium") return "Medium confidence - please review fields before importing";
    return "Low confidence - all fields must be verified before importing";
  })();

  return {
    status,
    result,
    enhancedResult,
    fusionResult,
    aiExtraction,
    imageUrl,
    progress,
    error,
    run,
    cancel,
    reset,
    preload,
    isProcessing,
    isUploading,
    isRunningOCR,
    isAIExtracting,
    isCompleted,
    isError,
    canAutoFill,
    confidenceMessage,
    visionStatus: getVisionProviderStatus(),
  };
}
