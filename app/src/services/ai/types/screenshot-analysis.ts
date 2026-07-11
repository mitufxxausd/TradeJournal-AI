/**
 * Screenshot Analysis Types
 * Phase 7C: AI Trade Extraction, Workspace History & Smart Journal Integration
 *
 * Defines types for persistent screenshot analysis history,
 * image quality metrics, AI trade advice, and journal integration.
 */

import type { OCRResult, OCRQualityMetrics } from "@/services/ocr/types";
import type { ExtractedTradeFields } from "@/services/ai/vision/pipeline";

// ─── Analysis Status ───

export type AnalysisStatus =
  | "processing"
  | "needs_review"
  | "confirmed"
  | "imported"
  | "rejected"
  | "error";

// ─── Image Quality Metrics ───

export interface ImageQualityMetrics {
  /** Overall quality score (0-100) */
  overall: number;
  /** Image resolution assessment */
  resolution: {
    width: number;
    height: number;
    score: number;
    label: "Excellent" | "Good" | "Acceptable" | "Poor";
  };
  /** Blur detection score (0-100, higher = less blur) */
  blur: {
    score: number;
    label: "None" | "Low" | "Medium" | "High";
  };
  /** Compression artifact detection (0-100, higher = less compression) */
  compression: {
    score: number;
    label: "None" | "Low" | "Medium" | "High";
  };
  /** Brightness assessment (0-100) */
  brightness: {
    score: number;
    label: "Too Dark" | "Dark" | "Optimal" | "Bright" | "Too Bright";
  };
  /** Contrast assessment (0-100) */
  contrast: {
    score: number;
    label: "Low" | "Medium" | "High";
  };
  /** Text visibility score (0-100) */
  textVisibility: {
    score: number;
    label: "Excellent" | "Good" | "Fair" | "Poor";
  };
  /** Expected OCR accuracy based on quality (0-100) */
  expectedOCRAccuracy: number;
  /** Human-readable explanation of quality issues */
  explanation: string;
  /** Specific recommendations for improving screenshot quality */
  recommendations: string[];
}

// ─── Field Confidence ───

export interface FieldConfidenceDetail {
  field: string;
  value: unknown;
  confidence: number;
  status: "detected" | "needs_review" | "missing";
  source: string;
}

// ─── Extracted Trade Data ───

export interface ExtractedTradeData {
  symbol: string;
  direction: "buy" | "sell" | "" | "unknown";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number | null;
  riskPercent: number | null;
  timeframe: string | null;
  broker: string | null;
  date: string | null;
  time: string | null;
  orderType: string | null;
  /** Per-field confidence scores */
  fieldConfidences: FieldConfidenceDetail[];
  /** Overall extraction confidence (0-100) */
  overallConfidence: number;
}

// ─── AI Trade Advice ───

export interface TradeAdvice {
  /** Risk:Reward ratio */
  riskReward: number | null;
  /** Human-readable advice summary */
  summary: string;
  /** Detailed advice points */
  points: string[];
  /** Risk assessment */
  riskAssessment: {
    level: "low" | "medium" | "high";
    slDistance: number | null;
    rewardExceedsRisk: boolean;
    tradeStructureHealthy: boolean;
  };
  /** Journal-based insights (if history exists) */
  journalInsights: JournalInsight | null;
}

export interface JournalInsight {
  /** Number of previous trades on this symbol */
  symbolTradeCount: number;
  /** Win rate for this symbol (0-100) */
  symbolWinRate: number | null;
  /** Most profitable session for this symbol */
  mostProfitableSession: string | null;
  /** Average R:R for this symbol */
  averageRR: number | null;
  /** Whether this trade matches successful behavior */
  matchesSuccessfulBehavior: boolean;
  /** Personalized message */
  message: string;
}

// ─── Screenshot Analysis Record ───

export interface ScreenshotAnalysis {
  /** Unique analysis ID */
  id: string;
  /** Original screenshot as base64 data URL */
  screenshotDataUrl: string;
  /** Persistent Cloudinary URL for the screenshot (survives page refresh) */
  imageUrl: string | null;
  /** OCR extracted text */
  ocrText: string;
  /** OCR result */
  ocrResult: OCRResult | null;
  /** Extracted trade data */
  extractedTrade: ExtractedTradeData | null;
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

// ─── Analysis History ───

export interface AnalysisHistory {
  /** All analyses, sorted by timestamp descending */
  analyses: ScreenshotAnalysis[];
  /** Maximum number of analyses to keep (default: 100) */
  maxItems: number;
}

// ─── Workspace Dashboard Statistics ───

export interface WorkspaceDashboardStats {
  /** Total number of analyses */
  totalAnalyses: number;
  /** Number of imported analyses */
  importedCount: number;
  /** Number of analyses pending review */
  pendingReviewCount: number;
  /** Number of rejected analyses */
  rejectedCount: number;
  /** Average extraction confidence (0-100) */
  averageConfidence: number;
  /** Average OCR accuracy (0-100) */
  averageOCRAccuracy: number;
  /** Most traded symbol */
  mostTradedSymbol: string | null;
  /** Recent activity (last 7 days) */
  recentActivity: {
    date: string;
    count: number;
    imported: number;
  }[];
}

// ─── History Grouping ───

export type HistoryGroup = "today" | "yesterday" | "this_week" | "this_month" | "older";

export interface GroupedAnalyses {
  group: HistoryGroup;
  label: string;
  analyses: ScreenshotAnalysis[];
}

// ─── Utility Types ───

export interface HistoryFilters {
  status?: AnalysisStatus;
  symbol?: string;
  dateFrom?: number;
  dateTo?: number;
  searchQuery?: string;
}

export interface HistorySort {
  field: "timestamp" | "confidence" | "status" | "symbol";
  direction: "asc" | "desc";
}
