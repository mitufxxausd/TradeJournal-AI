/**
 * Trade Fusion Engine
 * Combines OCR, Parser, and future Vision Provider outputs into a unified
 * trade candidate for user review.
 *
 * Architecture:
 *   Screenshot → OCR Text Extraction → Parser → TradeFusionEngine → Review → Import
 *                                          ↑
 *                           Future: AI Vision Provider (optional)
 *
 * Rules:
 * - OCR is ALWAYS the primary source in the free tier
 * - Vision provider results override OCR only when explicitly configured
 * - Every field tracks its source and confidence independently
 * - Fields with low confidence are flagged for user review
 * - Never invents data - if a field is not detected, it remains null
 */

import type {
  FusionResult,
  FusionEngineConfig,
  FusedTradeCandidate,
  FusedField,
  FieldSource,
  FusionMetadata,
  VisionAnalysisOutput,
  FusionProgress,
  FusionStatus,
  VisionProviderStatus,
} from "./types";
import { DEFAULT_FUSION_CONFIG } from "./types";
import type { OCRResult, OCRTrade, OCRQualityMetrics } from "@/services/ocr/types";

const ENGINE_VERSION = "1.0.0";

// ─── Internal State ───

let currentConfig: FusionEngineConfig = { ...DEFAULT_FUSION_CONFIG };

// ─── Utility: Create a fused field ───

function createField<T>(
  value: T | null,
  confidence: number,
  source: FieldSource,
  hasExplicitLabel: boolean = false,
  note?: string
): FusedField<T> {
  const needsReview =
    value === null || confidence < currentConfig.minConfidenceThreshold || !hasExplicitLabel;

  return {
    value,
    confidence,
    source,
    hasExplicitLabel,
    needsReview,
    note,
  };
}

// ─── Fuse a single OCR trade into a candidate ───

function fuseOCRTrade(
  trade: OCRTrade,
  ocrMetrics: OCRQualityMetrics | null,
  index: number,
  imageId: string
): FusedTradeCandidate {
  const symbolField = createField<string>(
    trade.symbol || null,
    trade.fieldConfidences.symbol,
    { source: "ocr", confidence: trade.fieldConfidences.symbol, provider: "tesseract" },
    trade.fieldConfidences.symbol > 0.8,
    trade.symbol ? undefined : "Symbol not detected - please enter manually"
  );

  const directionField = createField<"buy" | "sell">(
    trade.direction === "unknown"
      ? null
      : trade.direction,
    trade.fieldConfidences.direction,
    { source: "ocr", confidence: trade.fieldConfidences.direction, provider: "parser" },
    trade.fieldConfidences.direction > 0.8
  );

  const entryField = createField<number>(
    trade.entryPrice,
    trade.fieldConfidences.entryPrice,
    { source: "ocr", confidence: trade.fieldConfidences.entryPrice, provider: "parser" },
    trade.fieldConfidences.entryPrice > 0.7
  );

  const slField = createField<number>(
    trade.stopLoss,
    trade.fieldConfidences.stopLoss,
    { source: "ocr", confidence: trade.fieldConfidences.stopLoss, provider: "parser" },
    trade.fieldConfidences.stopLoss > 0.7
  );

  const tpField = createField<number>(
    trade.takeProfit,
    trade.fieldConfidences.takeProfit,
    { source: "ocr", confidence: trade.fieldConfidences.takeProfit, provider: "parser" },
    trade.fieldConfidences.takeProfit > 0.7,
    trade.takeProfit === null
      ? "Take Profit not detected - only explicit TP labels are accepted"
      : undefined
  );

  const sizeField = createField<number>(
    trade.positionSize,
    trade.fieldConfidences.positionSize,
    { source: "ocr", confidence: trade.fieldConfidences.positionSize, provider: "parser" },
    trade.fieldConfidences.positionSize > 0.7
  );

  const rrField = createField<number>(
    trade.riskReward,
    trade.riskReward ? 0.9 : 0,
    { source: "inferred", confidence: trade.riskReward ? 0.9 : 0, provider: "calculator" },
    trade.riskReward !== null
  );

  const fields = [symbolField, directionField, entryField, slField, tpField, sizeField];
  const detectedCount = fields.filter((f) => f.value !== null).length;
  const totalFields = 6;

  const overallConfidence = Math.round(
    (fields.reduce((sum, f) => sum + f.confidence, 0) / totalFields) * 100
  );

  const completenessScore = Math.round((detectedCount / totalFields) * 100);

  const metadata: FusionMetadata = {
    ocrProcessingTimeMs: 0,
    totalProcessingTimeMs: 0,
    fusionEngineVersion: ENGINE_VERSION,
    processedAt: new Date().toISOString(),
  };

  return {
    id: `${imageId}_candidate_${index}`,
    symbol: symbolField,
    direction: directionField,
    entryPrice: entryField,
    stopLoss: slField,
    takeProfit: tpField,
    positionSize: sizeField,
    riskReward: rrField,
    broker: createField<string>(null, 0, { source: "ocr", confidence: 0, provider: "parser" }, false),
    timeframe: createField<string>(null, 0, { source: "ocr", confidence: 0, provider: "parser" }, false),
    timestamp: createField<string>(null, 0, { source: "ocr", confidence: 0, provider: "parser" }, false),
    overallConfidence,
    completenessScore,
    sources: ["ocr"],
    ocrMetrics,
    visionMetrics: null,
    metadata,
  };
}

