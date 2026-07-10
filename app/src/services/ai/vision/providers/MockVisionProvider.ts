/**
 * Mock Vision Provider
 * Simulates AI Vision analysis without making real API calls.
 *
 * This provider:
 * - Is ALWAYS available (no API key needed)
 * - Returns realistic mock data for development and testing
 * - Simulates processing delays for realistic UX
 * - Supports all vision features with mock implementations
 * - Is used as fallback when no real vision provider is configured
 *
 * IMPORTANT: This is NOT fake AI. It explicitly returns mock data
 * for development purposes only. Real providers will be used in production.
 */

import type { VisionProvider, VisionProviderConfig } from "../VisionProvider";
import type {
  VisionAnalysisResult,
  VisionRequestOptions,
  VisionBatchResult,
  VisionExtractedTradeData,
  VisionChartAnalysis,
  VisionFeatureFlags,
  VisionProviderInfo,
} from "../VisionAnalysisResult";
import { DEFAULT_VISION_FEATURE_FLAGS } from "../VisionAnalysisResult";
import type {
  DetectedChartPattern,
  DetectedLevel,
  TrendAnalysis,
  DetectedCandlestickPattern,
  DetectedIndicator,
  VisionFeatureConfidence,
  DetectedRegion,
} from "../VisionFeatureTypes";
import { simulateProcessing, generateAIId, randomPick, randomInt, randomFloat } from "../../utils";

// ─── Provider Implementation ───

export class MockVisionProvider implements VisionProvider {
  readonly name = "Mock Vision Provider";
  readonly providerId = "mock-vision";
  readonly version = "1.0.0";

  readonly supportedFeatures: VisionFeatureFlags = {
    patterns: true,
    levels: true,
    trend: true,
    candlestickPatterns: true,
    indicators: true,
    volume: true,
    annotations: true,
    tradeData: true,
    platform: true,
  };

  private config: VisionProviderConfig;

  constructor(config?: Partial<VisionProviderConfig>) {
    this.config = {
      providerId: this.providerId,
      name: this.name,
      enabled: true,
      priority: 0,
      timeoutMs: 30000,
      features: { ...DEFAULT_VISION_FEATURE_FLAGS },
      ...config,
    };
  }

  isAvailable(): boolean {
    // Mock provider is always available
    return this.config.enabled;
  }

  async analyze(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const analysisType = options?.analysisType ?? "full_analysis";

    // Simulate processing delay
    const delayMs = await simulateProcessing(500, 1500);

    if (options?.abortSignal?.aborted) {
      return this.createErrorResult("Analysis was aborted", startTime);
    }

    try {
      // Determine what to analyze based on options
      const features = options?.features;
      const includeTradeData = !features || features.includes("trade_data");
      const includeChart = !features || features.some((f) =>
        ["patterns", "levels", "trend", "candlestick_patterns", "indicators", "volume"].includes(f)
      );

      const tradeData = includeTradeData && (analysisType === "trade_extraction" || analysisType === "full_analysis")
        ? generateMockTradeData()
        : null;

      const chartAnalysis = includeChart && (analysisType === "chart_analysis" || analysisType === "full_analysis")
        ? generateMockChartAnalysis(features)
        : null;

      const processingTimeMs = Date.now() - startTime;

      return {
        success: true,
        analysisType,
        provider: {
          name: this.name,
          providerId: this.providerId,
          model: "mock-vision-v1",
          isRealProvider: false,
          version: this.version,
        },
        tradeData,
        chartAnalysis,
        processingTimeMs,
        analyzedAt: new Date().toISOString(),
        warnings: ["This is mock analysis data for development purposes only."],
      };
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : "Mock analysis failed",
        startTime
      );
    }
  }

  async analyzeBatch(imageFiles: File[], options?: VisionRequestOptions): Promise<VisionBatchResult> {
    const results: VisionAnalysisResult[] = [];
    let successCount = 0;
    let failureCount = 0;
    const startTime = Date.now();

    for (const file of imageFiles) {
      const result = await this.analyze(file, options);
      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      results,
      overallSuccess: failureCount === 0,
      totalProcessingTimeMs: Date.now() - startTime,
      successCount,
      failureCount,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    const healthy = this.isAvailable();
    return {
      healthy,
      latencyMs: Date.now() - start,
      message: healthy ? "Mock vision provider is ready" : "Mock vision provider is disabled",
    };
  }

  // ─── Private Helpers ───

  private createErrorResult(error: string, startTime: number): VisionAnalysisResult {
    return {
      success: false,
      analysisType: "full_analysis",
      provider: {
        name: this.name,
        providerId: this.providerId,
        model: "mock-vision-v1",
        isRealProvider: false,
      },
      tradeData: null,
      chartAnalysis: null,
      processingTimeMs: Date.now() - startTime,
      analyzedAt: new Date().toISOString(),
      error,
      warnings: [],
    };
  }
}

