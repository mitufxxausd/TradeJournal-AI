import type {
  AIProvider,
  AIResponse,
  AIRequestOptions,
  AIModelInfo,
  AIProviderCapability,
} from "../../types/common";
import type {
  VisionProvider,
  OCRProvider,
  SummaryProvider,
  CoachingProvider,
  TranscriptionProvider,
  ChartAnalysisProvider,
  TradeAnalysisProvider,
} from "../interfaces";
import type { ChartAnalysisRequest, ChartAnalysisResult } from "../../types/chart-analysis";
import type { OCRResult, OCROptions } from "../../types/ocr";
import type { TradeAnalysisRequest, TradeAnalysisResult } from "../../types/trade-analysis";
import type { CoachingRequest, CoachingResult, CoachingSession, CoachMessage } from "../../types/coaching";
import type { TranscriptionRequest, VoiceTranscript, TranscriptionOptions } from "../../types/transcription";
import {
  simulateProcessing,
  generateMockChartAnalysis,
  generateMockOCRResult,
  generateMockTradeScore,
  generateMockTradeSummary,
  generateMockConfidenceScore,
  generateMockRiskAnalysis,
  generateMockTradeSuggestions,
  generateMockCoachingResult,
  generateMockTranscript,
} from "./mock-data";

/**
 * Mock AI Provider
 * Returns realistic fake data for all AI capabilities
 * No API key required - used for development and testing
 */