// ─── Calculate Fusion Progress ───

export function getFusionProgress(
  ocrComplete: boolean,
  visionComplete: boolean,
  config: FusionEngineConfig
): FusionProgress {
  const totalSteps = config.enableVision ? 3 : 2;
  let completedSteps = ocrComplete ? 1 : 0;
  if (visionComplete) completedSteps += 1;
  // Fusion step
  if (ocrComplete && (!config.enableVision || visionComplete)) completedSteps += 1;

  const progress = Math.round((completedSteps / totalSteps) * 100);

  let status: FusionStatus = "idle";
  let message = "Waiting to start";

  if (!ocrComplete) {
    status = "extracting_ocr";
    message = "Extracting text with OCR...";
  } else if (config.enableVision && !visionComplete) {
    status = "analyzing_vision";
    message = "Analyzing with AI Vision...";
  } else if (ocrComplete && (!config.enableVision || visionComplete)) {
    status = "fusing";
    message = "Combining analysis results...";
  }

  return { status, progress, message, ocrComplete, visionComplete };
}

// ─── Main Fusion Function ───

/**
 * Run the fusion pipeline combining OCR and optional Vision analysis.
 * This is the primary entry point for the Trade Fusion Engine.
 */
export async function runFusion(
  _imageFile: File,
  ocrResult: OCRResult,
  visionOutput: VisionAnalysisOutput | null = null,
  config: Partial<FusionEngineConfig> = {}
): Promise<FusionResult> {
  const mergedConfig = { ...currentConfig, ...config };
  const startTime = Date.now();
  const warnings: string[] = [];

  // Validate OCR result
  if (!ocrResult || (!ocrResult.rawText && ocrResult.trades.length === 0)) {
    warnings.push("No text detected in the screenshot. Try a clearer image.");
    return {
      candidates: [],
      ocrResult,
      visionResult: visionOutput,
      config: mergedConfig,
      warnings,
    };
  }

  // If no trades detected from OCR but text exists
  if (ocrResult.trades.length === 0 && ocrResult.rawText) {
    warnings.push("Text was detected but no trade fields could be extracted. Ensure the screenshot shows order details with clear labels (Entry, SL, TP, etc.).");
  }

  // Build candidates from OCR trades
  const candidates: FusedTradeCandidate[] = ocrResult.trades.map((trade, index) =>
    fuseOCRTrade(trade, ocrResult.qualityMetrics || null, index, "img")
  );

  // If Vision provider output exists, enhance candidates
  if (visionOutput && !visionOutput.isStub) {
    for (const candidate of candidates) {
      enhanceWithVision(candidate, visionOutput);
    }
  }

  // Add warning if confidence is low
  if (candidates.length > 0) {
    const avgConfidence =
      candidates.reduce((sum, c) => sum + c.overallConfidence, 0) / candidates.length;
    if (avgConfidence < 50) {
      warnings.push("Low overall confidence. Please review all fields carefully before importing.");
    } else if (avgConfidence < 75) {
      warnings.push("Medium confidence. Some fields may need verification.");
    }
  }

  const totalProcessingTimeMs = Date.now() - startTime;

  // Update metadata
  for (const candidate of candidates) {
    candidate.metadata = {
      ...candidate.metadata,
      ocrProcessingTimeMs: ocrResult.processingTimeMs,
      totalProcessingTimeMs,
    };
  }

  return {
    candidates,
    ocrResult,
    visionResult: visionOutput,
    config: mergedConfig,
    warnings,
  };
}

