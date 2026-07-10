/**
 * AI Vision Service
 * Centralized exports for the AI Vision Provider architecture.
 *
 * This module provides:
 * - VisionProvider interface (implement this for new providers)
 * - VisionProviderRegistry (manage multiple providers)
 * - MockVisionProvider (always-available mock for development)
 * - Stub providers (OpenAI, Gemini, Claude, OpenRouter - ready for implementation)
 * - Comprehensive feature types for chart analysis
 * - Analysis result types
 *
 * Architecture:
 *   Screenshot → VisionProvider.analyze() → VisionAnalysisResult
 *                           ↑
 *              OCR Fallback (always available via TradeFusionEngine)
 *
 * Usage:
 *   import { getVisionProviderRegistry, MockVisionProvider } from "@/services/ai/vision";
 *   const registry = getVisionProviderRegistry();
 *   registry.register(new MockVisionProvider());
 *   const provider = registry.getPrimaryProvider();
 *   const result = await provider.analyze(imageFile);
 */

// ─── Core Types ───

export type {
  VisionProvider,
  VisionProviderConfig,
  VisionProviderCapabilities,
} from "./VisionProvider";

export type {
  VisionAnalysisResult,
  VisionExtractedTradeData,
  VisionChartAnalysis,
  VisionFieldConfidence,
  VisionRequestOptions,
  VisionBatchResult,
  VisionFeatureFlags,
  VisionFeatureType,
  VisionAnalysisType,
  VisionProviderInfo,
} from "./VisionAnalysisResult";

export { DEFAULT_VISION_FEATURE_FLAGS } from "./VisionAnalysisResult";

export type {
  DetectedChartPattern,
  ChartPatternType,
  PatternDirection,
  PatternCompletion,
  DetectedLevel,
  LevelType,
  LevelStrength,
  TrendAnalysis,
  TrendDirection,
  TrendStrength,
  DetectedCandlestickPattern,
  CandlestickPatternType,
  DetectedIndicator,
  IndicatorType,
  IndicatorSignal,
  DetectedTradeAnnotation,
  AnnotationType,
  VolumeAnalysis,
  TimeframeDetection,
  PlatformDetection,
  VisionFeatureConfidence,
  DetectedRegion,
} from "./VisionFeatureTypes";

// ─── Registry ───

export type { VisionProviderRegistry, RegisteredVisionProvider } from "./VisionProviderRegistry";

export {
  DefaultVisionProviderRegistry,
  getVisionProviderRegistry,
  resetVisionProviderRegistry,
  createVisionProviderRegistry,
  // Legacy compatibility
  getVisionRegistry,
  resetVisionRegistry,
} from "./VisionProviderRegistry";

// ─── Providers ───

export {
  MockVisionProvider,
  getMockVisionProvider,
  resetMockVisionProvider,
  OpenAIVisionProvider,
  GeminiVisionProvider,
  ClaudeVisionProvider,
  OpenRouterVisionProvider,
  createStubVisionProvider,
  createAllStubVisionProviders,
  getStubVisionProviderTypes,
} from "./providers";

export type { StubVisionProviderType } from "./providers";

// ─── Legacy Compatibility (from original types.ts) ───

// Re-export the legacy VisionProvider interface from types.ts for backward compatibility
export type {
  VisionProvider as LegacyVisionProvider,
  VisionRequestOptions as LegacyVisionRequestOptions,
  VisionAnalysisResult as LegacyVisionAnalysisResult,
  VisionProviderConfig as LegacyVisionProviderConfig,
  VisionProviderRegistry as LegacyVisionProviderRegistry,
} from "./types";

export {
  OpenAIVisionProvider as LegacyOpenAIVisionProvider,
  GeminiVisionProvider as LegacyGeminiVisionProvider,
  ClaudeVisionProvider as LegacyClaudeVisionProvider,
  OpenRouterVisionProvider as LegacyOpenRouterVisionProvider,
  DefaultVisionRegistry,
  getVisionRegistry as legacyGetVisionRegistry,
  resetVisionRegistry as legacyResetVisionRegistry,
} from "./types";
