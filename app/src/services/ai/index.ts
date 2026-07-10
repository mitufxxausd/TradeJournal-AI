/**
 * AI Services Module
 * Central export point for all AI-related services.
 */

// ─── Types (from legacy types.ts) ───
export type {
  AIProvider,
  AIProviderCapabilities,
  VisionAnalyzeRequest,
  TradeSummaryInput,
  CoachingInput,
  TranscriptionResult,
  TranscriptionRequest,
  ExtractedTradeData,
  ScreenshotAnalysis,
  KeyLevel,
  RiskAssessment,
  TradeSummary,
  AICoaching,
  CoachingPlan,
  CoachingItem,
  CoachingInsight,
  CoachingGoal,
  CoachingFeedback,
  AITradeImage,
  VoiceNote,
  SubscriptionTier,
  AnalysisStatus,
  AIError,
  AIProcessingState,
  DetectedPrice,
  ExtractedFieldStatus,
  FeatureAccess,
  SubscriptionFeatures,
  SubscriptionState,
} from "./types";

// ─── Common Types (from types/common.ts) ───
export type {
  AIProviderName,
  AIProviderConfig,
  AIProviderCapability,
  AIRequestOptions,
  AIResponse,
  AIProcessingStatus,
  AIModelInfo,
} from "./types/common";

// ─── Mock Provider ───
export {
  getMockProvider,
  MockAnalysisProvider,
} from "./providers/mock";

export { getMockAIProvider } from "./providers/mockProvider";

// ─── Analysis Services ───
export {
  analyzeScreenshots,
  generateTradeAIAnalysis,
  generateTradeSummary,
  generateCoaching,
  transcribeAudio,
  setAIProvider,
  getAIProvider,
  resetToMockProvider,
  canUseFeature,
  AIError as AIServiceError,
} from "./aiService";

export type { AnalyzeScreenshotsOptions } from "./aiService";

// ─── Config ───
export {
  getDefaultProviderConfigs,
  getEnabledProviderConfigs,
  getActiveProviderName,
  getProviderConfig,
  getAISettings,
  hasRealProviderConfigured,
} from "./config";

// ─── Vision (New Architecture - Phase 7A) ───

// Core vision types
export type {
  VisionProvider,
  VisionProviderConfig,
  VisionProviderCapabilities,
} from "./vision/VisionProvider";

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
} from "./vision/VisionAnalysisResult";

export { DEFAULT_VISION_FEATURE_FLAGS } from "./vision/VisionAnalysisResult";

// Vision feature types
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
} from "./vision/VisionFeatureTypes";

// Vision registry
export type { VisionProviderRegistry, RegisteredVisionProvider } from "./vision/VisionProviderRegistry";

export {
  DefaultVisionProviderRegistry,
  getVisionProviderRegistry,
  resetVisionProviderRegistry,
  createVisionProviderRegistry,
} from "./vision/VisionProviderRegistry";

// Vision providers
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
} from "./vision/providers";

export type { StubVisionProviderType } from "./vision/providers";

// ─── Legacy Vision (Backward Compatibility) ───

export type {
  VisionProvider as LegacyVisionProvider,
  VisionRequestOptions as LegacyVisionRequestOptions,
  VisionAnalysisResult as LegacyVisionAnalysisResult,
  VisionProviderConfig as LegacyVisionProviderConfig,
  VisionProviderRegistry as LegacyVisionProviderRegistry,
} from "./vision/types";

export {
  OpenAIVisionProvider as LegacyOpenAIVisionProvider,
  GeminiVisionProvider as LegacyGeminiVisionProvider,
  ClaudeVisionProvider as LegacyClaudeVisionProvider,
  OpenRouterVisionProvider as LegacyOpenRouterVisionProvider,
  DefaultVisionRegistry,
  getVisionRegistry,
  resetVisionRegistry,
} from "./vision/types";

// ─── Trade Fusion Engine ───
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
} from "./fusion";

export {
  runFusion,
  runFusionWithVisionProvider,
  getFusionConfig,
  updateFusionConfig,
  resetFusionConfig,
  getFusionProgress,
  getVisionProviderStatus,
  initializeVisionRegistry,
  DEFAULT_FUSION_CONFIG,
} from "./fusion";

// ─── Utils ───
export {
  delay,
  simulateProcessing,
  generateAIId,
  withRetry,
  isAbortError,
  getErrorMessage,
  formatProcessingTime,
  clamp,
  randomPick,
  randomInt,
  randomFloat,
} from "./utils";

// ─── Provider Factory & Registry ───
export { ProviderFactory, providerFactory, ProviderFactoryError } from "./providers/factory";
export { ProviderRegistry, providerRegistry } from "./providers/registry";
