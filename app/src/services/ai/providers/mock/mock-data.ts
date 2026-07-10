/**
 * AI Mock Data Generators
 * Provides realistic mock data for AI analysis without hitting real APIs.
 * Used in development and testing environments.
 */

import type { CoachingResult, CoachingPlan } from "../../types/coaching";

// ─── Coaching Data ───

interface CoachingData {
  plans: CoachingPlan[];
  insights: Array<{
    title: string;
    description: string;
    category: string;
    severity: "info" | "warning" | "critical" | "positive";
  }>;
  goals: Array<{
    title: string;
    description: string;
    category: string;
    isAchieved: boolean;
    progress: number;
  }>;
  feedback: CoachingResult["feedback"];
}

export const mockCoachingData: CoachingData = {
  plans: [
    {
      focus: "Risk Management",
      summary: "Improve risk management practices to protect capital and ensure long-term profitability. Focus on position sizing and stop-loss discipline.",
      items: [
        {
          id: "cm-1",
          title: "Implement Fixed Fractional Sizing",
          description: "Risk only 1-2% of account balance per trade. Calculate position size based on stop-loss distance and account size.",
          category: "Risk Management",
          isCompleted: false,
          priority: "high",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "cm-2",
          title: "Set Hard Stop-Loss Rules",
          description: "Always set stop-loss before entering a trade. Never move stop-loss further away once set. Use ATR-based stops for volatility adjustment.",
          category: "Risk Management",
          isCompleted: false,
          priority: "high",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "cm-3",
          title: "Daily Risk Limit",
          description: "Set a daily loss limit of 3% of account. Stop trading for the day if this limit is reached.",
          category: "Risk Management",
          isCompleted: false,
          priority: "medium",
        },
      ],
      priority: "high",
      timeframe: "2 weeks",
      expectedOutcome: "Reduce maximum drawdown by 30% and improve risk-adjusted returns",
    },
    {
      focus: "Trade Psychology",
      summary: "Address emotional trading patterns that lead to impulsive decisions and revenge trading. Develop a structured pre-trade checklist.",
      items: [
        {
          id: "cp-1",
          title: "Pre-Trade Checklist",
          description: "Complete a 5-point checklist before every trade: trend alignment, key level confirmation, risk/reward ratio ≥ 1:2, position size within limits, and emotional state check.",
          category: "Psychology",
          isCompleted: false,
          priority: "high",
        },
        {
          id: "cp-2",
          title: "Trading Journal Review",
          description: "Review last 20 trades weekly. Identify patterns in losing trades and emotional triggers.",
          category: "Psychology",
          isCompleted: false,
          priority: "medium",
        },
        {
          id: "cp-3",
          title: "Meditation Practice",
          description: "Practice 10 minutes of mindfulness meditation before trading sessions to improve focus and emotional control.",
          category: "Psychology",
          isCompleted: false,
          priority: "low",
        },
      ],
      priority: "high",
      timeframe: "4 weeks",
      expectedOutcome: "Reduce impulsive trades by 50% and improve adherence to trading plan",
    },
    {
      focus: "Technical Analysis",
      summary: "Strengthen technical analysis skills by focusing on multi-timeframe analysis and confluence factors.",
      items: [
        {
          id: "ct-1",
          title: "Multi-Timeframe Analysis",
          description: "Check 3 timeframes before entering: Monthly/Weekly for trend, Daily for setup, 4H for entry. All must align.",
          category: "Technical",
          isCompleted: false,
          priority: "high",
        },
        {
          id: "ct-2",
          title: "Confluence Trading",
          description: "Require at least 2 confluence factors: support/resistance + price action, or trend + Fibonacci level.",
          category: "Technical",
          isCompleted: false,
          priority: "medium",
        },
      ],
      priority: "medium",
      timeframe: "3 weeks",
      expectedOutcome: "Increase win rate by 15% through better entry timing",
    },
  ],

  insights: [
    {
      title: "Revenge Trading Pattern Detected",
      description: "You've taken 4 trades within 30 minutes after a loss, all resulting in additional losses. This suggests revenge trading behavior.",
      category: "Psychology",
      severity: "critical",
    },
    {
      title: "Inconsistent Risk/Reward Ratios",
      description: "Your R:R ratios range from 0.5:1 to 3:1. Only 30% of trades meet the minimum 1:2 threshold. Focus on higher-probability setups.",
      category: "Risk Management",
      severity: "warning",
    },
    {
      title: "Strong Performance on Trending Days",
      description: "Your win rate increases to 72% when trading in the direction of the daily trend. Consider trend-biased strategies.",
      category: "Performance",
      severity: "positive",
    },
    {
      title: "Overtrading During Low Volatility",
      description: "You're taking 40% more trades during Asian session with 25% lower win rate. Consider reducing trade frequency during low-vol periods.",
      category: "Performance",
      severity: "warning",
    },
    {
      title: "Excellent Journaling Habit",
      description: "You've maintained detailed trade notes for 95% of trades. This discipline correlates with your 15% better performance on journaled trades.",
      category: "Habits",
      severity: "positive",
    },
  ],

  goals: [
    {
      title: "Achieve 55% Win Rate",
      description: "Increase overall win rate from current 48% to 55% through better setup selection",
      category: "Performance",
      isAchieved: false,
      progress: 65,
    },
    {
      title: "Maintain Risk per Trade ≤ 2%",
      description: "Ensure no single trade risks more than 2% of account balance",
      category: "Risk Management",
      isAchieved: false,
      progress: 80,
    },
    {
      title: "Complete 30-Day Trading Plan",
      description: "Follow the structured trading plan without deviations for 30 consecutive days",
      category: "Discipline",
      isAchieved: false,
      progress: 40,
    },
    {
      title: "Reduce Average Holding Time",
      description: "Reduce average trade duration from 6 hours to under 4 hours by taking profits at target levels",
      category: "Execution",
      isAchieved: false,
      progress: 25,
    },
  ],

  feedback: {
    strengths: [
      "Strong technical analysis foundation with good chart pattern recognition",
      "Excellent record-keeping and trade journaling habits",
      "Willingness to learn and adapt strategies based on market conditions",
      "Good understanding of fundamental drivers for major pairs",
      "Consistent pre-market analysis routine",
    ],
    weaknesses: [
      "Emotional control during losing streaks needs improvement",
      "Position sizing occasionally exceeds risk parameters",
      "Tendency to overtrade during low-volatility periods",
      "Sometimes moving stop-losses further away instead of honoring original stops",
      "Inconsistent take-profit discipline - exiting early on winning trades",
    ],
    opportunities: [
      "Focus on high-probability trend-following setups for better R:R",
      "Implement automated position sizing calculator",
      "Develop a structured post-loss protocol to prevent revenge trading",
      "Consider journaling emotional state alongside trade data",
      "Explore session-specific strategies (London vs NY volatility)",
    ],
    threats: [
      "Revenge trading pattern could lead to significant drawdown",
      "Overtrading during consolidation periods erodes profits",
      "Emotional decision-making during high-impact news events",
      "Inconsistent risk management undermines long-term profitability",
      "Burnout risk from monitoring charts excessively",
    ],
    overallRating: 6.5,
    overallComment:
      "You demonstrate solid technical skills and strong journaling discipline, but emotional control and risk management consistency are holding back your performance. Focus on the 2-week risk management plan first, then address psychological factors. Your foundation is strong - with disciplined execution, you can achieve your 55% win rate goal.",
  },
};

