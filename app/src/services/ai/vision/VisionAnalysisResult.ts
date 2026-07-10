/**
 * Vision Analysis Result Types
 * Comprehensive result types for AI Vision analysis of trading screenshots.
 *
 * These types represent the output of a VisionProvider after analyzing
 * a chart or broker screenshot. They are designed to work alongside
 * OCR results in the TradeFusionEngine.
 */

import type {
  DetectedChartPattern,
  DetectedLevel,
  TrendAnalysis,
  DetectedCandlestickPattern,
  DetectedIndicator,
  DetectedTradeAnnotation,
  VolumeAnalysis,
  TimeframeDetection,
  PlatformDetection,
  VisionFeatureConfidence,
} from "./VisionFeatureTypes";

// ─── Vision Provider Information ───

export interface VisionProviderInfo {
  /** Provider display name */
  name: string;
  /** Provider identifier */
  providerId: string;
  /** Model used for analysis */
  model: string;
  /** Whether this is a real provider or mock/stub */
  isRealProvider: boolean;
  /** Provider version */
  version?: string;
}

// ─── Trade Data Extraction ───

export interface VisionExtractedTradeData {
  /** Trading symbol/pair */
  symbol: string | null;
  /** Trade direction */
  direction: "buy" | "sell" | null;
  /** Entry price */
  entryPrice: number | null;
  /** Stop loss price */
  stopLoss: number | null;
  /** Take profit price */
  takeProfit: number | null;
  /** Position/lot size */
  positionSize: number | null;
  /** Risk-reward ratio */
  riskReward: number | null;
  /** Broker name */
  broker: string | null;
  /** Confidence for each field */
  fieldConfidence: VisionFieldConfidence;
  /** Overall extraction confidence */
  overallConfidence: number;
}

export interface VisionFieldConfidence {
  symbol: number;
  direction: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
}

// ─── Chart Analysis Result ───

export interface VisionChartAnalysis {
  /** Detected chart patterns */
  patterns: DetectedChartPattern[];
  /** Support and resistance levels */
  levels: DetectedLevel[];
  /** Trend analysis */
  trend: TrendAnalysis;
  /** Detected candlestick patterns */
  candlestickPatterns: DetectedCandlestickPattern[];
  /** Detected indicators */
  indicators: DetectedIndicator[];
  /** Volume analysis */
  volume?: VolumeAnalysis;
  /** Timeframe information */
  timeframe: TimeframeDetection;
  /** Platform/broker detection */
  platform?: PlatformDetection;
  /** Overall market bias */
  overallBias: "bullish" | "bearish" | "neutral";
  /** Summary text */
  summary: string;
  /** Overall confidence */
  confidence: VisionFeatureConfidence;
}

// ─── Complete Vision Analysis Result ───

export type VisionAnalysisType = "chart_analysis" | "trade_extraction" | "full_analysis";

export interface VisionAnalysisResult {
  /** Whether the analysis was successful */
  success: boolean;
  /** Type of analysis performed */
  analysisType: VisionAnalysisType;
  /** Provider information */
  provider: VisionProviderInfo;
  /** Extracted trade data (if trade_extraction or full_analysis) */
  tradeData: VisionExtractedTradeData | null;
  /** Chart analysis (if chart_analysis or full_analysis) */
  chartAnalysis: VisionChartAnalysis | null;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Timestamp of analysis */
  analyzedAt: string;
  /** Error message if analysis failed */
  error?: string;
  /** Warnings */
  warnings: string[];
}

// ─── Vision Request Options ───

export interface VisionRequestOptions {
  /** Type of analysis to perform */
  analysisType?: VisionAnalysisType;
  /** Specific features to detect (if empty, detect all) */
  features?: VisionFeatureType[];
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
  /** Whether to include raw image annotations in result */
  includeAnnotations?: boolean;
  /** Whether to include confidence breakdown */
  includeConfidence?: boolean;
  /** User's preferred trading style for context */
  tradingStyle?: "scalping" | "day_trading" | "swing_trading" | "position_trading";
  /** Additional context about the screenshot */
  context?: {
    knownSymbol?: string;
    knownTimeframe?: string;
    broker?: string;
  };
}

/** Types of vision features that can be requested */
export type VisionFeatureType =
  | "patterns"
  | "levels"
  | "trend"
  | "candlestick_patterns"
  | "indicators"
  | "volume"
  | "annotations"
  | "trade_data"
  | "platform";

// ─── Vision Batch Result ───

export interface VisionBatchResult {
  /** Individual results */
  results: VisionAnalysisResult[];
  /** Overall success */
  overallSuccess: boolean;
  /** Total processing time */
  totalProcessingTimeMs: number;
  /** Results that succeeded */
  successCount: number;
  /** Results that failed */
  failureCount: number;
}

// ─── Vision Feature Flag ───

export interface VisionFeatureFlags {
  /** Whether chart pattern detection is enabled */
  patterns: boolean;
  /** Whether support/resistance detection is enabled */
  levels: boolean;
  /** Whether trend analysis is enabled */
  trend: boolean;
  /** Whether candlestick pattern recognition is enabled */
  candlestickPatterns: boolean;
  /** Whether indicator detection is enabled */
  indicators: boolean;
  /** Whether volume analysis is enabled */
  volume: boolean;
  /** Whether trade annotation detection is enabled */
  annotations: boolean;
  /** Whether trade data extraction is enabled */
  tradeData: boolean;
  /** Whether platform detection is enabled */
  platform: boolean;
}

export const DEFAULT_VISION_FEATURE_FLAGS: VisionFeatureFlags = {
  patterns: true,
  levels: true,
  trend: true,
  candlestickPatterns: true,
  indicators: true,
  volume: true,
  annotations: true,
  tradeData: true,
  platform: true,
};

// ─── Legacy compatibility type ───

/**
 * @deprecated Use VisionAnalysisResult instead. Kept for backward compatibility.
 * Will be removed in a future version.
 */
export type LegacyVisionAnalysisResult = VisionAnalysisResult;
