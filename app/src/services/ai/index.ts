/**
 * AI Services
 *
 * Central export point for all AI-related services.
 * Follows the barrel pattern for clean imports.
 */

// ─── AI Trade Advice ───
export { generateTradeAdvice, ocrResultToExtractedTrade, aiTradeToExtractedTrade, aiAdviceToTradeAdvice } from "./aiTradeAdvice";
export type { TradeAdvice, JournalInsight, ExtractedTradeData, FieldConfidenceDetail, AnalysisConfirmation, ScreenshotAnalysis, ImageQualityMetrics, AnalysisStatus, WorkspaceDashboardStats, GroupedAnalyses, HistoryFilters } from "./types/screenshot-analysis";

// ─── Image Quality Analysis ───
export { analyzeImageQuality } from "./imageQuality";

// ─── History Storage ───
export {
  saveAnalysis,
  getAnalysis,
  getAllAnalyses,
  updateAnalysis,
  deleteAnalysis,
  duplicateAnalysis,
  clearAllAnalyses,
  markAsImported,
  getDashboardStats,
  groupAnalysesByDate,
  filterAnalyses,
} from "./historyStorage";

// ─── Fusion Engine ───
export { TradeFusionEngine } from "./fusion/TradeFusionEngine";
export { runFusion, getVisionProviderStatus } from "./fusion";
export type { FusionResult, FusionConfig } from "./fusion";

// ─── AI Extraction (Phase 7D-1) ───
export type {
  AIExtractionResult,
  AIExtractionRequest,
  AIExtractionOptions,
  AIExtractedTrade,
  AIConfidenceScores,
  AIAdviceResult,
  AITradeAdviceItem,
  RawAIExtractionResponse,
  AIExtractionErrorCode,
} from "./types/ai-extraction";
export { AIExtractionError } from "./types/ai-extraction";

export {
  extractTradeWithAI,
  quickExtract,
} from "./aiExtraction";

export {
  buildTradeExtractionPrompt,
  buildRetryPrompt,
  buildVisionExtractionPrompt,
  parseAIExtractionResponse,
  normalizeExtractionResponse,
} from "./prompts";

// ─── Provider Factory & Registry ───
export { ProviderFactory, providerFactory, ProviderFactoryError } from "./providers/factory";
export { ProviderRegistry, providerRegistry } from "./providers/registry";

// ─── Utilities ───
export { withRetry, delay, generateAIId, getErrorMessage } from "./utils";

// ─── Configuration ───
export { AI_CONFIG } from "./config";
export type { AIProviderName, AIProviderCapability, AIProvider } from "./types/common";

// ─── Types ───
export type {
  AIAnalysisResult,
  AIMessage,
  AISession,
  AIResponse,
  AIProviderConfig,
  AIStreamResponse,
  AIProviderError,
} from "./types/common";

export type {
  TradeReviewResult,
  TradePattern,
  PerformanceMetrics,
  RiskMetrics,
  PsychologicalMetrics,
  TradeQuality,
} from "./types/trade-analysis";

export type {
  ChartAnalysisResult,
  Pattern,
  SupportResistance,
  Trend,
  CandlestickPattern,
} from "./types/chart-analysis";

export type {
  OCRResult,
  OCRTrade,
  OCRConfidence,
  OCRConfig,
  SymbolMapping,
} from "./types/ocr";

export type {
  CoachResponse,
  CoachTopic,
  CoachMilestone,
  LearningPath,
  SkillAssessment,
} from "./types/coaching";

export type {
  TranscriptionResult,
  TranscriptionSegment,
  TranscriptionConfig,
} from "./types/transcription";
