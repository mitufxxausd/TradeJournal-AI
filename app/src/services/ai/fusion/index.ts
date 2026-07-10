/**
 * Trade Fusion Engine
 * Exports the fusion engine for combining OCR and Vision analysis.
 *
 * Usage:
 *   import { runFusion, getFusionConfig, updateFusionConfig } from "@/services/ai/fusion";
 *   const result = await runFusion(imageFile, ocrResult, visionOutput);
 *
 *   // New: With VisionProvider integration
 *   import { runFusionWithVisionProvider, initializeVisionRegistry } from "@/services/ai/fusion";
 *   initializeVisionRegistry();
 *   const result = await runFusionWithVisionProvider(imageFile, ocrResult);
 */

export type {
  FusionResult,
  FusionEngineConfig,
  FusedTradeCandidate,
  FusedField,
  FieldSource,
  FusionMetadata,
  VisionAnalysisOutput,
  VisionConfidenceMetrics,
  FusionProgress,
  FusionStatus,
  AnalysisSource,
  VisionProviderStatus,
} from "./types";

export {
  DEFAULT_FUSION_CONFIG,
} from "./types";

export {
  runFusion,
  runFusionWithVisionProvider,
  getFusionConfig,
  updateFusionConfig,
  resetFusionConfig,
  getFusionProgress,
  getVisionProviderStatus,
  initializeVisionRegistry,
} from "./TradeFusionEngine";
