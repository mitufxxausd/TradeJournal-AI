/**
 * Mock AI Provider
 * Returns realistic mock data for all AI features.
 * Used as the default provider when no real AI backend is configured.
 * All responses simulate processing delay for realistic UX testing.
 */

import type {
  AIProvider,
  AIProviderCapabilities,
  VisionAnalyzeRequest,
  ScreenshotAnalysis,
  TradeSummaryInput,
  TradeSummary,
  CoachingInput,
  AICoaching,
  CoachingItem,
  TranscriptionRequest,
  TranscriptionResult,
  ExtractedTradeData,
  ChartAnalysis,
  DetectedPattern,
  KeyLevel,
  MarketStructure,
  SubscriptionTier,
} from "../types";

const DELAY_MS = 1200;

function delay(ms: number = DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Mock Data Generators ───

function generateMockOCR(): ExtractedTradeData {
  const pairs = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "US30"];
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const entry = pair.includes("JPY") || pair.includes("XAU")
    ? +(150 + Math.random() * 50).toFixed(3)
    : +(1.05 + Math.random() * 0.2).toFixed(5);

  return {
    pair,
    timeframe: ["15M", "1H", "4H", "D"][Math.floor(Math.random() * 4)],
    entryPrice: entry,
    stopLoss: +(entry - (pair.includes("JPY") ? 0.5 : 0.005)).toFixed(5),
    takeProfit: +(entry + (pair.includes("JPY") ? 1.0 : 0.01)).toFixed(5),
    positionSize: +(0.1 + Math.random() * 2).toFixed(2),
    riskPercent: +(0.5 + Math.random() * 2).toFixed(2),
    rrRatio: +(1.5 + Math.random() * 2).toFixed(2),
    tradeDate: new Date().toISOString().split("T")[0],
    entryTime: `${String(8 + Math.floor(Math.random() * 8)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    broker: ["OANDA", "FTMO", "MyForexFunds", "Funding Pips"][Math.floor(Math.random() * 4)],
    account: ["Challenge", "Verification", "Funded"][Math.floor(Math.random() * 3)],
    direction: Math.random() > 0.5 ? "buy" : "sell",
    market: pair.includes("BTC") ? "crypto" : pair.includes("US30") ? "futures" : "forex",
    confidence: 0.7 + Math.random() * 0.25,
  };
}

function generateMockPatterns(): DetectedPattern[] {
  const allPatterns: DetectedPattern[] = [
    { type: "support", label: "Support Level", confidence: 0.89, description: "Strong support formed at recent swing low with multiple touches", location: "lower zone" },
    { type: "resistance", label: "Resistance Level", confidence: 0.82, description: "Key resistance from previous daily high", location: "upper zone" },
    { type: "fair_value_gap", label: "Fair Value Gap", confidence: 0.76, description: "1H bullish FVG created after London open sweep", location: "mid-range" },
    { type: "order_block", label: "Bullish Order Block", confidence: 0.85, description: "15M bullish order block with strong displacement", location: "near support" },
    { type: "choch", label: "CHoCH", confidence: 0.78, description: "Change of character on 1H timeframe indicating bullish shift", location: "structure point" },
    { type: "bos", label: "Break of Structure", confidence: 0.91, description: "Clean BOS with momentum candle", location: "key level" },
    { type: "demand_zone", label: "Demand Zone", confidence: 0.87, description: "Fresh demand zone after retracement", location: "lower quadrant" },
    { type: "liquidity_sweep", label: "Liquidity Sweep", confidence: 0.83, description: "Asian range liquidity sweep before reversal", location: "session low" },
  ];
  // Return 3-5 random patterns
  const count = 3 + Math.floor(Math.random() * 3);
  return allPatterns.sort(() => Math.random() - 0.5).slice(0, count);
}

function generateMockKeyLevels(): KeyLevel[] {
  const base = 1.08 + Math.random() * 0.05;
  return [
    { price: +(base + 0.008).toFixed(5), type: "resistance", strength: 8, description: "Daily resistance from previous high" },
    { price: +(base - 0.005).toFixed(5), type: "support", strength: 7, description: "4H swing low support" },
    { price: +(base + 0.003).toFixed(5), type: "supply", strength: 6, description: "15M supply zone" },
    { price: +(base - 0.012).toFixed(5), type: "demand", strength: 9, description: "Key daily demand zone" },
  ];
}

function generateMockMarketStructure(): MarketStructure {
  const trend = Math.random() > 0.4 ? "bullish" : Math.random() > 0.5 ? "bearish" : "sideways";
  return {
    trend,
    higherHighs: trend === "bullish",
    higherLows: trend === "bullish" || trend === "sideways",
    lowerHighs: trend === "bearish",
    lowerLows: trend === "bearish",
    structureShift: Math.random() > 0.5,
    keyLevels: generateMockKeyLevels(),
  };
}

function generateMockChartAnalysis(): ChartAnalysis {
  const patterns = generateMockPatterns();
  const bias = Math.random() > 0.4 ? "bullish" : Math.random() > 0.5 ? "bearish" : "neutral";

  return {
    patterns,
    indicators: [
      { type: "ema", label: "EMA 200", signal: bias === "bullish" ? "bullish" : "bearish", confidence: 0.85 },
      { type: "rsi", label: "RSI (14)", value: `${(40 + Math.random() * 30).toFixed(1)}`, signal: bias === "bullish" ? "bullish" : "neutral", confidence: 0.72 },
      { type: "volume", label: "Volume", signal: "bullish", confidence: 0.68 },
    ],
    marketStructure: generateMockMarketStructure(),
    keyLevels: generateMockKeyLevels(),
    session: ["London", "New York", "Asian"][Math.floor(Math.random() * 3)],
    overallBias: bias,
    confidence: 0.75 + Math.random() * 0.2,
    summary: `The chart shows a ${bias} bias with ${patterns.length} key patterns identified. Primary setup is a ${patterns[0]?.label.toLowerCase() || "technical level"} with ${(patterns[0]?.confidence || 0.8) * 100}% confidence. Market structure suggests ${bias === "bullish" ? "continuation higher after the current retracement" : bias === "bearish" ? "further downside pressure" : "consolidation before next directional move"}.`,
  };
}

function generateMockSummary(input: TradeSummaryInput): TradeSummary {
  const isWin = (input.profitLoss || 0) > 0;
  const qualityScore = Math.floor(50 + Math.random() * 50);

  return {
    summary: `This ${input.pair} ${input.direction} trade was a ${isWin ? "profitable" : "losing"} setup on the ${input.timeframe || "1H"} timeframe. The entry aligned with the ${input.strategy || "technical strategy"} approach. Risk management was ${qualityScore > 75 ? "well executed" : qualityScore > 50 ? "adequate" : "needs improvement"} with a ${input.rrRatio?.toFixed(2) || "1.5"}:1 risk-reward ratio.`,
    entryReason: `Price reached the ${input.strategy || "key technical"} level with confluence from multiple factors including market structure and indicator alignment. The ${input.session || "session"} provided adequate volatility for the setup.`,
    exitReason: isWin
      ? "Price reached the predetermined take profit target with favorable risk-reward execution."
      : "Stop loss was hit due to adverse price movement beyond the technical invalidation level.",
    riskAssessment: qualityScore > 75
      ? "Risk was well managed within acceptable parameters. Position sizing appropriate for account balance."
      : qualityScore > 50
        ? "Risk management was acceptable but could be improved with tighter stop placement."
        : "Risk was too high for this setup. Consider reducing position size or improving stop placement.",
    mistakes: qualityScore < 70
      ? ["Entry timing could be improved", "Consider waiting for additional confirmation"]
      : [],
    strengths: isWin
      ? ["Good technical analysis", "Proper risk management", "Clear setup identification"]
      : ["Proper stop loss placement", "Good technical analysis"],
    weaknesses: isWin
      ? ["Could have scaled in for better R:R"]
      : ["Entry timing", "Market condition assessment"],
    tradeQualityScore: qualityScore,
    confidenceScore: Math.floor(60 + Math.random() * 40),
    provider: "mock",
    generatedAt: new Date().toISOString(),
  };
}

function generateMockCoaching(input: CoachingInput): AICoaching {
  const items: CoachingItem[] = [];
  const riskScore = Math.floor(50 + Math.random() * 50);
  const emotionalScore = Math.floor(50 + Math.random() * 50);
  const disciplineScore = Math.floor(50 + Math.random() * 50);

  // Risk coaching
  if ((input.riskPercent || 0) > 2) {
    items.push({
      id: generateId(),
      type: "risk_management",
      severity: "warning",
      title: "Risk Too High",
      message: `Your risk of ${input.riskPercent}% exceeds the recommended 1-2% per trade.`,
      actionable: "Reduce position size to risk no more than 1-2% per trade. This protects your account during drawdown periods.",
      relatedField: "riskPercent",
    });
  }

  // RR coaching
  if ((input.rrRatio || 0) < 1.5) {
    items.push({
      id: generateId(),
      type: "risk_management",
      severity: "warning",
      title: "Low Risk-Reward Ratio",
      message: `Your R:R of ${input.rrRatio?.toFixed(2)} is below the minimum 1.5:1 threshold.`,
      actionable: "Wait for setups that offer at least 1.5:1 risk-reward. Be patient for better entry locations.",
      relatedField: "rrRatio",
    });
  }

  // Discipline
  if (disciplineScore < 60) {
    items.push({
      id: generateId(),
      type: "discipline",
      severity: "critical",
      title: "Discipline Alert",
      message: "Your trading discipline score indicates deviation from your trading plan.",
      actionable: "Review your trading plan before each session. Stick to your predefined rules and avoid impulsive decisions.",
    });
  }

  // Positive feedback
  if (disciplineScore > 75) {
    items.push({
      id: generateId(),
      type: "positive",
      severity: "info",
      title: "Great Discipline",
      message: "You followed your trading plan well on this trade. Keep it up!",
      actionable: "Continue following your process. Consistency is key to long-term profitability.",
    });
  }

  // Patience
  if (Math.random() > 0.6) {
    items.push({
      id: generateId(),
      type: "patience",
      severity: "info",
      title: "Good Patience",
      message: "You waited for the right setup to form before entering.",
      actionable: "Continue being selective with your trades. Quality over quantity.",
    });
  }

  return {
    overallFeedback: `Overall, this trade shows ${disciplineScore > 70 ? "strong" : "developing"} discipline with ${riskScore > 70 ? "good" : "room for improvement in"} risk management. Focus on ${riskScore < 70 ? "reducing risk per trade" : "maintaining consistency"} and ${disciplineScore < 70 ? "improving adherence to your plan" : "continuing your disciplined approach"}.`,
    items,
    disciplineScore,
    emotionalScore,
    riskScore,
    provider: "mock",
    generatedAt: new Date().toISOString(),
  };
}

function generateMockTranscription(): TranscriptionResult {
  const samples = [
    "I entered this trade because price swept the Asian session liquidity and left a fair value gap on the 15 minute timeframe. My entry was at the 50% retracement of the displacement candle.",
    "I was feeling confident about this setup. The daily trend is bullish and we had a clear break of structure on the 1 hour. I waited for the retracement into the demand zone before entering long.",
    "This was a revenge trade. I took it emotionally after the previous loss. I need to stick to my plan and not trade when I'm frustrated.",
    "Good patience on this trade. I waited for all my confluences to align: EMA 200 support, bullish divergence on RSI, and a hammer candle at the demand zone.",
  ];
  return {
    text: samples[Math.floor(Math.random() * samples.length)],
    confidence: 0.85 + Math.random() * 0.1,
    language: "en",
    provider: "mock",
  };
}

// ─── Mock AI Provider Implementation ───

export class MockAIProvider implements AIProvider {
  readonly name = "Mock AI (Demo)";
  readonly requiredTier: SubscriptionTier = "pro";

  readonly capabilities: AIProviderCapabilities = {
    vision: true,
    ocr: true,
    chartAnalysis: true,
    tradeSummary: true,
    coaching: true,
    transcription: true,
  };

  async analyzeScreenshot(request: VisionAnalyzeRequest): Promise<ScreenshotAnalysis | null> {
    await delay(800 + Math.random() * 800);
    console.log(`[MockAI] Analyzing screenshot: ${request.imageUrl.slice(0, 50)}...`);

    return {
      extractedData: generateMockOCR(),
      chartAnalysis: generateMockChartAnalysis(),
      source: "tradingview",
      processingTimeMs: DELAY_MS,
      provider: this.name,
    };
  }

  async analyzeScreenshotsBatch(requests: VisionAnalyzeRequest[]): Promise<ScreenshotAnalysis[]> {
    const results: ScreenshotAnalysis[] = [];
    for (const req of requests) {
      const result = await this.analyzeScreenshot(req);
      if (result) results.push(result);
    }
    return results;
  }

  async generateTradeSummary(input: TradeSummaryInput): Promise<TradeSummary | null> {
    await delay(600 + Math.random() * 600);
    return generateMockSummary(input);
  }

  async generateCoaching(input: CoachingInput): Promise<AICoaching | null> {
    await delay(700 + Math.random() * 700);
    return generateMockCoaching(input);
  }

  async transcribeAudio(_request: TranscriptionRequest): Promise<TranscriptionResult | null> {
    await delay(500 + Math.random() * 500);
    return generateMockTranscription();
  }
}

// Singleton instance
let mockProviderInstance: MockAIProvider | null = null;

export function getMockAIProvider(): MockAIProvider {
  if (!mockProviderInstance) {
    mockProviderInstance = new MockAIProvider();
  }
  return mockProviderInstance;
}
