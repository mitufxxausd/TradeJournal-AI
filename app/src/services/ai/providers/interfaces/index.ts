import type { AIResponse, AIRequestOptions, AIModelInfo } from "../../types/common";
import type { TradeAnalysisRequest, TradeAnalysisResult } from "../../types/trade-analysis";
import type { ChartAnalysisRequest, ChartAnalysisResult } from "../../types/chart-analysis";
import type { OCRResult, OCROptions } from "../../types/ocr";
import type { CoachingRequest, CoachingResult, CoachingSession, CoachMessage } from "../../types/coaching";
import type { TranscriptionRequest, VoiceTranscript, TranscriptionOptions } from "../../types/transcription";

/**
 * Base AI Provider Interface
 * All AI providers must implement this interface
 */
export interface AIProvider {
  readonly name: string;
  readonly version: string;
  readonly models: AIModelInfo[];

  /** Check if provider is properly configured and ready */
  isAvailable(): boolean;

  /** Get provider health status */
  getHealth?(): Promise<{ status: "healthy" | "degraded" | "unhealthy"; latencyMs: number }>;

  /** Get list of available models */
  getModels(): AIModelInfo[];
}

/**
 * Vision Provider - Image analysis capabilities
 */
export interface VisionProvider extends AIProvider {
  /** Analyze chart screenshot for patterns and levels */
  analyzeChart(request: ChartAnalysisRequest, options?: AIRequestOptions): Promise<AIResponse<ChartAnalysisResult>>;

  /** Analyze any image with custom prompt */
  analyzeImage(imageUrl: string, prompt: string, options?: AIRequestOptions): Promise<AIResponse<string>>;
}

/**
 * OCR Provider - Text extraction from images
 */
export interface OCRProvider extends AIProvider {
  /** Extract text and trade data from screenshot */
  extractTradeData(imageUrl: string, options?: OCROptions & AIRequestOptions): Promise<AIResponse<OCRResult>>;

  /** Simple text extraction from image */
  extractText(imageUrl: string, options?: AIRequestOptions): Promise<AIResponse<string>>;
}

/**
 * Summary Provider - Trade summarization
 */
export interface SummaryProvider extends AIProvider {
  /** Generate a summary of a single trade */
  summarizeTrade(tradeId: string, options?: AIRequestOptions): Promise<AIResponse<string>>;

  /** Generate summary of multiple trades */
  summarizeTrades(tradeIds: string[], options?: AIRequestOptions): Promise<AIResponse<string>>;
}

/**
 * Coaching Provider - AI coaching and mentorship
 */
export interface CoachingProvider extends AIProvider {
  /** Generate coaching plan based on trading history */
  generateCoaching(request: CoachingRequest, options?: AIRequestOptions): Promise<AIResponse<CoachingResult>>;

  /** Send a message to the AI coach and get a response */
  chat(message: string, sessionId?: string, options?: AIRequestOptions): Promise<AIResponse<CoachMessage>>;

  /** Get coaching session history */
  getSession?(sessionId: string): Promise<CoachingSession | null>;
}

/**
 * Transcription Provider - Voice to text
 */
export interface TranscriptionProvider extends AIProvider {
  /** Transcribe audio to text */
  transcribe(request: TranscriptionRequest, options?: AIRequestOptions): Promise<AIResponse<VoiceTranscript>>;

  /** Check if provider supports streaming transcription */
  supportsRealtime(): boolean;
}

/**
 * Chart Analysis Provider - Specialized chart analysis
 */
export interface ChartAnalysisProvider extends AIProvider {
  /** Comprehensive chart analysis */
  analyze(request: ChartAnalysisRequest, options?: AIRequestOptions): Promise<AIResponse<ChartAnalysisResult>>;

  /** Quick pattern detection */
  detectPatterns(imageUrl: string, options?: AIRequestOptions): Promise<AIResponse<ChartAnalysisResult["patterns"]>>;

  /** Identify key levels */
  identifyLevels(imageUrl: string, options?: AIRequestOptions): Promise<AIResponse<ChartAnalysisResult["supportResistance"]>>;
}

/**
 * Trade Analysis Provider - Specialized trade analysis
 */
export interface TradeAnalysisProvider extends AIProvider {
  /** Full trade analysis with scoring */
  analyze(request: TradeAnalysisRequest, options?: AIRequestOptions): Promise<AIResponse<TradeAnalysisResult>>;

  /** Quick trade score calculation */
  scoreTrade(tradeId: string, options?: AIRequestOptions): Promise<AIResponse<TradeAnalysisResult["score"]>>;
}

/**
 * Combined AI Provider - Implements all capabilities
 */
export interface FullAIProvider
  extends AIProvider,
    VisionProvider,
    OCRProvider,
    SummaryProvider,
    CoachingProvider,
    TranscriptionProvider,
    ChartAnalysisProvider,
    TradeAnalysisProvider {}

/**
 * Provider type guards
 */
export function isVisionProvider(provider: AIProvider): provider is VisionProvider {
  return "analyzeChart" in provider && "analyzeImage" in provider;
}

export function isOCRProvider(provider: AIProvider): provider is OCRProvider {
  return "extractTradeData" in provider && "extractText" in provider;
}

export function isSummaryProvider(provider: AIProvider): provider is SummaryProvider {
  return "summarizeTrade" in provider && "summarizeTrades" in provider;
}

export function isCoachingProvider(provider: AIProvider): provider is CoachingProvider {
  return "generateCoaching" in provider && "chat" in provider;
}

export function isTranscriptionProvider(provider: AIProvider): provider is TranscriptionProvider {
  return "transcribe" in provider && "supportsRealtime" in provider;
}

export function isChartAnalysisProvider(provider: AIProvider): provider is ChartAnalysisProvider {
  return "analyze" in provider && "detectPatterns" in provider && "identifyLevels" in provider;
}

export function isTradeAnalysisProvider(provider: AIProvider): provider is TradeAnalysisProvider {
  return "analyze" in provider && "scoreTrade" in provider;
}
