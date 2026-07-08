import type { TradeSummary, TradeScore, ConfidenceScore, RiskAnalysis, TradeSuggestion } from "../../types/trade-analysis";
import type { ChartPattern, Indicator, SupportResistance, OrderBlock, FairValueGap, LiquidityZone, ChartAnalysisResult } from "../../types/chart-analysis";
import type { OCRResult, OCRField } from "../../types/ocr";
import type { CoachingResult, CoachingPlan, CoachingItem, CoachingInsight, CoachingGoal } from "../../types/coaching";
import type { VoiceTranscript, TranscriptSegment } from "../../types/transcription";

/**
 * Mock Data Generators
 * Creates realistic fake data for testing and development
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const simulateProcessing = async (minMs = 800, maxMs = 2500): Promise<number> => {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await delay(duration);
  return duration;
};

export const generateMockTradeSummary = (): TradeSummary => ({
  overview:
    "This trade demonstrated solid execution with a clear entry based on support confluence. The risk management was appropriate with a well-placed stop loss below the recent swing low. The take profit target was reached efficiently, showing good trade planning.",
  strengths: [
    "Clean entry at a well-defined support level",
    "Proper risk-to-reward ratio of 1:2.5",
    "Good position sizing within risk parameters",
    "Patient execution waiting for confirmation",
  ],
  weaknesses: [
    "Entry could have been optimized with a tighter stop",
    "Partial profit taking was not considered",
    "No trailing stop was used to maximize gains",
  ],
  keyTakeaways: [
    "The support level held as expected with volume confirmation",
    "Risk management was the key factor in this successful trade",
    "Consider scaling out at multiple targets in future similar setups",
  ],
  verdict: "good",
});

export const generateMockTradeScore = (): TradeScore => ({
  overall: 78,
  entryQuality: 82,
  exitQuality: 75,
  riskManagement: 85,
  psychology: 70,
  setupQuality: 80,
  maxScore: 100,
});

export const generateMockConfidenceScore = (): ConfidenceScore => ({
  level: "high",
  score: 85,
  reasoning:
    "Multiple confluent factors supported this trade setup including technical levels, volume profile, and market structure.",
});

export const generateMockRiskAnalysis = (): RiskAnalysis => ({
  riskRewardRatio: 2.5,
  riskPercent: 1.2,
  positionSizing: "optimal",
  stopLossQuality: "good",
  takeProfitQuality: "good",
  maxDrawdownRisk: "low",
  suggestions: [
    "Consider reducing position size to 0.8% risk for more volatile pairs",
    "Trail stop loss after price reaches 1R to protect profits",
    "Set partial take profit at 1.5R and let remainder run",
  ],
});

export const generateMockTradeSuggestions = (): TradeSuggestion[] => [
  {
    category: "entry",
    priority: "medium",
    title: "Wait for candlestick confirmation",
    description:
      "Consider waiting for a bullish engulfing or pin bar at support before entering to improve entry timing.",
    actionable: true,
  },
  {
    category: "risk",
    priority: "high",
    title: "Implement trailing stop strategy",
    description:
      "Use a trailing stop of 1.5 ATR once price moves 1R in your favor to protect profits on winning trades.",
    actionable: true,
  },
  {
    category: "psychology",
    priority: "medium",
    title: "Document pre-trade emotions",
    description:
      "Your confidence level was at 65%. Consider taking a moment to breathe and center yourself before executing.",
    actionable: true,
  },
  {
    category: "setup",
    priority: "low",
    title: "Check higher timeframe alignment",
    description:
      "Ensure the daily and 4H charts align with your entry timeframe for stronger confluence.",
    actionable: true,
  },
];

export const generateMockChartPatterns = (): ChartPattern[] => [
  {
    id: "pat-1",
    type: "ascending-triangle",
    name: "Ascending Triangle",
    direction: "bullish",
    confidence: 82,
    startPrice: 1.085,
    endPrice: 1.095,
    startTime: "2024-01-15T08:00:00Z",
    endTime: "2024-01-15T14:00:00Z",
    description: "Price is consolidating in an ascending triangle pattern with horizontal resistance at 1.0950 and rising support trendline. Volume is decreasing during consolidation, suggesting a potential breakout.",
    significance: "high",
    completionPercent: 78,
    measuredTarget: 1.105,
    invalidationLevel: 1.08,
  },
  {
    id: "pat-2",
    type: "flag",
    name: "Bull Flag",
    direction: "bullish",
    confidence: 74,
    startPrice: 1.092,
    endPrice: 1.089,
    startTime: "2024-01-15T12:00:00Z",
    endTime: "2024-01-15T16:00:00Z",
    description: "A brief consolidation forming a flag pattern after the strong upward move. The pullback is shallow, indicating strong buying pressure.",
    significance: "medium",
    completionPercent: 65,
    measuredTarget: 1.098,
    invalidationLevel: 1.085,
  },
];

export const generateMockIndicators = (): Indicator[] => [
  {
    type: "ema",
    name: "EMA 20",
    value: 1.0895,
    signal: "bullish",
    interpretation: "Price trading above EMA 20 indicates short-term bullish momentum",
    period: "20",
  },
  {
    type: "rsi",
    name: "RSI (14)",
    value: 62.4,
    signal: "neutral",
    interpretation: "RSI in neutral zone with room to move higher before overbought conditions",
    period: "14",
  },
  {
    type: "macd",
    name: "MACD",
    value: 0.0015,
    signal: "bullish",
    interpretation: "MACD line above signal line with positive histogram, indicating bullish momentum",
  },
  {
    type: "bollinger-bands",
    name: "Bollinger Bands",
    value: 1.091,
    signal: "neutral",
    interpretation: "Price near upper band but not overextended. Bandwidth is contracting, suggesting a volatility squeeze may be forming.",
  },
  {
    type: "atr",
    name: "ATR (14)",
    value: 0.0045,
    signal: "neutral",
    interpretation: "Average true range indicates moderate volatility. Use 1.5x ATR for stop placement.",
    period: "14",
  },
];

export const generateMockSupportResistance = (): SupportResistance[] => [
  { id: "sr-1", level: 1.08, type: "support", strength: "strong", touches: 4, timeframe: "4H", isActive: true },
  { id: "sr-2", level: 1.095, type: "resistance", strength: "strong", touches: 5, timeframe: "4H", isActive: true },
  { id: "sr-3", level: 1.105, type: "resistance", strength: "moderate", touches: 2, timeframe: "1D", isActive: true },
  { id: "sr-4", level: 1.075, type: "support", strength: "strong", touches: 6, timeframe: "1D", isActive: true },
  { id: "sr-5", level: 1.09, type: "pivot", strength: "moderate", touches: 3, timeframe: "1H", isActive: true },
];

export const generateMockOrderBlocks = (): OrderBlock[] => [
  {
    id: "ob-1",
    top: 1.0875,
    bottom: 1.086,
    type: "bullish",
    timeframe: "1H",
    strength: "strong",
    mitigationLevel: 1.086,
    isMitigated: false,
  },
  {
    id: "ob-2",
    top: 1.092,
    bottom: 1.0905,
    type: "bearish",
    timeframe: "1H",
    strength: "moderate",
    mitigationLevel: 1.092,
    isMitigated: true,
  },
];

export const generateMockFairValueGaps = (): FairValueGap[] => [
  {
    id: "fvg-1",
    top: 1.0885,
    bottom: 1.0878,
    type: "bullish",
    timeframe: "15m",
    status: "unfilled",
    fillPercent: 0,
  },
  {
    id: "fvg-2",
    top: 1.0912,
    bottom: 1.0905,
    type: "bearish",
    timeframe: "1H",
    status: "partially-filled",
    fillPercent: 45,
  },
];

export const generateMockLiquidityZones = (): LiquidityZone[] => [
  { id: "lq-1", price: 1.08, type: "sell-side", strength: "high", timeframe: "4H", swept: false },
  { id: "lq-2", price: 1.095, type: "buy-side", strength: "medium", timeframe: "1H", swept: true },
];

export const generateMockOCRResult = (): OCRResult => {
  const fields: OCRField[] = [
    { id: "f1", type: "symbol", label: "Symbol", value: "EURUSD", confidence: 98, region: { x: 10, y: 10, width: 80, height: 20 } },
    { id: "f2", type: "direction", label: "Direction", value: "Buy", confidence: 99, region: { x: 100, y: 10, width: 60, height: 20 } },
    { id: "f3", type: "entry-price", label: "Entry Price", value: "1.08950", confidence: 95, region: { x: 10, y: 40, width: 100, height: 20 } },
    { id: "f4", type: "exit-price", label: "Exit Price", value: "1.09120", confidence: 94, region: { x: 120, y: 40, width: 100, height: 20 } },
    { id: "f5", type: "stop-loss", label: "Stop Loss", value: "1.08800", confidence: 93, region: { x: 10, y: 70, width: 100, height: 20 } },
    { id: "f6", type: "take-profit", label: "Take Profit", value: "1.09250", confidence: 92, region: { x: 120, y: 70, width: 100, height: 20 } },
    { id: "f7", type: "position-size", label: "Lot Size", value: "0.50", confidence: 97, region: { x: 10, y: 100, width: 80, height: 20 } },
    { id: "f8", type: "profit-loss", label: "Profit", value: "+85.00", confidence: 96, region: { x: 100, y: 100, width: 80, height: 20 } },
    { id: "f9", type: "date", label: "Date", value: "2024-01-15", confidence: 99, region: { x: 10, y: 130, width: 100, height: 20 } },
    { id: "f10", type: "time", label: "Time", value: "14:30:00", confidence: 98, region: { x: 120, y: 130, width: 100, height: 20 } },
    { id: "f11", type: "rr-ratio", label: "R:R", value: "1:2.0", confidence: 90, region: { x: 10, y: 160, width: 60, height: 20 } },
  ];

  return {
    text: "EURUSD Buy Entry: 1.08950 Exit: 1.09120 SL: 1.08800 TP: 1.09250 Lot: 0.50 Profit: +85.00 Date: 2024-01-15 Time: 14:30:00 R:R 1:2.0",
    tradeData: {
      symbol: "EURUSD",
      direction: "buy",
      entryPrice: 1.0895,
      exitPrice: 1.0912,
      stopLoss: 1.088,
      takeProfit: 1.0925,
      positionSize: 0.5,
      profitLoss: 85,
      date: "2024-01-15",
      time: "14:30:00",
      rrRatio: 2.0,
      rawFields: fields,
    },
    fields,
    confidence: 95,
    processingTimeMs: 1200,
    metadata: {
      engine: "mock-ocr-v1",
      processedAt: new Date().toISOString(),
    },
  };
};

export const generateMockChartAnalysis = (): ChartAnalysisResult => ({
  patterns: generateMockChartPatterns(),
  indicators: generateMockIndicators(),
  supportResistance: generateMockSupportResistance(),
  orderBlocks: generateMockOrderBlocks(),
  fairValueGaps: generateMockFairValueGaps(),
  liquidityZones: generateMockLiquidityZones(),
  summary:
    "The EURUSD 4H chart shows a bullish ascending triangle formation with price consolidating near resistance at 1.0950. Multiple confluent factors support a bullish bias including the ascending triangle pattern, bullish EMA alignment, and strong support at 1.0800. A confirmed breakout above 1.0950 could target 1.1050 based on the measured move.",
  overallBias: "bullish",
  confidence: 78,
  keyLevels: [1.08, 1.085, 1.09, 1.095, 1.105],
  metadata: {
    analysisVersion: "1.0.0-mock",
    analyzedAt: new Date().toISOString(),
    provider: "mock",
  },
});

export const generateMockCoachingResult = (): CoachingResult => {
  const plan: CoachingPlan = {
    id: "coach-plan-1",
    title: "January Trading Improvement Plan",
    description: "Based on your recent trading performance, this plan focuses on improving risk management discipline and entry timing.",
    goals: [
      { id: "g1", title: "Maintain risk per trade below 1%", target: "<1% risk", progress: 75, status: "in-progress" },
      { id: "g2", title: "Improve win rate to 55%+", target: "55%", progress: 60, status: "in-progress" },
      { id: "g3", title: "Journal every trade within 1 hour", target: "100% journaling", progress: 40, status: "overdue" },
    ],
    items: [
      {
        id: "ci-1",
        category: "risk-management",
        priority: "critical",
        title: "Set hard stop loss on every trade",
        description: "Your recent losses show a pattern of moving stop losses. Set a hard stop and never move it against your position.",
        actionableSteps: [
          "Set stop loss immediately upon entry",
          "Use broker OCO orders when available",
          "Review trades where you moved stops - identify triggers",
        ],
        expectedOutcome: "Reduce average loss size by 30%",
        createdAt: new Date().toISOString(),
        completed: false,
        dismissed: false,
      },
      {
        id: "ci-2",
        category: "psychology",
        priority: "high",
        title: "Implement pre-trade checklist",
        description: "Your confidence scores are lowest on Mondays. Create and follow a pre-trade routine to improve consistency.",
        actionableSteps: [
          "Write 3 reasons for entering the trade",
          "State your max loss aloud before entering",
          "Take 3 deep breaths before clicking execute",
        ],
        expectedOutcome: "Improve Monday win rate from 35% to 50%+",
        createdAt: new Date().toISOString(),
        completed: false,
        dismissed: false,
      },
      {
        id: "ci-3",
        category: "technical-analysis",
        priority: "medium",
        title: "Wait for multi-timeframe confirmation",
        description: "Several of your losing trades lacked higher timeframe alignment. Always check 4H and Daily before entering on 15M.",
        actionableSteps: [
          "Add 4H and Daily charts to your workspace",
          "Only trade when 2+ timeframes align",
          "Log timeframe alignment in your journal",
        ],
        expectedOutcome: "Filter out 20-30% of poor-quality setups",
        createdAt: new Date().toISOString(),
        completed: false,
        dismissed: false,
      },
    ],
    insights: [
      {
        id: "ins-1",
        type: "pattern",
        title: "Overtrading on Mondays",
        description: "You take 2.5x more trades on Mondays compared to other days, with a significantly lower win rate of 35%.",
        dataPoints: 48,
        confidence: 82,
        severity: "warning",
        relatedMetrics: ["trades-per-day", "win-rate-by-day"],
      },
      {
        id: "ins-2",
        type: "behavior",
        title: "Revenge trading after losses",
        description: "After a losing trade, you are 3x more likely to take the next trade within 15 minutes, often with increased size.",
        dataPoints: 32,
        confidence: 88,
        severity: "critical",
        relatedMetrics: ["time-between-trades", "position-size-after-loss"],
      },
      {
        id: "ins-3",
        type: "improvement",
        title: "Strong performance on Asian session breakouts",
        description: "Your Tokyo session breakout strategy has a 68% win rate over the last month - your best performing setup.",
        dataPoints: 25,
        confidence: 75,
        severity: "info",
        relatedMetrics: ["session-performance", "strategy-win-rate"],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
  };

  return {
    plan,
    insights: plan.insights,
    topStrengths: [
      "Excellent patience in waiting for ideal setups",
      "Strong performance with trend-following strategies",
      "Good understanding of support and resistance levels",
      "Consistent journaling habit",
    ],
    topWeaknesses: [
      "Emotional trading after losses",
      "Inconsistent risk sizing",
      "Overtrading on low-quality setups",
      "Not using stop losses on all trades",
    ],
    recommendedFocus: ["risk-management", "psychology"],
    weeklyFocus: "Focus on executing your pre-trade checklist for every single trade this week. No exceptions.",
    metadata: {
      version: "1.0.0-mock",
      generatedAt: new Date().toISOString(),
      provider: "mock",
      tradeCount: 156,
    },
  };
};

export const generateMockTranscript = (): VoiceTranscript => {
  const segments: TranscriptSegment[] = [
    {
      id: 1,
      startTime: 0,
      endTime: 3.5,
      text: "I'm looking at the EURUSD four-hour chart right now.",
      confidence: 97,
      isFinal: true,
    },
    {
      id: 2,
      startTime: 3.8,
      endTime: 7.2,
      text: "Price has formed a clear ascending triangle pattern.",
      confidence: 95,
      isFinal: true,
    },
    {
      id: 3,
      startTime: 7.5,
      endTime: 11.0,
      text: "Support is holding around one point zero eight nine zero.",
      confidence: 92,
      isFinal: true,
    },
    {
      id: 4,
      startTime: 11.3,
      endTime: 15.0,
      text: "I'm waiting for a breakout above one point zero nine five zero to enter long.",
      confidence: 94,
      isFinal: true,
    },
    {
      id: 5,
      startTime: 15.2,
      endTime: 18.5,
      text: "Stop loss will go below the recent swing low at one point zero eight eight zero.",
      confidence: 96,
      isFinal: true,
    },
  ];

  const text = segments.map((s) => s.text).join(" ");
  const durationMs = segments[segments.length - 1].endTime * 1000;

  return {
    id: `transcript-${Date.now()}`,
    text,
    confidence: 95,
    language: "en-US",
    durationMs,
    segments,
    metadata: {
      engine: "mock-transcription-v1",
      processedAt: new Date().toISOString(),
      audioFormat: "audio/webm",
      sampleRate: 48000,
    },
  };
};
