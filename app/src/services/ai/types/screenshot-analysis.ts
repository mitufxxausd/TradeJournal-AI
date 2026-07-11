/**
 * Screenshot Analysis Types
 *
 * Defines all types related to screenshot analysis, OCR trade extraction,
 * AI advice, and image quality assessment.
 */

import type { OCRResult, OCRTrade, OCRConfidence } from "@/services/ocr";

// ─── AI-Extracted Trade Data ───

/**
 * Complete trade data extracted from a trading platform screenshot
 * Includes all relevant fields that can be detected and used for journal entry
 */
export interface ExtractedTradeData {
  /** Trading pair symbol (e.g., EURUSD, XAUUSD) */
  symbol: string;
  /** Trade direction: buy or sell */
  direction: "buy" | "sell" | "unknown";
  /** Entry price */
  entryPrice: number | null;
  /** Stop loss price */
  stopLoss: number | null;
  /** Take profit price */
  takeProfit: number | null;
  /** Position/lot size */
  lotSize: number | null;
  /** Risk percentage of account */
  riskPercent: number | null;
  /** Trading timeframe */
  timeframe: string | null;
  /** Broker platform name */
  broker: string | null;
  /** Trade date */
  date: string | null;
  /** Trade time */
  time: string | null;
  /** Order type (market, limit, stop) */
  orderType: string | null;
  /** Per-field extraction confidence for review UI */
  fieldConfidences: FieldConfidenceDetail[];
  /** Overall extraction confidence percentage */
  overallConfidence: number;
}

// ─── Field-Level Confidence ───

/**
 * Individual field extraction result with confidence
 * Used for the color-coded review UI (green/yellow/red)
 */
export interface FieldConfidenceDetail {
  /** Field name */
  field: string;
  /** Extracted value */
  value: string | number | null;
  /** Confidence score 0-100 */
  confidence: number;
  /** Detection status for color coding */
  status: "detected" | "missing" | "ambiguous";
  /** Source of the extraction */
  source: "ocr" | "ai" | "regex" | "inferred" | "none";
}

// ─── AI Trade Advice ───

/**
 * AI-generated advice about an extracted trade
 */
export interface TradeAdvice {
  /** Risk:Reward ratio if calculable */
  riskReward: number | null;
  /** Human-readable summary */
  summary: string;
  /** Specific advice points */
  points: string[];
  /** Risk assessment */
  riskAssessment: RiskAssessment;
  /** Historical insights from journal */
  journalInsights: JournalInsight | null;
}

/**
 * Risk assessment for the trade
 */
export interface RiskAssessment {
  /** Risk level */
  level: "low" | "medium" | "high";
  /** Stop loss distance in pips */
  slDistance: number | null;
  /** Whether reward exceeds risk */
  rewardExceedsRisk: boolean;
  /** Whether trade structure is healthy */
  tradeStructureHealthy: boolean;
}

/**
 * Journal-based insight for the trade symbol
 */
export interface JournalInsight {
  /** Number of trades for this symbol */
  symbolTradeCount: number;
  /** Win rate percentage for this symbol */
  symbolWinRate: number | null;
  /** Most profitable trading session */
  mostProfitableSession: string | null;
  /** Average R:R for this symbol */
  averageRR: number | null;
  /** Whether this trade matches successful patterns */
  matchesSuccessfulBehavior: boolean;
  /** Human-readable insight message */
  message: string;
}

// ─── Image Quality ───

/**
 * Image quality metrics for OCR accuracy prediction
 */
export interface ImageQualityMetrics {
  /** Overall quality score 0-100 */
  overall: number;
  /** Resolution assessment */
  resolution: { score: number; label: string; width: number; height: number };
  /** Blur assessment */
  blur: { score: number; label: string };
  /** Compression artifacts assessment */
  compression: { score: number; label: string };
  /** Brightness assessment */
  brightness: { score: number; label: string };
  /** Contrast assessment */
  contrast: { score: number; label: string };
  /** Text visibility assessment */
  textVisibility: { score: number; label: string };
  /** Predicted OCR accuracy */
  expectedOCRAccuracy: number;
  /** Human-readable quality explanation */
  explanation: string;
  /** Improvement recommendations */
  recommendations: string[];
}

// ─── Analysis Status ───

export type AnalysisStatus =
  | "processing"
  | "needs_review"
  | "confirmed"
  | "edited"
  | "imported"
  | "rejected"
  | "error";

// ─── Screenshot Analysis ───

/**
 * Complete analysis result for a single screenshot
 * Stored in history and used for review/import workflow
 */
export interface ScreenshotAnalysis {
  /** Unique analysis ID */
  id: string;
  /** Original screenshot as base64 data URL */
  screenshotDataUrl: string;
  /** Cloudinary-hosted image URL */
  imageUrl: string | null;
  /** OCR extracted text */
  ocrText: string;
  /** OCR result */
  ocrResult: OCRResult | null;
  /** Extracted trade data */
  extractedTrade: ExtractedTradeData | null;
  /** AI extraction result with confidence scores */
  aiExtraction: {
    ocrConfidence: number;
    aiConfidence: number;
    overallConfidence: number;
  } | null;
  /** Image quality metrics */
  imageQuality: ImageQualityMetrics | null;
  /** AI trade advice */
  aiAdvice: TradeAdvice | null;
  /** Analysis status */
  status: AnalysisStatus;
  /** Whether the analysis has been reviewed by the user */
  reviewStatus: "pending" | "reviewed" | "edited";
  /** Import status */
  importStatus: "not_imported" | "imported" | "failed";
  /** Linked journal trade ID (set after import) */
  journalTradeId: string | null;
  /** When the analysis was created */
  timestamp: number;
  /** Total processing time in milliseconds */
  processingTimeMs: number;
  /** File name of the original screenshot */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Error message if analysis failed */
  error?: string;
}

