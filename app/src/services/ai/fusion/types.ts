/**
 * Trade Fusion Engine Types
 * Defines the interfaces for combining OCR, Parser, and Vision Provider outputs
 * into a single unified trade candidate.
 *
 * Architecture:
 *   Screenshot → OCR Text + Vision Analysis → TradeFusionEngine → Review Trade → Import
 *
 * The fusion engine combines multiple analysis sources intelligently,
 * preferring explicit labels over inferred values, and Vision provider
 * output over OCR when a Vision provider is configured.
 */

import type { OCRResult, OCRQualityMetrics } from "@/services/ocr/types";

// ─── Fusion Engine Configuration ───

export interface FusionEngineConfig {
  /** Whether to use Vision provider when available */
  enableVision: boolean;
  /** Whether to use OCR (always true for free tier) */
  enableOCR: boolean;
  /** Primary source preference: "ocr" | "vision" | "auto" */
  primarySource: "ocr" | "vision" | "auto";
  /** Minimum confidence threshold for auto-accepting a field */
  minConfidenceThreshold: number;
  /** Whether to require explicit labels for price fields */
  requireExplicitPriceLabels: boolean;
}

// ─── Analysis Source ───

export type AnalysisSource = "ocr" | "vision" | "manual" | "inferred";

export interface FieldSource {
  source: AnalysisSource;
  confidence: number;
  /** Which provider/module produced this value */
  provider: string;
}

// ─── Fused Trade Field ───

export interface FusedField<T> {
  value: T | null;
  confidence: number;
  source: FieldSource;
  /** Whether this field was explicitly labeled in the screenshot */
  hasExplicitLabel: boolean;
  /** Whether the field needs user review */
  needsReview: boolean;
  /** Human-readable note about this field */
  note?: string;
}

// ─── Fused Trade Candidate ───

export interface FusedTradeCandidate {
  id: string;
  symbol: FusedField<string>;
  direction: FusedField<"buy" | "sell">;
  entryPrice: FusedField<number>;
  stopLoss: FusedField<number>;
  takeProfit: FusedField<number>;
  positionSize: FusedField<number>;
  riskReward: FusedField<number>;
  broker: FusedField<string>;
  timeframe: FusedField<string>;
  timestamp: FusedField<string>;
  /** Overall confidence score (0-100) */
  overallConfidence: number;
  /** Overall completeness score (0-100) */
  completenessScore: number;
  /** Which sources contributed to this candidate */
  sources: AnalysisSource[];
  /** Quality metrics from OCR */
  ocrMetrics: OCRQualityMetrics | null;
  /** Vision provider metrics (null if no vision provider) */
  visionMetrics: VisionConfidenceMetrics | null;
  /** Processing metadata */
  metadata: FusionMetadata;
}

// ─── Vision Confidence Metrics ───

export interface VisionConfidenceMetrics {
  /** Provider name that performed the analysis */
  provider: string;
  /** Model used */
  model: string;
  /** Whether the provider is real (not a stub) */
  isRealProvider: boolean;
  /** Processing time in ms */
  processingTimeMs: number;
}

// ─── Fusion Metadata ───

export interface FusionMetadata {
  ocrProcessingTimeMs: number;
  visionProcessingTimeMs?: number;
  totalProcessingTimeMs: number;
  fusionEngineVersion: string;
  processedAt: string;
}

// ─── Fusion Result ───

export interface FusionResult {
  /** The fused trade candidates */
  candidates: FusedTradeCandidate[];
  /** Raw OCR result (always available) */
  ocrResult: OCRResult | null;
  /** Vision analysis result (null if not used) */
  visionResult: VisionAnalysisOutput | null;
  /** Engine configuration used */
  config: FusionEngineConfig;
  /** Any warnings or messages */
  warnings: string[];
}

// ─── Vision Analysis Output (placeholder for future) ───

export interface VisionAnalysisOutput {
  provider: string;
  model: string;
  detectedSymbol: string | null;
  detectedDirection: "buy" | "sell" | null;
  detectedEntryPrice: number | null;
  detectedStopLoss: number | null;
  detectedTakeProfit: number | null;
  detectedPositionSize: number | null;
  chartPatterns: DetectedChartPattern[];
  summary: string | null;
  confidence: number;
  processingTimeMs: number;
  isStub: boolean;
}

export interface DetectedChartPattern {
  pattern: string;
  confidence: number;
  location: string;
}

// ─── Fusion Engine Interface ───

export interface TradeFusionEngine {
  readonly version: string;
  /** Run the fusion pipeline on a screenshot */
  fuse(imageFile: File, ocrResult: OCRResult, config?: Partial<FusionEngineConfig>): Promise<FusionResult>;
  /** Get current configuration */
  getConfig(): FusionEngineConfig;
  /** Update configuration */
  updateConfig(config: Partial<FusionEngineConfig>): void;
}

// ─── Default Configuration ───

export const DEFAULT_FUSION_CONFIG: FusionEngineConfig = {
  enableVision: false,
  enableOCR: true,
  primarySource: "ocr",
  minConfidenceThreshold: 0.6,
  requireExplicitPriceLabels: true,
};

// ─── Fusion Status ───

export type FusionStatus =
  | "idle"
  | "extracting_ocr"
  | "analyzing_vision"
  | "fusing"
  | "completed"
  | "error";

export interface FusionProgress {
  status: FusionStatus;
  progress: number;
  message: string;
  ocrComplete: boolean;
  visionComplete: boolean;
}

// ─── Vision Provider Status ───

export interface VisionProviderStatus {
  currentProvider: string;
  isAvailable: boolean;
  isRealProvider: boolean;
  supportedProviders: string[];
}
