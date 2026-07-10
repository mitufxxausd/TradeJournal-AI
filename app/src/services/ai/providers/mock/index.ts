/**
 * AI Mock Analysis Provider
 * Simulates AI analysis without making real API calls.
 * Used for development, testing, and when no API keys are configured.
 */

import type {
  AIRequestOptions,
  AIResponse,
  AIProcessingStatus,
  SubscriptionTier,
  AIModelInfo,
} from "../../types/common";

import type {
  ChartAnalysisRequest,
  ChartAnalysisResult,
  ChartPattern,
  SupportResistance,
} from "../../types/chart-analysis";

import type {
  TradeAnalysisRequest,
  TradeAnalysisResult,
} from "../../types/trade-analysis";

import type {
  ScreenshotAnalysis,
  ExtractedTradeData,
  DetectedPrice,
  ExtractedFieldStatus,
  KeyLevel,
  RiskAssessment,
} from "../../types";

import type {
  ChartAnalysisProvider,
  TradeAnalysisProvider,
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
  implements ChartAnalysisProvider, TradeAnalysisProvider
{
  readonly name = "Mock AI Provider";
  readonly version = "1.0.0";
  readonly providerId = "mock";
  readonly requiredTier: SubscriptionTier = "free";
  readonly models: AIModelInfo[] = [];

  private processingState: AIProcessingStatus = {
    status: "idle",
    progress: 0,
    message: "Waiting for request",
  };

  // ─── Chart Analysis ───

  async analyzeChart(
    _request: ChartAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<ChartAnalysisResult> {
    const processingTimeMs = await simulateProcessing(800, 2000);

    if (options?.abortSignal?.aborted) {
      throw new Error("Analysis was cancelled");
    }

    const patterns: ChartPattern[] = mockChartPatterns
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => ({
        id: generateMockId("pattern"),
        type: p.pattern.toLowerCase().replace(/\s+/g, "-") as ChartPattern["type"],
        name: p.pattern,
        direction: p.direction,
        confidence: p.confidence,
        startPrice: 1.08 + Math.random() * 0.02,
        endPrice: 1.09 + Math.random() * 0.02,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        description: p.description,
        significance: "high" as const,
        completionPercent: 75,
      }));

    const supportResistance: SupportResistance[] = mockSupportResistance.map((level) => ({
      id: generateMockId("level"),
      level: level.level,
      type: level.type as "support" | "resistance" | "pivot",
      strength: (level.strength > 70 ? "strong" : level.strength > 50 ? "moderate" : "weak") as SupportResistance["strength"],
      touches: level.touches,
      timeframe: "1H",
      isActive: true,
    }));

    return {
      patterns,
      indicators: [
        { type: "ema", name: "EMA 200", value: 1.085, signal: "bullish", interpretation: "Price above EMA 200 indicates bullish trend", period: "200" },
        { type: "rsi", name: "RSI (14)", value: 55, signal: "neutral", interpretation: "RSI in neutral zone", period: "14" },
      ],
      supportResistance,
      orderBlocks: [],
      fairValueGaps: [],
      liquidityZones: [],
      summary: `Chart analysis completed. Found ${patterns.length} patterns with mixed directional bias.`,
      overallBias: pickRandom(["bullish", "bearish", "neutral"]),
      confidence: generateMockConfidenceScore(),
      keyLevels: supportResistance.map((sr) => sr.level),
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
        id: generateMockId("pattern"),
        type: p.pattern.toLowerCase().replace(/\s+/g, "-") as ChartPattern["type"],
        name: p.pattern,
        direction: p.direction,
        confidence: p.confidence,
        startPrice: 1.08 + Math.random() * 0.02,
        endPrice: 1.09 + Math.random() * 0.02,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        description: p.description,
        significance: "high" as const,
        completionPercent: 75,
      }));
  }

  async identifyKeyLevels(
    _request: ChartAnalysisRequest,
    _options?: AIRequestOptions
  ): Promise<KeyLevel[]> {
    await simulateProcessing(300, 600);

    return mockSupportResistance.map((level) => ({
      type: level.type as "support" | "resistance" | "entry" | "stopLoss" | "takeProfit" | "pivot",
      price: level.level,
      confidence: level.strength / 100,
      description: `${level.type} level with ${level.touches} touches`,
    }));
  }

  // ─── Chart Analysis Provider Interface ───

  async analyze(
    request: ChartAnalysisRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<ChartAnalysisResult>> {
    const data = await this.analyzeChart(request, options);
    return {
      data,
      provider: "mock",
      model: "mock-gpt-4",
      processingTimeMs: 1000,
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
      summary: {
        overview: generateMockTradeSummary(),
        strengths: ["Good entry timing", "Proper risk management"],
        weaknesses: ["Could have held longer", "Partial profit taken early"],
        keyTakeaways: ["Wait for full confirmation", "Stick to target levels"],
        verdict: "good",
      },
      score: {
        overall: generateMockTradeScore(),
        entryQuality: Math.floor(60 + Math.random() * 35),
        exitQuality: Math.floor(55 + Math.random() * 35),
        riskManagement: Math.floor(65 + Math.random() * 30),
        psychology: Math.floor(60 + Math.random() * 35),
        setupQuality: Math.floor(60 + Math.random() * 35),
        maxScore: 100,
      },
      confidence: {
        level: "high",
        score: generateMockConfidenceScore(),
        reasoning: "Multiple confluence factors support this analysis.",
      },
      riskAnalysis: {
        riskRewardRatio: 2.0,
        riskPercent: 1.0,
        positionSizing: "optimal",
        stopLossQuality: "good",
        takeProfitQuality: "good",
        maxDrawdownRisk: "low",
        suggestions: ["Maintain current risk parameters"],
      },
      suggestions: [],
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
    _imageFile: File,
    _options?: AIRequestOptions
  ): Promise<ScreenshotAnalysis> {
    const startTime = Date.now();

    this.processingState = {
      status: "loading",
      progress: 0,
      message: "Analyzing screenshot...",
    };

    // Simulate progressive processing
    for (let i = 0; i <= 100; i += 20) {
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
      status: "success",
      progress: 100,
      message: "Analysis complete",
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

  // ─── AIProvider Interface Requirements ───

  isAvailable(): boolean {
    return true;
  }

  getModels(): AIModelInfo[] {
    return this.models;
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