// ─── Analysis Confirmation ───

/**
 * User confirmation/edits before importing
 */
export interface AnalysisConfirmation {
  /** Original analysis ID */
  analysisId: string;
  /** User-confirmed trade data */
  confirmedTrade: ExtractedTradeData;
  /** Whether the user made edits */
  wasEdited: boolean;
  /** Which fields were edited */
  editedFields: string[];
  /** User notes */
  notes: string;
  /** Confirmed at timestamp */
  confirmedAt: number;
}

// ─── Workspace Dashboard ───

/**
 * Dashboard statistics for the AI workspace
 */
export interface WorkspaceDashboardStats {
  /** Total screenshots analyzed */
  totalAnalyses: number;
  /** Successfully imported trades */
  importedCount: number;
  /** Analyses pending review */
  pendingReviewCount: number;
  /** Analyses edited by user */
  editedCount: number;
  /** Average OCR confidence */
  averageOCRConfidence: number;
  /** Most analyzed symbol */
  topSymbol: string | null;
  /** Analyses this week */
  thisWeekCount: number;
  /** Average processing time in ms */
  averageProcessingTimeMs: number;
}

// ─── Grouped Analyses ───

/**
 * History analyses grouped by date for the sidebar
 */
export interface GroupedAnalyses {
  /** Date group key (e.g., "2024-01-15") */
  group: string;
  /** Human-readable label (e.g., "Today", "Yesterday") */
  label: string;
  /** Analyses in this group */
  analyses: ScreenshotAnalysis[];
}

// ─── History Filters ───

export interface HistoryFilters {
  symbol?: string;
  status?: AnalysisStatus;
  dateRange?: { from: number; to: number };
  hasErrors?: boolean;
}

// ─── Conversion Utilities ───

/**
 * Convert OCR result trade to extracted trade data
 */
export function ocrTradeToExtractedTrade(ocrTrade: OCRTrade): ExtractedTradeData {
  const fieldConfidences: FieldConfidenceDetail[] = [
    {
      field: "symbol",
      value: ocrTrade.symbol || null,
      confidence: ocrTrade.fieldConfidences?.symbol || 0,
      status: ocrTrade.symbol ? "detected" : "missing",
      source: ocrTrade.symbol ? "ocr" : "none",
    },
    {
      field: "direction",
      value: ocrTrade.direction || null,
      confidence: ocrTrade.fieldConfidences?.direction || 0,
      status:
        ocrTrade.direction && ocrTrade.direction !== "unknown"
          ? "detected"
          : "missing",
      source: ocrTrade.direction ? "ocr" : "none",
    },
    {
      field: "entryPrice",
      value: ocrTrade.entryPrice ?? null,
      confidence: ocrTrade.fieldConfidences?.entryPrice || 0,
      status: ocrTrade.entryPrice !== null ? "detected" : "missing",
      source: ocrTrade.entryPrice !== null ? "ocr" : "none",
    },
    {
      field: "stopLoss",
      value: ocrTrade.stopLoss ?? null,
      confidence: ocrTrade.fieldConfidences?.stopLoss || 0,
      status: ocrTrade.stopLoss !== null ? "detected" : "missing",
      source: ocrTrade.stopLoss !== null ? "ocr" : "none",
    },
    {
      field: "takeProfit",
      value: ocrTrade.takeProfit ?? null,
      confidence: ocrTrade.fieldConfidences?.takeProfit || 0,
      status: ocrTrade.takeProfit !== null ? "detected" : "missing",
      source: ocrTrade.takeProfit !== null ? "ocr" : "none",
    },
    {
      field: "lotSize",
      value: ocrTrade.positionSize ?? null,
      confidence: ocrTrade.fieldConfidences?.positionSize || 0,
      status: ocrTrade.positionSize !== null ? "detected" : "missing",
      source: ocrTrade.positionSize !== null ? "ocr" : "none",
    },
  ];

  return {
    symbol: ocrTrade.symbol || "",
    direction: ocrTrade.direction || "unknown",
    entryPrice: ocrTrade.entryPrice ?? null,
    stopLoss: ocrTrade.stopLoss ?? null,
    takeProfit: ocrTrade.takeProfit ?? null,
    lotSize: ocrTrade.positionSize ?? null,
    riskPercent: null,
    timeframe: null,
    broker: null,
    date: null,
    time: null,
    orderType: null,
    fieldConfidences,
    overallConfidence: 0, // Will be set by caller
  };
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(
  confidence: number
): "high" | "medium" | "low" {
  if (confidence >= 80) return "high";
  if (confidence >= 50) return "medium";
  return "low";
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: AnalysisStatus): string {
  switch (status) {
    case "imported":
      return "green";
    case "confirmed":
    case "edited":
      return "blue";
    case "needs_review":
      return "amber";
    case "rejected":
    case "error":
      return "red";
    case "processing":
      return "purple";
    default:
      return "gray";
  }
}
