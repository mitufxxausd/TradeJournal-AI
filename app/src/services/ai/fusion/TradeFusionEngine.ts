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
import type { VisionProvider } from "@/services/ai/vision/VisionProvider";
import type { VisionAnalysisResult, VisionExtractedTradeData } from "@/services/ai/vision/VisionAnalysisResult";
import { getVisionProviderRegistry } from "@/services/ai/vision/VisionProviderRegistry";
import {
  MockVisionProvider,
  OpenAIVisionProvider,
  GeminiVisionProvider,
  ClaudeVisionProvider,
  OpenRouterVisionProvider,
} from "@/services/ai/vision/providers";

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
      visionAnalysisResult: null,
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
    visionAnalysisResult: null,
    config: mergedConfig,
    warnings,
  };
}

// ─── New: Run Fusion with Vision Provider Integration ───

/**
 * Run the fusion pipeline with optional VisionProvider integration.
 * This is the enhanced entry point that supports the new VisionProvider architecture.
 *
 * If vision is enabled and a provider is available, it will run vision analysis
 * alongside OCR and combine results. OCR always runs as fallback.
 *
 * @param imageFile - The screenshot image file
 * @param ocrResult - OCR extraction result (always required as fallback)
 * @param visionProvider - Optional specific vision provider to use
 * @param config - Optional fusion configuration overrides
 */