// ─── Enhance Candidate with Vision Output ───

function enhanceWithVision(
  candidate: FusedTradeCandidate,
  vision: VisionAnalysisOutput
): void {
  // Only override if vision has higher confidence and value exists
  if (vision.detectedSymbol && (!candidate.symbol.value || vision.confidence > candidate.symbol.confidence)) {
    candidate.symbol = createField(
      vision.detectedSymbol,
      vision.confidence,
      { source: "vision", confidence: vision.confidence, provider: vision.provider },
      true,
      "Detected by AI Vision"
    );
  }

  if (vision.detectedDirection && !candidate.direction.value) {
    candidate.direction = createField(
      vision.detectedDirection,
      vision.confidence,
      { source: "vision", confidence: vision.confidence, provider: vision.provider },
      true
    );
  }

  if (vision.detectedEntryPrice && !candidate.entryPrice.value) {
    candidate.entryPrice = createField(
      vision.detectedEntryPrice,
      vision.confidence,
      { source: "vision", confidence: vision.confidence, provider: vision.provider },
      true
    );
  }

  if (vision.detectedStopLoss && !candidate.stopLoss.value) {
    candidate.stopLoss = createField(
      vision.detectedStopLoss,
      vision.confidence,
      { source: "vision", confidence: vision.confidence, provider: vision.provider },
      true
    );
  }

  if (vision.detectedTakeProfit && !candidate.takeProfit.value) {
    candidate.takeProfit = createField(
      vision.detectedTakeProfit,
      vision.confidence,
      { source: "vision", confidence: vision.confidence, provider: vision.provider },
      true
    );
  }

  if (vision.detectedPositionSize && !candidate.positionSize.value) {
    candidate.positionSize = createField(
      vision.detectedPositionSize,
      vision.confidence,
      { source: "vision", confidence: vision.confidence, provider: vision.provider },
      true
    );
  }

  // Recalculate overall confidence
  const fields = [
    candidate.symbol,
    candidate.direction,
    candidate.entryPrice,
    candidate.stopLoss,
    candidate.takeProfit,
    candidate.positionSize,
  ];
  candidate.overallConfidence = Math.round(
    (fields.reduce((sum, f) => sum + f.confidence, 0) / 6) * 100
  );

  // Add vision to sources if not already present
  if (!candidate.sources.includes("vision")) {
    candidate.sources.push("vision");
  }

  // Set vision metrics
  candidate.visionMetrics = {
    provider: vision.provider,
    model: vision.model,
    isRealProvider: !vision.isStub,
    processingTimeMs: vision.processingTimeMs,
  };
}

// ─── Configuration Management ───

export function getFusionConfig(): FusionEngineConfig {
  return { ...currentConfig };
}

export function updateFusionConfig(config: Partial<FusionEngineConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

export function resetFusionConfig(): void {
  currentConfig = { ...DEFAULT_FUSION_CONFIG };
}

// ─── Vision Provider Status ───

export function getVisionProviderStatus(): VisionProviderStatus {
  return {
    currentProvider: "OCR Only (Tesseract)",
    isAvailable: true,
    isRealProvider: false,
    supportedProviders: [
      "OpenAI Vision",
      "Google Gemini Vision",
      "Anthropic Claude Vision",
      "OpenRouter Vision",
    ],
  };
}
