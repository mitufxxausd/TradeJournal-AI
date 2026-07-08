/**
 * AI Provider Interfaces
 * Abstract interfaces that all AI providers must implement.
 * This ensures provider-swappable architecture.
 */

import type {
  ScreenshotAnalysis,
  TradeSummary,
  AICoaching,
  ExtractedTradeData,
  ChartAnalysis,
  SubscriptionTier,
} from "../types";

// ─── Vision / OCR Provider ───

export interface VisionAnalyzeRequest {
  imageUrl: string;
  imageBase64?: string;
  mimeType?: string;
  prompt?: string;
}

export interface OCRProvider {
  readonly name: string;
  readonly supportsBatch: boolean;

  extractTradeData(request: VisionAnalyzeRequest): Promise<ExtractedTradeData | null>;
  extractTradeDataBatch(requests: VisionAnalyzeRequest[]): Promise<(ExtractedTradeData | null)[]>;
}

// ─── Chart Analysis Provider ───

export interface ChartAnalysisProvider {
  readonly name: string;

  analyzeChart(request: VisionAnalyzeRequest): Promise<ChartAnalysis | null>;
  analyzeChartsBatch(requests: VisionAnalyzeRequest[]): Promise<(ChartAnalysis | null)[]>;
}

// ─── Trade Summary Provider ───

export interface TradeSummaryInput {
  pair: string;
  direction: string;
  entryPrice: number;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  positionSize: number;
  riskPercent?: number | null;
  profitLoss?: number | null;
  rrRatio?: number | null;
  timeframe?: string;
  strategy?: string;
  session?: string;
  psychologyNotes?: string;
  checklistItems?: { label: string; checked: boolean }[];
  notes?: string;
  screenshots?: { url: string }[];
}

export interface SummaryProvider {
  readonly name: string;

  generateSummary(input: TradeSummaryInput): Promise<TradeSummary | null>;
}

// ─── Coaching Provider ───

export interface CoachingInput extends TradeSummaryInput {
  tradeQualityScore?: number;
  recentTrades?: {
    profitLoss: number;
    riskPercent?: number;
    tradeDate: string;
    pair: string;
  }[];
}

export interface CoachingProvider {
  readonly name: string;

  generateCoaching(input: CoachingInput): Promise<AICoaching | null>;
}

// ─── Transcription Provider ───

export interface TranscriptionRequest {
  audioUrl: string;
  audioBase64?: string;
  mimeType?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  provider: string;
}

export interface TranscriptionProvider {
  readonly name: string;

  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult | null>;
}

// ─── Unified AI Provider ───

export interface AIProviderCapabilities {
  vision: boolean;
  ocr: boolean;
  chartAnalysis: boolean;
  tradeSummary: boolean;
  coaching: boolean;
  transcription: boolean;
}

export interface AIProvider {
  readonly name: string;
  readonly capabilities: AIProviderCapabilities;
  readonly requiredTier: SubscriptionTier;

  // Vision & OCR
  analyzeScreenshot(request: VisionAnalyzeRequest): Promise<ScreenshotAnalysis | null>;
  analyzeScreenshotsBatch(requests: VisionAnalyzeRequest[]): Promise<ScreenshotAnalysis[]>;

  // Trade Summary
  generateTradeSummary(input: TradeSummaryInput): Promise<TradeSummary | null>;

  // Coaching
  generateCoaching(input: CoachingInput): Promise<AICoaching | null>;

  // Transcription
  transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResult | null>;
}

// ─── Provider Factory ───

export type AIProviderConstructor = new (config?: Record<string, unknown>) => AIProvider;

export interface RegisteredProvider {
  id: string;
  name: string;
  constructor: AIProviderConstructor;
  capabilities: AIProviderCapabilities;
  requiredTier: SubscriptionTier;
}
