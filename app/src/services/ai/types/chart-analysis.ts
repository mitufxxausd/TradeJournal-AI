/**
 * Chart Analysis Types
 */

export type ChartPatternType =
  | "head-and-shoulders"
  | "inverse-head-and-shoulders"
  | "double-top"
  | "double-bottom"
  | "triple-top"
  | "triple-bottom"
  | "ascending-triangle"
  | "descending-triangle"
  | "symmetrical-triangle"
  | "flag"
  | "pennant"
  | "wedge"
  | "channel"
  | "cup-and-handle"
  | "rounding-bottom"
  | "diamond"
  | "broadening-formation";

export type PatternDirection = "bullish" | "bearish" | "neutral";

export type IndicatorType =
  | "sma"
  | "ema"
  | "rsi"
  | "macd"
  | "bollinger-bands"
  | "atr"
  | "volume"
  | "fibonacci"
  | "pivot-points"
  | "ichimoku"
  | "stochastic"
  | "adx";

export interface ChartPattern {
  id: string;
  type: ChartPatternType;
  name: string;
  direction: PatternDirection;
  confidence: number;
  startPrice: number;
  endPrice: number;
  startTime: string;
  endTime: string;
  description: string;
  significance: "high" | "medium" | "low";
  completionPercent: number;
  measuredTarget?: number;
  invalidationLevel?: number;
}

export interface Indicator {
  type: IndicatorType;
  name: string;
  value: number;
  signal: "bullish" | "bearish" | "neutral" | "overbought" | "oversold";
  interpretation: string;
  period?: string;
}

export interface SupportResistance {
  id: string;
  level: number;
  type: "support" | "resistance" | "pivot";
  strength: "strong" | "moderate" | "weak";
  touches: number;
  timeframe: string;
  isActive: boolean;
}

export interface OrderBlock {
  id: string;
  top: number;
  bottom: number;
  type: "bullish" | "bearish";
  timeframe: string;
  strength: "strong" | "moderate" | "weak";
  mitigationLevel: number;
  isMitigated: boolean;
}

export interface FairValueGap {
  id: string;
  top: number;
  bottom: number;
  type: "bullish" | "bearish";
  timeframe: string;
  status: "unfilled" | "partially-filled" | "filled";
  fillPercent: number;
}

export interface LiquidityZone {
  id: string;
  price: number;
  type: "sell-side" | "buy-side";
  strength: "high" | "medium" | "low";
  timeframe: string;
  swept: boolean;
}

export interface ChartAnalysisRequest {
  imageUrl: string;
  symbol?: string;
  timeframe?: string;
  analysisTypes?: ("patterns" | "indicators" | "levels" | "order-blocks" | "fvgs" | "liquidity")[];
}

export interface ChartAnalysisResult {
  patterns: ChartPattern[];
  indicators: Indicator[];
  supportResistance: SupportResistance[];
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquidityZones: LiquidityZone[];
  summary: string;
  overallBias: "bullish" | "bearish" | "neutral";
  confidence: number;
  keyLevels: number[];
  metadata: {
    analysisVersion: string;
    analyzedAt: string;
    provider: string;
  };
}
