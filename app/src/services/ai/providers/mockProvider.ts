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
  SubscriptionTier,
} from "../types";

import type { AIModelInfo } from "../types/common";

const DELAY_MS = 1200;

function delay(ms: number = DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Local Types for Internal Mock Data ───

interface DetectedPattern {
  type: string;
  label: string;
  confidence: number;
  description: string;
  location: string;
}

interface MockKeyLevel {
  price: number;
  type: string;
  strength: number;
  description: string;
}

interface MarketStructure {
  trend: string;
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  structureShift: boolean;
  keyLevels: MockKeyLevel[];
}

interface Indicator {
  type: string;
  label: string;
  signal: string;
  confidence: number;
  value?: string;
}

interface ChartAnalysis {
  patterns: DetectedPattern[];
  indicators: Indicator[];
  marketStructure: MarketStructure;
  keyLevels: MockKeyLevel[];
  session: string;
  overallBias: string;
  confidence: number;
  summary: string;
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
    direction: Math.random() > 0.5 ? "buy" : "sell",
    entryPrice: entry,
    exitPrice: null,
    stopLoss: +(entry - (pair.includes("JPY") ? 0.5 : 0.005)).toFixed(5),
    takeProfit: +(entry + (pair.includes("JPY") ? 1.0 : 0.01)).toFixed(5),
    positionSize: +(0.1 + Math.random() * 2).toFixed(2),
    confidence: 0.7 + Math.random() * 0.25,
    confidenceLevel: "high",
    source: "mock",
    method: "pattern_recognition",
  } as ExtractedTradeData;
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
  const count = 3 + Math.floor(Math.random() * 3);
  return allPatterns.sort(() => Math.random() - 0.5).slice(0, count);
}

function generateMockKeyLevels(): MockKeyLevel[] {
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
    id: generateId(),
    tradeId: generateId(),
    title: `${input.pair} ${input.direction} Summary`,
    overview: `This ${input.pair} ${input.direction} trade was a ${isWin ? "profitable" : "losing"} setup on the ${input.timeframe || "1H"} timeframe.`,
    keyObservations: [
      `Entry aligned with ${input.strategy || "technical strategy"} approach`,
      `Risk management was ${qualityScore > 75 ? "well executed" : qualityScore > 50 ? "adequate" : "needs improvement"}`,
      `R:R ratio of ${input.rrRatio?.toFixed(2) || "1.5"}:1`,
    ],
    whatWentWell: isWin
      ? ["Good technical analysis", "Proper risk management", "Clear setup identification"]
      : ["Proper stop loss placement"],
    whatToImprove: isWin
      ? ["Could have scaled in for better R:R"]
      : ["Entry timing", "Market condition assessment"],
    psychologicalFactors: ["Maintained discipline throughout the trade"],
    technicalAnalysis: `Price reached the ${input.strategy || "key technical"} level with confluence from multiple factors.`,
    riskManagementAssessment: qualityScore > 75
      ? "Risk was well managed within acceptable parameters."
      : "Risk management needs improvement.",
    actionableRecommendations: [
      "Continue following the trading plan",
      "Maintain risk parameters",
    ],
    marketContext: `${input.session || "Current"} session provided adequate volatility for the setup.`,
    confidence: qualityScore,
    provider: "mock",
    model: "mock-v1",
    generatedAt: new Date().toISOString(),
    processingTimeMs: DELAY_MS,
  };
}

