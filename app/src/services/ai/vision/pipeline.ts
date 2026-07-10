/**
 * Intelligent Vision Pipeline
 * Modular pipeline for processing trading screenshots.
 *
 * Pipeline stages:
 *   Screenshot → OCR → Layout Detection → Chart Region Detection
 *   → Text Region Detection → Symbol Detection → Trade Field Extraction
 *   → AI Vision Provider → Trade Review → Import
 *
 * Every stage is modular and can be swapped independently.
 */

import type { VisionAnalysisResult, VisionRequestOptions } from "./VisionAnalysisResult";
import type { VisionProvider } from "./VisionProvider";
import type { OCRResult } from "@/services/ocr/types";

// ─── Pipeline Stage Types ───

export type PipelineStageName =
  | "ocr"
  | "layout_detection"
  | "region_detection"
  | "text_region_detection"
  | "symbol_detection"
  | "trade_field_extraction"
  | "ai_vision"
  | "trade_review";

export interface PipelineStage<TInput, TOutput> {
  readonly name: PipelineStageName;
  readonly description: string;
  execute(input: TInput, context: PipelineContext): Promise<TOutput>;
  isEnabled(context: PipelineContext): boolean;
}

// ─── Pipeline Context ───

export interface PipelineContext {
  /** Original image file */
  imageFile: File;
  /** User options */
  options: VisionRequestOptions;
  /** Stage results (accumulated) */
  stageResults: Map<PipelineStageName, PipelineStageResult<unknown>>;
  /** Processing metadata */
  metadata: PipelineMetadata;
  /** Abort signal */
  abortSignal?: AbortSignal;
}

export interface PipelineMetadata {
  startTime: number;
  stagesCompleted: PipelineStageName[];
  stagesSkipped: PipelineStageName[];
  errors: PipelineError[];
  performance: StagePerformance[];
}

export interface PipelineStageResult<T> {
  stage: PipelineStageName;
  success: boolean;
  output: T;
  processingTimeMs: number;
  skipped?: boolean;
  error?: string;
}

export interface PipelineError {
  stage: PipelineStageName;
  error: string;
  recoverable: boolean;
}

export interface StagePerformance {
  stage: PipelineStageName;
  durationMs: number;
  memoryEstimateMb?: number;
}

// ─── Pipeline Input/Output ───

export interface PipelineInput {
  imageFile: File;
  options?: VisionRequestOptions;
  abortSignal?: AbortSignal;
  /** Override which stages to run */
  stages?: PipelineStageName[];
}

export interface PipelineOutput {
  /** OCR result (always available) */
  ocrResult: OCRResult | null;
  /** Vision provider result (if available) */
  visionResult: VisionAnalysisResult | null;
  /** Extracted trade data from the pipeline */
  extractedTrade: ExtractedTradeFields | null;
  /** Detected image regions */
  detectedRegions: DetectedImageRegion[];
  /** Detected symbol with source */
  detectedSymbol: DetectedSymbolResult | null;
  /** Overall confidence scores */
  confidence: PipelineConfidenceScores;
  /** Stage results for debugging */
  stageResults: Map<PipelineStageName, PipelineStageResult<unknown>>;
  /** Processing summary */
  metadata: PipelineMetadata;
  /** Whether the pipeline completed successfully */
  success: boolean;
  /** Human-readable summary */
  summary: string;
}

// ─── Extracted Trade Fields ───

export interface ExtractedTradeFields {
  symbol: FieldExtraction<string | null>;
  direction: FieldExtraction<"buy" | "sell" | null>;
  entryPrice: FieldExtraction<number | null>;
  stopLoss: FieldExtraction<number | null>;
  takeProfit: FieldExtraction<number | null>;
  positionSize: FieldExtraction<number | null>;
  broker: FieldExtraction<string | null>;
  overallConfidence: number;
}

export interface FieldExtraction<T> {
  value: T;
  confidence: number;
  source: FieldSource;
  status: FieldExtractionStatus;
  needsReview: boolean;
  alternatives: T[];
}

export type FieldExtractionStatus = "detected" | "missing" | "needs_review" | "inferred";

export type FieldSource =
  | "window_title"
  | "chart_title"
  | "broker_title"
  | "tradingview_header"
  | "mt5_header"
  | "position_panel"
  | "ocr_explicit_label"
  | "ocr_context"
  | "vision_provider"
  | "user_input"
  | "inferred"
  | "none";

// ─── Detected Symbol Result ───

export interface DetectedSymbolResult {
  symbol: string;
  confidence: number;
  source: FieldSource;
  priority: number;
  matchedText: string;
}

// ─── Detected Image Regions ───

export type ImageRegionType =
  | "chart"
  | "toolbar"
  | "price_panel"
  | "position_panel"
  | "broker_header"
  | "window_title"
  | "watermark"
  | "indicator_panel"
  | "timeframe_selector"
  | "order_panel"
  | "watchlist"
  | "status_bar"
  | "menu_bar"
  | "unknown";

export interface DetectedImageRegion {
  id: string;
  type: ImageRegionType;
  /** Normalized coordinates (0-1) */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Area as percentage of image */
  areaPercent: number;
  /** Confidence in region detection */
  confidence: number;
  /** OCR text found in this region */
  extractedText?: string;
  /** Whether this region should be included in analysis */
  includeInAnalysis: boolean;
  /** Priority for symbol detection (lower = higher priority) */
  symbolDetectionPriority: number;
}

// ─── Pipeline Confidence Scores ───

export interface PipelineConfidenceScores {
  ocrQuality: number;
  layoutDetection: number;
  regionDetection: number;
  symbolDetection: number;
  tradeFieldExtraction: number;
  visionProvider: number;
  overall: number;
}

// ─── Pipeline Builder ───

export interface PipelineBuilder {
  withStage<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): PipelineBuilder;
  withoutStage(stageName: PipelineStageName): PipelineBuilder;
  build(): IntelligentVisionPipeline;
}

// ─── Intelligent Vision Pipeline ───

export interface IntelligentVisionPipeline {
  /** Execute the full pipeline */
  execute(input: PipelineInput): Promise<PipelineOutput>;
  /** Execute a single stage */
  executeStage<TInput, TOutput>(
    stageName: PipelineStageName,
    input: TInput,
    context: PipelineContext
  ): Promise<PipelineStageResult<TOutput>>;
  /** Get registered stages */
  getStages(): PipelineStageName[];
  /** Check if a stage is registered */
  hasStage(stageName: PipelineStageName): boolean;
}

// ─── Factory Functions ───

export function createPipelineContext(
  imageFile: File,
  options: VisionRequestOptions = {}
): PipelineContext {
  return {
    imageFile,
    options,
    stageResults: new Map(),
    metadata: {
      startTime: Date.now(),
      stagesCompleted: [],
      stagesSkipped: [],
      errors: [],
      performance: [],
    },
    abortSignal: options.abortSignal,
  };
}

export function createEmptyPipelineOutput(): PipelineOutput {
  return {
    ocrResult: null,
    visionResult: null,
    extractedTrade: null,
    detectedRegions: [],
    detectedSymbol: null,
    confidence: {
      ocrQuality: 0,
      layoutDetection: 0,
      regionDetection: 0,
      symbolDetection: 0,
      tradeFieldExtraction: 0,
      visionProvider: 0,
      overall: 0,
    },
    stageResults: new Map(),
    metadata: {
      startTime: Date.now(),
      stagesCompleted: [],
      stagesSkipped: [],
      errors: [],
      performance: [],
    },
    success: false,
    summary: "Pipeline not executed",
  };
}