// ─── Singleton Instance ───

let mockVisionProviderInstance: MockVisionProvider | null = null;

export function getMockVisionProvider(): MockVisionProvider {
  if (!mockVisionProviderInstance) {
    mockVisionProviderInstance = new MockVisionProvider();
  }
  return mockVisionProviderInstance;
}

export function resetMockVisionProvider(): void {
  mockVisionProviderInstance = null;
}

// ─── Mock Data Generators ───

function generateMockConfidence(score?: number): VisionFeatureConfidence {
  const finalScore = score ?? randomFloat(0.6, 0.95, 2);
  return {
    score: finalScore,
    level: finalScore > 0.8 ? "high" : finalScore > 0.5 ? "medium" : "low",
    confirmingFactors: randomInt(1, 4),
  };
}

function generateMockRegion(): DetectedRegion {
  const x1 = randomFloat(0, 0.7, 3);
  const y1 = randomFloat(0, 0.7, 3);
  const x2 = Math.min(x1 + randomFloat(0.1, 0.3, 3), 1);
  const y2 = Math.min(y1 + randomFloat(0.1, 0.3, 3), 1);
  return {
    x1, y1, x2, y2,
    areaPercent: Math.round(((x2 - x1) * (y2 - y1)) * 1000) / 10,
  };
}

function generateMockTradeData(): VisionExtractedTradeData {
  const pairs = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "US30", "AUDUSD", "USOIL"];
  const pair = randomPick(pairs);
  const isJPY = pair.includes("JPY");
  const isXAU = pair.includes("XAU");
  const isCrypto = pair.includes("BTC") || pair.includes("ETH");
  const isIndex = pair.includes("US30") || pair.includes("US100");

  const entryBase = isJPY ? randomFloat(140, 160, 3) :
    isXAU ? randomFloat(1900, 2100, 2) :
    isCrypto ? randomFloat(25000, 45000, 2) :
    isIndex ? randomFloat(33000, 36000, 2) :
    randomFloat(1.05, 1.25, 5);

  const entryPrice = entryBase;
  const direction = Math.random() > 0.5 ? "buy" as const : "sell" as const;
  const pipSize = isJPY ? 0.01 : isXAU ? 0.1 : isCrypto ? 100 : isIndex ? 10 : 0.0001;
  const slDistance = pipSize * randomInt(50, 200);
  const tpDistance = pipSize * randomInt(100, 400);

  return {
    symbol: pair,
    direction,
    entryPrice: entryPrice,
    stopLoss: direction === "buy" ? entryPrice - slDistance : entryPrice + slDistance,
    takeProfit: direction === "buy" ? entryPrice + tpDistance : entryPrice - tpDistance,
    positionSize: randomFloat(0.01, 2.0, 2),
    riskReward: randomFloat(1.5, 4.0, 1),
    broker: randomPick(["MetaTrader 5", "TradingView", "cTrader", "NinjaTrader", null]),
    fieldConfidence: {
      symbol: randomFloat(0.8, 0.98, 2),
      direction: randomFloat(0.75, 0.95, 2),
      entryPrice: randomFloat(0.7, 0.95, 2),
      stopLoss: randomFloat(0.7, 0.95, 2),
      takeProfit: randomFloat(0.7, 0.95, 2),
      positionSize: randomFloat(0.5, 0.9, 2),
    },
    overallConfidence: randomFloat(0.7, 0.95, 2),
  };
}