// ─── Chart Analysis Mock Data ───

export interface MockChartPattern {
  pattern: string;
  confidence: number;
  direction: "bullish" | "bearish" | "neutral";
  description: string;
}

export const mockChartPatterns: MockChartPattern[] = [
  {
    pattern: "Ascending Triangle",
    confidence: 82,
    direction: "bullish",
    description: "Price consolidating between horizontal resistance and rising support. Breakout likely above resistance.",
  },
  {
    pattern: "Double Bottom",
    confidence: 75,
    direction: "bullish",
    description: "W-shaped pattern forming at support level. Potential trend reversal signal.",
  },
  {
    pattern: "Head and Shoulders",
    confidence: 68,
    direction: "bearish",
    description: "Classic reversal pattern with three peaks. Neckline break would confirm bearish move.",
  },
  {
    pattern: "Bull Flag",
    confidence: 71,
    direction: "bullish",
    description: "Sharp upward move followed by downward channel consolidation. Continuation pattern.",
  },
  {
    pattern: "Bear Flag",
    confidence: 64,
    direction: "bearish",
    description: "Sharp decline followed by upward channel consolidation. Likely continuation lower.",
  },
  {
    pattern: "Symmetrical Triangle",
    confidence: 58,
    direction: "neutral",
    description: "Converging trendlines indicating indecision. Await breakout for directional bias.",
  },
];

