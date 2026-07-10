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
 * - Intelligent Vision Pipeline (Phase 7B)
 * - Region Detection (Phase 7B)
 * - Symbol Detection with priority (Phase 7B)
 * - Trade Field Extraction with confidence (Phase 7B)
 * - Provider Selector with "Coming Soon" states (Phase 7B)
 * - Lazy Loader for performance (Phase 7B)
 *
 * Architecture:
 *   Screenshot → IntelligentVisionPipeline → PipelineOutput
 *                           ↑
 *              OCR Fallback (always available via TradeFusionEngine)
 *
 * Usage:
 *   import { analyzeScreenshot, getVisionProviderRegistry } from "@/services/ai/vision";
 *
 *   // Simple usage
 *   const result = await analyzeScreenshot(imageFile);
 *   console.log(result.extractedTrade.symbol.value);
 *
 *   // Advanced usage with provider registry
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

// ─── Intelligent Vision Pipeline (Phase 7B) ───

export type {
  PipelineInput,
  PipelineOutput,
  PipelineContext,
  PipelineStage,
  PipelineStageName,
  PipelineStageResult,
  PipelineMetadata,
  PipelineError,
  StagePerformance,
  ExtractedTradeFields,
  FieldExtraction,
  FieldExtractionStatus,
  FieldSource,
  DetectedSymbolResult,
  DetectedImageRegion,
  ImageRegionType,
  PipelineConfidenceScores,
  IntelligentVisionPipeline,
} from "./pipeline";

export {
  createPipelineContext,
  createEmptyPipelineOutput,
} from "./pipeline";

export {
  DefaultIntelligentVisionPipeline,
  getIntelligentVisionPipeline,
  resetIntelligentVisionPipeline,
  analyzeScreenshot,
} from "./IntelligentVisionPipeline";

// ─── Region Detection (Phase 7B) ───

export type { RegionDetectionResult } from "./regionDetection";

export {
  detectRegions,
  getRegionsBySymbolPriority,
  getTradeRelevantText,
  getRegionsByType,
  getTextFromRegionType,
  runRegionDetectionStage,
} from "./regionDetection";

// ─── Symbol Detection (Phase 7B) ───

export {
  detectSymbolWithRegions,
  detectSymbolFromSourcesWithRegions,
  isValidSymbol,
  getSymbolSourceDisplay,
  getSymbolSourcePriorityList,
} from "./symbolDetection";

// ─── Trade Field Extraction (Phase 7B) ───

export type {
  TradeFieldExtractionInput,
  TradeFieldExtractionResult,
} from "./tradeFieldExtraction";

export {
  extractTradeFields,
  runTradeFieldExtractionStage,
  getFieldsNeedingReview,
  areCriticalFieldsDetected,
  extractedFieldsToOCRTrade,
} from "./tradeFieldExtraction";

// ─── OCR Processing (Phase 7B) ───

export type { OCRTextStats } from "./ocrProcessing";

export {
  normalizeOCRText,
  filterTradeRelevantText,
  processOCRResult,
  getOCRTextStats,
} from "./ocrProcessing";

// ─── Provider Selector (Phase 7B) ───

export type {
  ProviderOption,
  ProviderAvailabilityStatus,
  ProviderSelectorState,
  ProviderSelectionConfig,
  ProviderComparison,
} from "./providerSelector";

export {
  PROVIDER_OPTIONS,
  getAllProviderOptions,
  getAvailableProviders,
  getComingSoonProviders,
  getProviderOption,
  isProviderAvailable,
  getProviderStatusDisplay,
  getProviderStatusColor,
  getProviderSelectionConfig,
  setProviderSelectionConfig,
  resetProviderSelectionConfig,
  getRecommendedProvider,
  compareProviders,
} from "./providerSelector";

// ─── Lazy Loader (Phase 7B) ───

export {
  loadOCRModule,
  loadParserModule,
  loadTesseractModule,
  loadSymbolDetectorModule,
  loadMockVisionProvider,
  loadFusionEngine,
  loadRegionDetection,
  loadTradeFieldExtraction,
  loadOCRProcessing,
  loadSymbolDetection,
  preloadOCR,
  preloadParser,
  preloadVisionModules,
  clearLazyCache,
  getLazyCacheStats,
} from "./lazyLoader";

export type {
  LazyLoadedOCR,
  LazyLoadedParser,
  LazyLoadedTesseract,
  LazyLoadedMockProvider,
  LazyLoadedFusion,
  LazyLoadedRegionDetection,
  LazyLoadedTradeFieldExtraction,
  LazyLoadedOCRProcessing,
  LazyLoadedSymbolDetection,
} from "./lazyLoader";