function generateMockChartAnalysis(requestedFeatures?: string[]): VisionChartAnalysis {
  const allPatterns = generateMockPatterns();
  const allLevels = generateMockLevels();
  const trend = generateMockTrend();
  const candlestickPatterns = generateMockCandlestickPatterns();
  const indicators = generateMockIndicators();
  const volume = generateMockVolume();
  const timeframe = generateMockTimeframe();
  const platform = generateMockPlatform();

  // Filter by requested features if specified
  const includePatterns = !requestedFeatures || requestedFeatures.includes("patterns");
  const includeLevels = !requestedFeatures || requestedFeatures.includes("levels");
  const includeTrend = !requestedFeatures || requestedFeatures.includes("trend");
  const includeCandlestick = !requestedFeatures || requestedFeatures.includes("candlestick_patterns");
  const includeIndicators = !requestedFeatures || requestedFeatures.includes("indicators");
  const includeVolume = !requestedFeatures || requestedFeatures.includes("volume");

  return {
    patterns: includePatterns ? allPatterns : [],
    levels: includeLevels ? allLevels : [],
    trend: includeTrend ? trend : { ...trend, direction: "sideways" as const, strength: "weak" as const },
    candlestickPatterns: includeCandlestick ? candlestickPatterns : [],
    indicators: includeIndicators ? indicators : [],
    volume: includeVolume ? volume : undefined,
    timeframe,
    platform,
    overallBias: randomPick(["bullish", "bearish", "neutral"]),
    summary: generateMockSummary(allPatterns, trend),
    confidence: generateMockConfidence(),
  };
}

function generateMockPatterns(): DetectedChartPattern[] {
  const patterns: Array<{ type: string; name: string; direction: "bullish" | "bearish" | "neutral"; description: string; significance: "high" | "medium" | "low" }> = [
    { type: "ascending_triangle", name: "Ascending Triangle", direction: "bullish", description: "Price consolidating between horizontal resistance and rising support. Breakout likely above resistance.", significance: "high" },
    { type: "support_zone", name: "Support Zone", direction: "bullish", description: "Strong support formed at recent swing low with multiple touches.", significance: "high" },
    { type: "channel_up", name: "Ascending Channel", direction: "bullish", description: "Price trading within a rising parallel channel.", significance: "medium" },
    { type: "double_bottom", name: "Double Bottom", direction: "bullish", description: "W-shaped pattern forming at support level. Potential trend reversal signal.", significance: "high" },
    { type: "bull_flag", name: "Bull Flag", direction: "bullish", description: "Sharp upward move followed by downward channel consolidation. Continuation pattern.", significance: "medium" },
    { type: "head_and_shoulders", name: "Head and Shoulders", direction: "bearish", description: "Classic reversal pattern with three peaks. Neckline break would confirm bearish move.", significance: "high" },
    { type: "rising_wedge", name: "Rising Wedge", direction: "bearish", description: "Converging trendlines in an uptrend. Bearish reversal pattern.", significance: "medium" },
    { type: "demand_zone", name: "Demand Zone", direction: "bullish", description: "Fresh demand zone after retracement with strong buying pressure.", significance: "high" },
  ];

  const count = randomInt(2, 4);
  const selected = [...patterns].sort(() => Math.random() - 0.5).slice(0, count);

  return selected.map((p) => ({
    id: generateAIId("pattern"),
    type: p.type as DetectedChartPattern["type"],
    name: p.name,
    direction: p.direction,
    completion: randomPick(["forming", "confirmed", "breaking_out"]),
    confidence: generateMockConfidence(),
    region: generateMockRegion(),
    startPrice: randomFloat(1.08, 1.12, 5),
    endPrice: randomFloat(1.08, 1.12, 5),
    priceTarget: randomFloat(1.09, 1.15, 5),
    description: p.description,
    significance: p.significance,
    touches: randomInt(2, 5),
    volumeProfile: randomPick(["increasing", "decreasing", "neutral"]),
  }));
}