export async function runFusionWithVisionProvider(
  imageFile: File,
  ocrResult: OCRResult,
  visionProvider?: VisionProvider | null,
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
      visionResult: null,
      visionAnalysisResult: null,
      config: mergedConfig,
      warnings,
    };
  }

  // If no trades detected from OCR but text exists
  if (ocrResult.trades.length === 0 && ocrResult.rawText) {
    warnings.push("Text was detected but no trade fields could be extracted. Ensure the screenshot shows order details with clear labels (Entry, SL, TP, etc.).");
  }

  // Build candidates from OCR trades (always do this as baseline)
  const candidates: FusedTradeCandidate[] = ocrResult.trades.map((trade, index) =>
    fuseOCRTrade(trade, ocrResult.qualityMetrics || null, index, "img")
  );

  // Try vision analysis if enabled
  let visionAnalysisResult: VisionAnalysisResult | null = null;
  let legacyVisionOutput: VisionAnalysisOutput | null = null;

  if (mergedConfig.enableVision) {
    const provider = visionProvider ?? getVisionProviderRegistry().getPrimaryProvider();

    if (provider) {
      try {
        const visionStart = Date.now();
        visionAnalysisResult = await provider.analyze(imageFile, {
          analysisType: "full_analysis",
          timeoutMs: 30000,
        });
        const visionTime = Date.now() - visionStart;

        if (visionAnalysisResult.success && visionAnalysisResult.tradeData) {
          // Convert to legacy format for backward compatibility
          legacyVisionOutput = convertVisionResultToLegacy(visionAnalysisResult, visionTime);

          // Enhance candidates with vision data
          for (const candidate of candidates) {
            enhanceWithVisionData(candidate, visionAnalysisResult.tradeData, visionAnalysisResult.provider.providerId);
          }

          // Update metadata with vision info
          const providerInfo = visionAnalysisResult.provider;
          for (const candidate of candidates) {
            candidate.metadata = {
              ...candidate.metadata,
              visionProcessingTimeMs: visionTime,
              visionProviderId: providerInfo.providerId,
              visionProviderReal: providerInfo.isRealProvider,
            };
            candidate.visionMetrics = {
              provider: providerInfo.name,
              model: providerInfo.model,
              isRealProvider: providerInfo.isRealProvider,
              processingTimeMs: visionTime,
            };
            if (!candidate.sources.includes("vision")) {
              candidate.sources.push("vision");
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Vision analysis failed";
        warnings.push(`Vision analysis error: ${message}. Falling back to OCR only.`);
        console.warn("[TradeFusionEngine] Vision analysis failed:", message);
      }
    } else if (mergedConfig.enableVision) {
      warnings.push("Vision is enabled but no provider is available. Using OCR only.");
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
    visionResult: legacyVisionOutput,
    visionAnalysisResult,
    config: mergedConfig,
    warnings,
  };
}

// ─── Convert new VisionAnalysisResult to legacy VisionAnalysisOutput ───

function convertVisionResultToLegacy(
  result: VisionAnalysisResult,
  processingTimeMs: number
): VisionAnalysisOutput {
  const tradeData = result.tradeData;
  return {
    provider: result.provider.name,
    model: result.provider.model,
    detectedSymbol: tradeData?.symbol ?? null,
    detectedDirection: tradeData?.direction ?? null,
    detectedEntryPrice: tradeData?.entryPrice ?? null,
    detectedStopLoss: tradeData?.stopLoss ?? null,
    detectedTakeProfit: tradeData?.takeProfit ?? null,
    detectedPositionSize: tradeData?.positionSize ?? null,
    chartPatterns: result.chartAnalysis?.patterns.map((p) => ({
      pattern: p.name,
      confidence: p.confidence.score,
      location: p.region ? `${p.region.x1.toFixed(2)},${p.region.y1.toFixed(2)}` : "unknown",
    })) ?? [],
    summary: result.chartAnalysis?.summary ?? null,
    confidence: tradeData?.overallConfidence ?? result.chartAnalysis?.confidence.score ?? 0,
    processingTimeMs,
    isStub: !result.provider.isRealProvider,
  };
}

// ─── Enhance Candidate with new VisionExtractedTradeData ───

function enhanceWithVisionData(
  candidate: FusedTradeCandidate,
  visionData: VisionExtractedTradeData,
  providerId: string
): void {
  const config = getFusionConfig();

  // Only override if vision has data and OCR doesn't, or if vision is primary source
  const shouldOverride = (ocrVal: unknown, visionConf: number, ocrConf: number) => {
    if (config.primarySource === "vision") return true;
    if (config.primarySource === "auto") {
      return ocrVal === null || visionConf > ocrConf;
    }
    return ocrVal === null; // ocr primary: only fill gaps
  };

  if (visionData.symbol && shouldOverride(candidate.symbol.value, visionData.fieldConfidence.symbol, candidate.symbol.confidence)) {
    candidate.symbol = createField(
      visionData.symbol,
      visionData.fieldConfidence.symbol,
      { source: "vision", confidence: visionData.fieldConfidence.symbol, provider: providerId },
      true,
      "Detected by AI Vision"
    );
  }

  if (visionData.direction && shouldOverride(candidate.direction.value, visionData.fieldConfidence.direction, candidate.direction.confidence)) {
    candidate.direction = createField(
      visionData.direction,
      visionData.fieldConfidence.direction,
      { source: "vision", confidence: visionData.fieldConfidence.direction, provider: providerId },
      true
    );
  }

  if (visionData.entryPrice !== null && shouldOverride(candidate.entryPrice.value, visionData.fieldConfidence.entryPrice, candidate.entryPrice.confidence)) {
    candidate.entryPrice = createField(
      visionData.entryPrice,
      visionData.fieldConfidence.entryPrice,
      { source: "vision", confidence: visionData.fieldConfidence.entryPrice, provider: providerId },
      true
    );
  }

  if (visionData.stopLoss !== null && shouldOverride(candidate.stopLoss.value, visionData.fieldConfidence.stopLoss, candidate.stopLoss.confidence)) {
    candidate.stopLoss = createField(
      visionData.stopLoss,
      visionData.fieldConfidence.stopLoss,
      { source: "vision", confidence: visionData.fieldConfidence.stopLoss, provider: providerId },
      true
    );
  }

  if (visionData.takeProfit !== null && shouldOverride(candidate.takeProfit.value, visionData.fieldConfidence.takeProfit, candidate.takeProfit.confidence)) {
    candidate.takeProfit = createField(
      visionData.takeProfit,
      visionData.fieldConfidence.takeProfit,
      { source: "vision", confidence: visionData.fieldConfidence.takeProfit, provider: providerId },
      true
    );
  }

  if (visionData.positionSize !== null && shouldOverride(candidate.positionSize.value, visionData.fieldConfidence.positionSize, candidate.positionSize.confidence)) {
    candidate.positionSize = createField(
      visionData.positionSize,
      visionData.fieldConfidence.positionSize,
      { source: "vision", confidence: visionData.fieldConfidence.positionSize, provider: providerId },
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
}

// ─── Enhance Candidate with Legacy Vision Output ───

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
  const registry = getVisionProviderRegistry();
  const primary = registry.getPrimaryProvider();
  const availableCount = registry.getAvailableCount();

  if (primary) {
    return {
      currentProvider: primary.name,
      isAvailable: true,
      isRealProvider: !primary.providerId.includes("mock"),
      supportedProviders: registry.getAllProviders().map((p) => p.provider.name),
    };
  }

  return {
    currentProvider: "OCR Only (Tesseract)",
    isAvailable: true,
    isRealProvider: false,
    supportedProviders: [
      "OpenAI Vision",
      "Google Gemini Vision",
      "Anthropic Claude Vision",
      "OpenRouter Vision",
      "Mock Vision (Development)",
    ],
  };
}

// ─── Initialize Default Registry ───

let registryInitialized = false;

/**
 * Initialize the vision provider registry with default providers.
 * Call this once at app startup.
 */
export function initializeVisionRegistry(): void {
  if (registryInitialized) return;

  const registry = getVisionProviderRegistry();

  // Register mock provider as default fallback (always available)
  if (!registry.hasProvider("mock-vision")) {
    registry.register(new MockVisionProvider(), 0);
  }

  // Register stub providers (they return isAvailable() = false until configured)
  if (!registry.hasProvider("openai")) {
    registry.register(new OpenAIVisionProvider(), 10);
  }
  if (!registry.hasProvider("gemini")) {
    registry.register(new GeminiVisionProvider(), 20);
  }
  if (!registry.hasProvider("claude")) {
    registry.register(new ClaudeVisionProvider(), 30);
  }
  if (!registry.hasProvider("openrouter")) {
    registry.register(new OpenRouterVisionProvider(), 40);
  }

  registryInitialized = true;
}

// Note: Registry initialization should be called explicitly by the app
// to avoid circular dependencies during module load
// import { initializeVisionRegistry } from "@/services/ai/fusion";
// initializeVisionRegistry();
