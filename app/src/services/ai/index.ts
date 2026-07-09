/**
 * AI Services Module
 * Central export point for all AI-related services.
 */

// ─── Types ───
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

export {
  getMockProvider,
  MockAnalysisProvider,
} from "./providers/mock";

// ─── Analysis Services ───
export { analyzeTradeSetup } from "./aiService";
export type { AnalysisConfig } from "./aiService";

// ─── Config ───
export {
  getDefaultProviderConfigs,
  getEnabledProviders,
  getPrimaryProvider,
  hasRequiredTier,
} from "./config";

export type { AIProviderConfig, AIProviderRegistryEntry } from "./config";

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

// ─── Config ───
export { defaultConfig } from "./config";