function generateMockCoaching(input: CoachingInput): AICoaching {
  const items: CoachingItem[] = [];
  const riskScore = Math.floor(50 + Math.random() * 50);
  const emotionalScore = Math.floor(50 + Math.random() * 50);
  const disciplineScore = Math.floor(50 + Math.random() * 50);

  if ((input.riskPercent || 0) > 2) {
    items.push({
      id: generateId(),
      title: "Risk Too High",
      description: `Your risk of ${input.riskPercent}% exceeds the recommended 1-2% per trade.`,
      category: "risk-management",
      isCompleted: false,
      priority: "high",
    });
  }

  if ((input.rrRatio || 0) < 1.5) {
    items.push({
      id: generateId(),
      title: "Low Risk-Reward Ratio",
      description: `Your R:R of ${input.rrRatio?.toFixed(2)} is below the minimum 1.5:1 threshold.`,
      category: "risk-management",
      isCompleted: false,
      priority: "medium",
    });
  }

  if (disciplineScore < 60) {
    items.push({
      id: generateId(),
      title: "Discipline Alert",
      description: "Your trading discipline score indicates deviation from your trading plan.",
      category: "discipline",
      isCompleted: false,
      priority: "high",
    });
  }

  return {
    id: generateId(),
    userId: generateId(),
    tradeId: generateId(),
    plan: {
      focus: "Improve Overall Performance",
      summary: `Focus on ${riskScore < 70 ? "risk management" : "maintaining consistency"} and ${disciplineScore < 70 ? "improving discipline" : "continuing your approach"}.`,
      items: items.length > 0 ? items : [{
        id: generateId(),
        title: "Continue Good Practices",
        description: "Keep following your trading plan consistently.",
        category: "discipline",
        isCompleted: false,
        priority: "medium",
      }],
      priority: riskScore < 60 ? "high" : "medium",
      timeframe: "2 weeks",
      expectedOutcome: "Improved trading performance through disciplined execution.",
    },
    insights: [
      {
        id: generateId(),
        title: "Performance Analysis",
        description: `Your trading shows ${disciplineScore > 70 ? "strong" : "developing"} discipline.`,
        category: "performance",
        severity: disciplineScore > 70 ? "positive" : "warning",
      },
    ],
    goals: [
      {
        id: generateId(),
        title: "Maintain Risk Parameters",
        description: "Keep risk per trade at or below 2%",
        category: "risk-management",
        isAchieved: riskScore > 70,
        progress: riskScore,
      },
    ],
    feedback: {
      strengths: ["Good technical analysis foundation", "Willingness to learn"],
      weaknesses: disciplineScore < 60 ? ["Discipline needs improvement"] : [],
      opportunities: ["Focus on high-probability setups"],
      threats: ["Emotional decision-making during drawdowns"],
      overallRating: Math.round((disciplineScore + riskScore) / 20),
      overallComment: `Overall, this trade shows ${disciplineScore > 70 ? "strong" : "developing"} discipline with ${riskScore > 70 ? "good" : "room for improvement in"} risk management.`,
    },
    confidence: Math.round((disciplineScore + riskScore + emotionalScore) / 3),
    provider: "mock",
    model: "mock-v1",
    generatedAt: new Date().toISOString(),
    processingTimeMs: DELAY_MS,
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
  readonly version = "1.0.0";
  readonly requiredTier: SubscriptionTier = "pro";
  readonly models: AIModelInfo[] = [];

  readonly capabilities: AIProviderCapabilities = {
    vision: true,
    ocr: true,
    chartAnalysis: true,
    tradeSummary: true,
    coaching: true,
    transcription: true,
  };

  isAvailable(): boolean {
    return true;
  }

  getModels(): AIModelInfo[] {
    return this.models;
  }

  async analyzeScreenshot(request: VisionAnalyzeRequest): Promise<ScreenshotAnalysis | null> {
    await delay(800 + Math.random() * 800);
    console.log(`[MockAI] Analyzing screenshot: ${request.imageUrl.slice(0, 50)}...`);

    return {
      id: generateId(),
      screenshotId: generateId(),
      tradeData: generateMockOCR(),
      detectedSetup: "Mock pattern detection",
      marketContext: "Mock market analysis",
      keyLevels: [
        { type: "support", price: 1.0820, confidence: 90, description: "Previous swing low" },
        { type: "resistance", price: 1.0920, confidence: 85, description: "Recent high" },
      ],
      riskAssessment: {
        riskRewardRatio: 2.3,
        riskPercent: 1.0,
        potentialProfit: 70,
        potentialLoss: 30,
        assessment: "Favorable risk-reward setup.",
        recommendation: "Proceed with standard position sizing.",
      },
      confidence: 87,
      confidenceLevel: "high",
      processingTimeMs: DELAY_MS,
      provider: this.name,
      model: "mock-v1",
      analyzedAt: new Date().toISOString(),
      status: "completed",
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
