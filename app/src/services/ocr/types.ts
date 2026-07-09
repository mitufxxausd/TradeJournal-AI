/**
 * OCR Service Types
 * Shared type definitions for OCR providers and parsers.
 * All OCR implementations must conform to these types.
 */

// ─── Trade Detection Result ───

export interface OCRTrade {
  symbol: string;
  direction: "buy" | "sell" | "unknown";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number | null;
  riskReward: number | null;
  confidence: number;
  fieldConfidences: FieldConfidences;
  rawText: string;
}

export interface FieldConfidences {
  symbol: number;
  direction: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
}

// ─── OCR Options ───

export interface OCROptions {
  language?: string;
  imageQuality?: "low" | "medium" | "high";
  onProgress?: (progress: number) => void;
}

// ─── OCR Result ───

export interface OCRResult {
  rawText: string;
  trades: OCRTrade[];
  detectedPrices: DetectedPrice[];
  detectedOrderTypes: string[];
  overallConfidence: number;
  confidenceLevel: "high" | "medium" | "low";
  processingTimeMs: number;
  error?: string;
  warning?: string;
}

// ─── Detected Price with Context ───

export interface DetectedPrice {
  value: number;
  context: string;
  classification: "entry" | "stopLoss" | "takeProfit" | "lotSize" | "chartScale" | "indicator" | "unknown";
  confidence: number;
}

// ─── OCR Provider Interface ───

export interface OCRProvider {
  readonly name: string;
  extractText(imageFile: File, options?: OCROptions): Promise<{
    text: string;
    confidence: number;
    processingTimeMs: number;
  }>;
  cancel(): void;
}

// ─── Parser Interface ───

export interface OCRParser {
  readonly name: string;
  parse(text: string, ocrConfidence: number): OCRResult;
}

// ─── Confidence Thresholds ───

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 70,
  LOW: 50,
} as const;

export function getConfidenceLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "high";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export function getConfidenceColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high": return "green";
    case "medium": return "amber";
    case "low": return "red";
  }
}