export const mockSupportResistance = [
  { level: 1.085, type: "support" as const, strength: 85, touches: 4 },
  { level: 1.092, type: "resistance" as const, strength: 72, touches: 3 },
  { level: 1.078, type: "support" as const, strength: 65, touches: 2 },
  { level: 1.098, type: "resistance" as const, strength: 58, touches: 2 },
];

// ─── Trade Analysis Mock Data ───

export function generateMockTradeSummary(): string {
  const summaries = [
    "This trade demonstrates good technical setup with clear entry at a key support level. The risk-reward ratio of 1:2.5 is favorable. However, consider waiting for additional confirmation such as a bullish candlestick pattern before entry.",
    "Strong trend-following trade with multiple confluence factors. Entry aligns with the 200 EMA and a Fibonacci 61.8% retracement. The position size is appropriate for the account risk parameters.",
    "Counter-trend trade that requires extra caution. While the entry at resistance is technically valid, ensure you have a tight stop-loss and consider reducing position size given the overall trend direction.",
    "Breakout trade with good momentum confirmation. Volume analysis supports the move. Take profit targets are well-placed at the next resistance zone. Trail your stop to lock in profits.",
    "Range-bound market conditions make this trade riskier. The entry is at the range mid-point which is less ideal. Consider waiting for a test of range support or resistance for better risk-reward.",
  ];
  return summaries[Math.floor(Math.random() * summaries.length)];
}

export function generateMockTradeScore(): {
  entry: number;
  exit: number;
  riskManagement: number;
  psychology: number;
  overall: number;
} {
  const entry = Math.floor(Math.random() * 30) + 65; // 65-95
  const exit = Math.floor(Math.random() * 35) + 60;  // 60-95
  const riskManagement = Math.floor(Math.random() * 25) + 70; // 70-95
  const psychology = Math.floor(Math.random() * 40) + 55; // 55-95
  const overall = Math.round((entry + exit + riskManagement + psychology) / 4);

  return { entry, exit, riskManagement, psychology, overall };
}

export function generateMockConfidenceScore(): number {
  return Math.floor(Math.random() * 30) + 65; // 65-95
}

export function generateMockRiskAnalysis(): {
  riskRewardRatio: number;
  riskPercent: number;
  potentialProfit: number;
  potentialLoss: number;
  maxConsecutiveLosses: number;
  recommendation: string;
} {
  const riskReward = [1.5, 2.0, 2.5, 3.0, 1.8, 2.2][Math.floor(Math.random() * 6)];
  const riskPct = [0.5, 1.0, 1.5, 2.0][Math.floor(Math.random() * 4)];

  return {
    riskRewardRatio: riskReward,
    riskPercent: riskPct,
    potentialProfit: Math.round(riskReward * riskPct * 100) / 100,
    potentialLoss: riskPct,
    maxConsecutiveLosses: Math.floor(Math.random() * 4) + 2,
    recommendation:
      riskReward >= 2.0
        ? "Favorable risk-reward ratio. Maintain current approach."
        : riskReward >= 1.5
        ? "Acceptable risk-reward. Consider targeting further for better R:R."
        : "Risk-reward ratio below recommended 1:2 minimum. Reconsider entry or target levels.",
  };
}

export function generateMockTradeSuggestions(): string[] {
  const allSuggestions = [
    "Consider waiting for a pullback to the 38.2% or 50% Fibonacci level for better entry",
    "Add RSI divergence confirmation before entering counter-trend trades",
    "Use the 20 EMA as a dynamic trailing stop on trending days",
    "Reduce position size by 50% during high-impact news events",
    "Set multiple take-profit targets to capture partial gains",
    "Wait for daily candle close above resistance for breakout confirmation",
    "Consider correlation with DXY before entering USD pairs",
    "Use ATR-based stops instead of fixed pip stops for volatility adjustment",
    "Review the economic calendar for scheduled news before holding overnight",
    "Scale into winning positions rather than adding to losing ones",
    "Set a maximum of 3 trades per day to prevent overtrading",
    "Use the London-NY overlap for best liquidity on major pairs",
    "Consider session-specific volatility when setting take-profit distances",
    "Implement a 'no-trade' rule when VIX is above 30",
    "Journal the emotional state before each trade for pattern recognition",
  ];

  // Return 3-5 random suggestions
  const count = Math.floor(Math.random() * 3) + 3;
  const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Utility Functions ───

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateMockTimestamp(): string {
  return new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString();
}
