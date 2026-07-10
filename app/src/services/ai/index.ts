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

// ─── Vision ───
export type {
  VisionProvider,
  VisionRequestOptions,
  VisionAnalysisResult,
  VisionProviderConfig,
  VisionProviderRegistry,
} from "./vision";

export {
  OpenAIVisionProvider,
  GeminiVisionProvider,
  ClaudeVisionProvider,
  OpenRouterVisionProvider,
  DefaultVisionRegistry,
  getVisionRegistry,
  resetVisionRegistry,
} from "./vision";

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
  getFusionConfig,
  updateFusionConfig,
  resetFusionConfig,
  getFusionProgress,
  getVisionProviderStatus,
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