function generateMockLevels(): DetectedLevel[] {
  const base = 1.08 + Math.random() * 0.05;
  const levels: Array<{ type: string; price: number; strength: "strong" | "moderate" | "weak"; description: string; touches: number }> = [
    { type: "resistance", price: +(base + 0.008).toFixed(5), strength: "strong", description: "Daily resistance from previous high", touches: 4 },
    { type: "support", price: +(base - 0.005).toFixed(5), strength: "moderate", description: "4H swing low support", touches: 3 },
    { type: "supply", price: +(base + 0.003).toFixed(5), strength: "moderate", description: "15M supply zone", touches: 2 },
    { type: "demand", price: +(base - 0.012).toFixed(5), strength: "strong", description: "Key daily demand zone", touches: 5 },
    { type: "order_block", price: +(base - 0.003).toFixed(5), strength: "strong", description: "Bullish order block with displacement", touches: 2 },
  ];

  return levels.map((l) => ({
    id: generateAIId("level"),
    price: l.price,
    type: l.type as DetectedLevel["type"],
    strength: l.strength,
    touches: l.touches,
    confidence: generateMockConfidence(),
    region: generateMockRegion(),
    description: l.description,
    isBeingTested: Math.random() > 0.5,
    timeframe: randomPick(["1H", "4H", "Daily", "15M"]),
    confluenceFactors: l.touches > 3 ? ["Multiple touches", "Round number"] : undefined,
  }));
}

function generateMockTrend(): TrendAnalysis {
  const directions: Array<"uptrend" | "downtrend" | "sideways" | "choppy"> = ["uptrend", "downtrend", "sideways", "choppy"];
  const direction = randomPick(directions);
  const isUptrend = direction === "uptrend";
  const isDowntrend = direction === "downtrend";

  return {
    direction,
    strength: randomPick(["strong", "moderate", "weak"]),
    confidence: generateMockConfidence(),
    higherHighs: isUptrend,
    higherLows: isUptrend || direction === "sideways",
    lowerHighs: isDowntrend,
    lowerLows: isDowntrend,
    structureShift: Math.random() > 0.7,
    breakOfStructure: Math.random() > 0.6,
    changeOfCharacter: Math.random() > 0.7,
    description: `Market is in a ${direction} with ${isUptrend ? "higher highs and higher lows" : isDowntrend ? "lower highs and lower lows" : "consolidating price action"}.`,
    higherTimeframeTrend: randomPick(["uptrend", "downtrend", "sideways"]),
    estimatedDuration: randomPick(["Short-term", "Medium-term", "Long-term"]),
  };
}

function generateMockCandlestickPatterns(): DetectedCandlestickPattern[] {
  const patterns: Array<{ type: string; name: string; signal: "bullish" | "bearish" | "neutral"; description: string; reliability: "high" | "medium" | "low" }> = [
    { type: "hammer", name: "Hammer", signal: "bullish", description: "Bullish reversal pattern with small body and long lower wick at support.", reliability: "high" },
    { type: "engulfing_bullish", name: "Bullish Engulfing", signal: "bullish", description: "Large bullish candle completely engulfs previous bearish candle.", reliability: "high" },
    { type: "doji", name: "Doji", signal: "neutral", description: "Indecision candle with open and close nearly equal. Watch for breakout.", reliability: "medium" },
    { type: "morning_star", name: "Morning Star", signal: "bullish", description: "Three-candle bullish reversal pattern after a downtrend.", reliability: "high" },
    { type: "shooting_star", name: "Shooting Star", signal: "bearish", description: "Bearish reversal with small body and long upper wick at resistance.", reliability: "medium" },
  ];

  const count = randomInt(1, 3);
  const selected = [...patterns].sort(() => Math.random() - 0.5).slice(0, count);

  return selected.map((p) => ({
    id: generateAIId("candle"),
    type: p.type as DetectedCandlestickPattern["type"],
    name: p.name,
    signal: p.signal,
    confidence: generateMockConfidence(),
    region: generateMockRegion(),
    price: randomFloat(1.08, 1.12, 5),
    description: p.description,
    reliability: p.reliability,
    context: randomPick(["At support", "At resistance", "Mid-range", "After breakout"]),
    trendAlignment: randomPick(["with_trend", "against_trend", "neutral"]),
  }));
}

