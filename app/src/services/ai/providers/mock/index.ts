/**
 * AI Mock Analysis Provider
 * Simulates AI analysis without making real API calls.
 * Used for development, testing, and when no API keys are configured.
 */

import type {
  AIRequestOptions,
  AIResponse,
  ChartAnalysisRequest,
  ChartAnalysisResult,
  ChartPattern,
  KeyLevel,
  TradeAnalysisRequest,
  TradeAnalysisResult,
  MarketContext,
  RiskAssessment,
  ScreenshotAnalysis,
  ExtractedTradeData,
  DetectedPrice,
  ExtractedFieldStatus,
  AIProcessingState,
  SubscriptionTier,
} from "../../types";

import type {
  ChartAnalysisProvider,
  TradeAnalysisProvider,
  ProcessingProvider,
} from "../interfaces";

import {
  mockCoachingData,
  mockChartPatterns,
  mockSupportResistance,
  generateMockTradeSummary,
  generateMockTradeScore,
  generateMockConfidenceScore,
  generateMockRiskAnalysis,
  generateMockTradeSuggestions,
  generateMockId,
  pickRandom,
} from "./mock-data";

import { simulateProcessing } from "../../utils";

// ─── Mock Provider ───

export class MockAnalysisProvider
  implements ChartAnalysisProvider, TradeAnalysisProvider, ProcessingProvider
{
  readonly name = "Mock AI Provider";
  readonly version = "1.0.0";
  readonly providerId = "mock";
  readonly requiredTier: SubscriptionTier = "free";

  private processingState: AIProcessingState = {
    status: "pending",
    progress: 0,
    message: "Waiting for request",
  };

  // ─── Chart Analysis ───

  async analyzeChart(
    _request: ChartAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<ChartAnalysisResult> {
    const processingTimeMs = await simulateProcessing(800, 2000);

    if (options?.signal?.aborted) {
      throw new Error("Analysis was cancelled");
    }

    const patterns: ChartPattern[] = mockChartPatterns
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => ({
        pattern: p.pattern,
        confidence: p.confidence,
        direction: p.direction,
        description: p.description,
      }));

    const keyLevels: KeyLevel[] = mockSupportResistance.map((level) => ({
      type: level.type,
      price: level.level,
      strength: level.strength,
      touches: level.touches,
    }));

    const marketContext: MarketContext = {
      trend: pickRandom(["bullish", "bearish", "sideways"]),
      volatility: pickRandom(["low", "moderate", "high"]),
      volume: pickRandom(["below_average", "average", "above_average"]),
      session: "london_ny_overlap",
      keyEvents: ["Fed speakers scheduled", "NFP data Friday"].filter(() => Math.random() > 0.3),
    };

    const riskAssessment: RiskAssessment = {
      riskRewardRatio: [1.5, 2.0, 2.5, 3.0][Math.floor(Math.random() * 4)],
      riskPercent: [0.5, 1.0, 1.5, 2.0][Math.floor(Math.random() * 4)],
      potentialProfit: 0,
      potentialLoss: 0,
      assessment: "Moderate risk setup with decent risk-reward ratio.",
      recommendation: "Proceed with proper position sizing.",
    };

    return {
      patterns,
      keyLevels,
      marketContext,
      riskAssessment,
      confidence: generateMockConfidenceScore(),
      metadata: {
        analysisVersion: "1.0.0-mock",
        analyzedAt: new Date().toISOString(),
        provider: "mock",
      },
    };
  }

  async detectPatterns(
    _request: ChartAnalysisRequest,
    _options?: AIRequestOptions
  ): Promise<ChartPattern[]> {
    await simulateProcessing(400, 800);

    return mockChartPatterns
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => ({
        pattern: p.pattern,
        confidence: p.confidence,
        direction: p.direction,
        description: p.description,
      }));
  }

  async identifyKeyLevels(
    _request: ChartAnalysisRequest,
    _options?: AIRequestOptions
  ): Promise<KeyLevel[]> {
    await simulateProcessing(300, 600);

    return mockSupportResistance.map((level) => ({
      type: level.type,
      price: level.level,
      strength: level.strength,
      touches: level.touches,
    }));
  }

  async assessMarketContext(
    _request: ChartAnalysisRequest,
    _options?: AIRequestOptions
  ): Promise<MarketContext> {
    await simulateProcessing(300, 500);

    return {
      trend: pickRandom(["bullish", "bearish", "sideways"]),
      volatility: pickRandom(["low", "moderate", "high"]),
      volume: pickRandom(["below_average", "average", "above_average"]),
      session: "london_ny_overlap",
      keyEvents: ["Fed speakers scheduled"].filter(() => Math.random() > 0.5),
    };
  }

  // ─── Chart Analysis Provider ───

  async analyzeChartRequest(
    request: ChartAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartAnalysisResult>> {
    return this.analyzeChart(request, options).then((data) => ({
      data,
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs: 1000,
      timestamp: new Date().toISOString(),
    }));
  }

  // Satisfy both ChartAnalysisProvider and TradeAnalysisProvider with a unified analyze
  async analyze(
    request: ChartAnalysisRequest | TradeAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartAnalysisResult | TradeAnalysisResult>> {
    // Check if it's a ChartAnalysisRequest by looking for chart-specific properties
    if ("imageUrl" in request || "chartImage" in request) {
      const result = await this.analyzeChart(request as ChartAnalysisRequest, options);
      return result as AIResponse<ChartAnalysisResult | TradeAnalysisResult>;
    }
    // Otherwise treat as TradeAnalysisRequest
    return this.analyzeTrade(request as TradeAnalysisRequest, options) as Promise<AIResponse<ChartAnalysisResult | TradeAnalysisResult>>;
  }

  async detectPatterns(
    request: ChartAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartPattern[]>> {
    const patterns = await this.detectPatterns(request, options);
    return {
      data: patterns,
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs: 500,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Trade Analysis ───

  async analyzeTrade(
    _request: TradeAnalysisRequest,
    _options?: AIRequestOptions
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

  // ─── Screenshot Analysis ───

  async analyzeScreenshot(
    imageFile: File,
    options?: AIRequestOptions
  ): Promise<ScreenshotAnalysis> {
    const startTime = Date.now();

    this.processingState = {
      status: "processing",
      progress: 0,
      message: "Analyzing screenshot...",
    };

    // Simulate progressive processing
    for (let i = 0; i <= 100; i += 20) {
      if (options?.signal?.aborted) {
        throw new Error("Analysis was cancelled");
      }
      this.processingState.progress = i;
      await simulateProcessing(100, 300);
    }

    const processingTimeMs = Date.now() - startTime;

    const detectedPrices: DetectedPrice[] = [
      { value: 1.0850, text: "1.0850", position: 10, confidence: 0.95 },
      { value: 1.0920, text: "1.0920", position: 25, confidence: 0.88 },
      { value: 1.0780, text: "1.0780", position: 40, confidence: 0.82 },
    ];

    const fieldStatuses: ExtractedFieldStatus[] = [
      { field: "pair", detected: true, confidence: 0.92, source: "fuzzy_match" },
      { field: "direction", detected: true, confidence: 0.85, source: "explicit_label" },
      { field: "entryPrice", detected: true, confidence: 0.88, source: "explicit_label" },
      { field: "stopLoss", detected: true, confidence: 0.9, source: "explicit_label" },
      { field: "takeProfit", detected: true, confidence: 0.87, source: "explicit_label" },
      { field: "positionSize", detected: false, confidence: 0, source: "none" },
    ];

    const tradeData: ExtractedTradeData = {
      pair: "EURUSD",
      direction: "buy",
      entryPrice: 1.0850,
      exitPrice: null,
      stopLoss: 1.0820,
      takeProfit: 1.0920,
      positionSize: null,
      confidence: 87,
      confidenceLevel: "high",
      source: "mock_analysis",
      method: "pattern_recognition",
      detectedPrices,
      fieldStatuses,
    };

    this.processingState = {
      status: "completed",
      progress: 100,
      message: "Analysis complete",
      endTime: new Date().toISOString(),
    };

    return {
      id: generateMockId("analysis"),
      screenshotId: generateMockId("screenshot"),
      tradeData,
      detectedSetup: pickRandom([
        "Support bounce with bullish engulfing",
        "Breakout from consolidation range",
        "Fibonacci retracement entry",
        "Trend line support touch",
      ]),
      marketContext: pickRandom([
        "Bullish trend on daily timeframe. Price approaching key resistance.",
        "Sideways consolidation after strong uptrend. Awaiting breakout.",
        "Bearish correction in larger uptrend. Potential buying opportunity.",
      ]),
      keyLevels: [
        { type: "support", price: 1.0820, confidence: 90, description: "Previous swing low" },
        { type: "resistance", price: 1.0920, confidence: 85, description: "Recent high" },
        { type: "entry", price: 1.0850, confidence: 88, description: "Current price" },
      ],
      riskAssessment: {
        riskRewardRatio: 2.3,
        riskPercent: 1.0,
        potentialProfit: 70,
        potentialLoss: 30,
        assessment: "Favorable risk-reward setup with clear technical levels.",
        recommendation: "Proceed with standard position sizing.",
      },
      confidence: 87,
      confidenceLevel: "high",
      processingTimeMs,
      provider: "mock",
      model: "mock-gpt-4",
      analyzedAt: new Date().toISOString(),
      status: "completed",
    };
  }

  // ─── Processing Provider ───

  async getProcessingState(): Promise<AIProcessingState> {
    return { ...this.processingState };
  }

  async cancelProcessing(): Promise<void> {
    this.processingState = {
      status: "pending",
      progress: 0,
      message: "Processing cancelled",
    };
  }

  // ─── Utility ───

  async getStatus(): Promise<{ available: boolean; message: string }> {
    return {
      available: true,
      message: "Mock provider is ready (development mode)",
    };
  }

  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }
}

// ─── Singleton Instance ───

let mockProviderInstance: MockAnalysisProvider | null = null;

export function getMockProvider(): MockAnalysisProvider {
  if (!mockProviderInstance) {
    mockProviderInstance = new MockAnalysisProvider();
  }
  return mockProviderInstance;
}

// ─── Re-export for convenience ───

export { mockCoachingData, mockChartPatterns, mockSupportResistance };