export class MockProvider
  implements
    AIProvider,
    VisionProvider,
    OCRProvider,
    SummaryProvider,
    CoachingProvider,
    TranscriptionProvider,
    ChartAnalysisProvider,
    TradeAnalysisProvider
{
  readonly name = "Mock AI Provider";
  readonly version = "1.0.0";
  readonly capabilities: AIProviderCapability[] = [
    "chat",
    "vision",
    "ocr",
    "summary",
    "coaching",
    "transcription",
    "chart-analysis",
    "trade-analysis",
  ];

  private _models: AIModelInfo[] = [
    {
      id: "mock-gpt-4",
      name: "Mock GPT-4",
      provider: "mock",
      capabilities: this.capabilities,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
    {
      id: "mock-vision",
      name: "Mock Vision",
      provider: "mock",
      capabilities: ["vision", "chart-analysis", "ocr"],
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
    {
      id: "mock-coach",
      name: "Mock Trading Coach",
      provider: "mock",
      capabilities: ["coaching", "summary"],
      contextWindow: 32000,
      maxOutputTokens: 2048,
    },
  ];

  get models(): AIModelInfo[] {
    return this._models;
  }

  isAvailable(): boolean {
    return true;
  }

  async getHealth(): Promise<{ status: "healthy" | "degraded" | "unhealthy"; latencyMs: number }> {
    const latencyMs = Math.floor(Math.random() * 50) + 10;
    await simulateProcessing(10, 50);
    return { status: "healthy", latencyMs };
  }

  getModels(): AIModelInfo[] {
    return this.models;
  }

  // ─── Vision Provider ───

  async analyzeChart(
    request: ChartAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartAnalysisResult>> {
    const processingTimeMs = await simulateProcessing(800, 2000);
    const result = generateMockChartAnalysis();

    return {
      data: result,
      provider: "mock",
      model: "mock-vision",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeImage(imageUrl: string, prompt: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const processingTimeMs = await simulateProcessing(600, 1500);

    return {
      data: `Based on the image analysis, I can see a trading chart showing price action with clear support and resistance levels. ${prompt}`,
      provider: "mock",
      model: "mock-vision",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── OCR Provider ───

  async extractTradeData(
    imageUrl: string,
    options?: OCROptions & AIRequestOptions
  ): Promise<AIResponse<OCRResult>> {
    const processingTimeMs = await simulateProcessing(500, 1500);
    const result = generateMockOCRResult();

    return {
      data: result,
      provider: "mock",
      model: "mock-vision",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  async extractText(imageUrl: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const processingTimeMs = await simulateProcessing(300, 800);

    return {
      data: "EURUSD Buy Entry: 1.08950 | Exit: 1.09120 | Profit: +85.00 | Date: 2024-01-15",
      provider: "mock",
      model: "mock-vision",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Summary Provider ───

  async summarizeTrade(tradeId: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const processingTimeMs = await simulateProcessing(600, 1200);
    const summary = generateMockTradeSummary();

    return {
      data: summary.overview,
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  async summarizeTrades(tradeIds: string[], options?: AIRequestOptions): Promise<AIResponse<string>> {
    const processingTimeMs = await simulateProcessing(800, 1500);

    return {
      data: `Analysis of ${tradeIds.length} trades shows an overall positive trend with good risk management. Win rate is 58% with an average R:R of 1:2.1. Key strength is patient entry timing. Main area for improvement is exit management - consider trailing stops.`,
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Coaching Provider ───

  async generateCoaching(
    request: CoachingRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<CoachingResult>> {
    const processingTimeMs = await simulateProcessing(1000, 2500);
    const result = generateMockCoachingResult();

    return {
      data: result,
      provider: "mock",
      model: "mock-coach",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  async chat(message: string, sessionId?: string, options?: AIRequestOptions): Promise<AIResponse<CoachMessage>> {
    const processingTimeMs = await simulateProcessing(500, 1200);

    const responses = [
      "That's a solid observation about the trend structure. Consider also checking the volume profile to confirm strength.",
      "You're right to be cautious here. The risk-reward isn't ideal at this entry point. Waiting for a pullback might offer a better setup.",
      "Looking at your recent trades, you've improved significantly in patience. Keep following your pre-trade checklist.",
      "This pattern has a 72% success rate in backtesting when the volume confirms the breakout. Make sure to check that.",
      "I notice you've been taking similar setups recently. Consider reviewing your journal to see what's working best.",
    ];

    const response: CoachMessage = {
      id: `msg-${Date.now()}`,
      role: "coach",
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date().toISOString(),
    };

    return {
      data: response,
      provider: "mock",
      model: "mock-coach",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Transcription Provider ───

  async transcribe(
    request: TranscriptionRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<VoiceTranscript>> {
    const processingTimeMs = await simulateProcessing(600, 1800);
    const result = generateMockTranscript();

    return {
      data: result,
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  supportsRealtime(): boolean {
    return false;
  }

  // ─── Chart Analysis Provider ───

  async analyze(
    request: ChartAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartAnalysisResult>> {
    return this.analyzeChart(request, options);
  }

  async detectPatterns(
    imageUrl: string,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartAnalysisResult["patterns"]>> {
    const processingTimeMs = await simulateProcessing(600, 1500);
    const analysis = generateMockChartAnalysis();

    return {
      data: analysis.patterns,
      provider: "mock",
      model: "mock-vision",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  async identifyLevels(
    imageUrl: string,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartAnalysisResult["supportResistance"]>> {
    const processingTimeMs = await simulateProcessing(500, 1200);
    const analysis = generateMockChartAnalysis();

    return {
      data: analysis.supportResistance,
      provider: "mock",
      model: "mock-vision",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Trade Analysis Provider ───

  async analyze(
    request: TradeAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<TradeAnalysisResult>> {
    const processingTimeMs = await simulateProcessing(800, 2000);

    const result: TradeAnalysisResult = {
      summary: generateMockTradeSummary(),
      score: generateMockTradeScore(),
      confidence: generateMockConfidenceScore(),
      riskAnalysis: generateMockRiskAnalysis(),
      suggestions: generateMockTradeSuggestions(),
      metadata: {
        analysisVersion: "1.0.0-mock",
        analyzedAt: new Date().toISOString(),
        provider: "mock",
      },
    };

    return {
      data: result,
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }

  async scoreTrade(
    tradeId: string,
    options?: AIRequestOptions
  ): Promise<AIResponse<TradeAnalysisResult["score"]>> {
    const processingTimeMs = await simulateProcessing(400, 800);

    return {
      data: generateMockTradeScore(),
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance for easy access
export const mockProvider = new MockProvider();