function generateMockIndicators(): DetectedIndicator[] {
  return [
    {
      id: generateAIId("ind"),
      type: "ema",
      name: "EMA 200",
      value: randomFloat(1.08, 1.10, 5),
      signal: randomPick(["bullish", "bearish", "neutral"]),
      confidence: generateMockConfidence(),
      region: generateMockRegion(),
      description: "Price relative to 200-period EMA",
      period: "200",
      interpretation: randomPick([
        "Price above EMA 200 indicates bullish trend bias",
        "Price below EMA 200 indicates bearish trend bias",
        "Price testing EMA 200 - potential trend decision point",
      ]),
    },
    {
      id: generateAIId("ind"),
      type: "rsi",
      name: "RSI (14)",
      value: randomInt(30, 70),
      signal: randomPick(["bullish", "bearish", "neutral", "overbought", "oversold"]),
      confidence: generateMockConfidence(),
      region: generateMockRegion(),
      description: "Relative Strength Index momentum reading",
      period: "14",
      interpretation: randomPick([
        "RSI in neutral zone - no extreme conditions",
        "RSI approaching overbought - watch for reversal",
        "RSI showing bullish divergence",
        "RSI supporting current trend direction",
      ]),
    },
    {
      id: generateAIId("ind"),
      type: "volume",
      name: "Volume",
      signal: randomPick(["bullish", "bearish", "neutral"]),
      confidence: generateMockConfidence(),
      region: generateMockRegion(),
      description: "Volume profile analysis",
      interpretation: randomPick([
        "Volume increasing on up moves - bullish confirmation",
        "Volume declining - potential weakening of trend",
        "Average volume - no significant volume signals",
      ]),
    },
  ];
}

function generateMockVolume() {
  return {
    trend: randomPick(["increasing", "decreasing", "neutral"]) as "increasing" | "decreasing" | "neutral",
    volumeAtKeyLevels: [
      { price: randomFloat(1.08, 1.12, 5), volumeRelative: "high" as const, significance: "Strong buying interest at support" },
      { price: randomFloat(1.08, 1.12, 5), volumeRelative: "average" as const, significance: "Normal volume at resistance test" },
    ],
    confidence: generateMockConfidence(),
    description: randomPick([
      "Volume profile supports current price action",
      "Declining volume suggests caution",
      "Volume spike indicates significant interest",
    ]),
  };
}

function generateMockTimeframe() {
  return {
    timeframe: randomPick(["1M", "5M", "15M", "1H", "4H", "Daily"]),
    confidence: generateMockConfidence(),
    multipleTimeframes: Math.random() > 0.7,
    additionalTimeframes: Math.random() > 0.7 ? ["4H", "Daily"] : undefined,
  };
}

function generateMockPlatform() {
  return {
    platform: randomPick(["MetaTrader 5", "TradingView", "cTrader", "NinjaTrader", "Custom Platform"]),
    confidence: generateMockConfidence(),
    detectedFeatures: ["Chart", "Indicators", "Toolbar"],
    theme: randomPick(["light", "dark"]) as "light" | "dark",
  };
}

function generateMockSummary(patterns: DetectedChartPattern[], trend: TrendAnalysis): string {
  const patternNames = patterns.map((p) => p.name).join(", ");
  return `Chart analysis reveals a ${trend.direction} market structure with ${patterns.length} key patterns identified: ${patternNames}. ${trend.description} Multiple confluence factors support the current bias. Monitor key levels for potential breakout or reversal scenarios.`;
}
