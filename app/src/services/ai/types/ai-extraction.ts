/**
 * AI Extraction Types
 * Phase 7D-1: AI-powered trade extraction from OCR text
 *
 * Defines types for the AI extraction layer that sits between
 * OCR output and structured trade data.
 */

// ─── AI Extracted Trade Fields ───

export interface AIExtractedTrade {
  /** Trading symbol (e.g., EURUSD, XAUUSD) */
  symbol: string;
  /** Trade direction */
  side: "buy" | "sell" | "";
  /** Entry price */
  entry: number | null;
  /** Stop loss price */
  sl: number | null;
  /** Take profit price */
  tp: number | null;
  /** Position size / lot size */
  positionSize: number | null;
  /** Risk percentage */
  riskPercent: number | null;
  /** Broker name */
  broker: string | null;
  /** Timeframe */
  timeframe: string | null;
  /** Order type (market, limit, stop) */
  orderType: string | null;
}

// ─── Confidence Scores ───

export interface AIConfidenceScores {
  /** OCR engine confidence (0-100) */
  ocr: number;
  /** AI extraction confidence (0-100) */
  ai: number;
  /** Overall confidence combining OCR + AI (0-100) */
  overall: number;
}

// ─── AI Trade Advice ───

export interface AITradeAdviceItem {
  category: "risk" | "rr" | "mistake" | "suggestion" | "quality";
  severity: "info" | "warning" | "error" | "success";
  message: string;
}

export interface AIAdviceResult {
  /** Risk assessment summary */
  risk: string;
  /** Risk:Reward ratio */
  rr: number | null;
  /** List of mistakes detected */
  mistakes: string[];
  /** List of suggestions */
  suggestions: string[];
  /** Trade quality score (0-100) */
  quality: number;
  /** Detailed advice items */
  items: AITradeAdviceItem[];
}

// ─── AI Extraction Result ───

export interface AIExtractionResult {
  /** Cloudinary image URL */
  imageUrl: string | null;
  /** Raw OCR text */
  ocrText: string;
  /** AI-extracted trade data */
  trade: AIExtractedTrade;
  /** Confidence scores */
  confidence: AIConfidenceScores;
  /** AI-generated advice */
  advice: AIAdviceResult;
  /** When the analysis completed */
  analysisTime: string;
  /** Processing time in ms */
  processingTimeMs: number;
  /** AI provider used */
  provider: string;
  /** Model used */
  model: string;
}

// ─── AI Extraction Request ───

export interface AIExtractionRequest {
  /** Raw OCR text to analyze */
  ocrText: string;
  /** Optional: Cloudinary image URL for context */
  imageUrl?: string;
  /** Optional: Original image file for vision analysis */
  imageFile?: File;
  /** Optional: Additional context */
  context?: string;
}

// ─── AI Extraction Options ───

export interface AIExtractionOptions {
  /** Request timeout in ms */
  timeoutMs?: number;
  /** Number of retries */
  retries?: number;
  /** Abort signal */
  abortSignal?: AbortSignal;
  /** Whether to generate advice */
  includeAdvice?: boolean;
  /** Whether to use vision on the image in addition to OCR text */
  useVision?: boolean;
}

// ─── AI Extraction Error ───

export class AIExtractionError extends Error {
  public readonly code: AIExtractionErrorCode;
  public readonly cause?: unknown;

  constructor(code: AIExtractionErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "AIExtractionError";
    this.code = code;
    this.cause = cause;
  }
}

export type AIExtractionErrorCode =
  | "TIMEOUT"
  | "INVALID_JSON"
  | "AI_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "OCR_FAILED"
  | "NO_PROVIDER"
  | "ABORTED";

// ─── Raw AI Response ───

export interface RawAIExtractionResponse {
  symbol?: string;
  side?: string;
  entry?: number | null;
  sl?: number | null;
  tp?: number | null;
  positionSize?: number | null;
  riskPercent?: number | null;
  broker?: string | null;
  timeframe?: string | null;
  orderType?: string | null;
  confidence?: number | null;
  advice?: {
    risk?: string;
    rr?: number | null;
    mistakes?: string[];
    suggestions?: string[];
    quality?: number;
  } | null;
}
