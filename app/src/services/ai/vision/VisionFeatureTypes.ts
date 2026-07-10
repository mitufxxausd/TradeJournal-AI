/**
 * Vision Feature Types
 * Detailed type definitions for all visual features that can be detected
 * by AI Vision providers in trading chart screenshots.
 *
 * These types support:
 * - Chart pattern detection (triangles, head & shoulders, etc.)
 * - Support/Resistance level identification
 * - Trend analysis and market structure
 * - Candlestick pattern recognition
 * - Indicator visualization interpretation
 * - Trade annotation detection (entry, SL, TP labels)
 */

// ─── Feature Confidence ───

export interface VisionFeatureConfidence {
  /** Confidence score 0-1 */
  score: number;
  /** Human-readable confidence level */
  level: "high" | "medium" | "low";
  /** Number of confirming factors */
  confirmingFactors: number;
  /** Notes about the confidence assessment */
  notes?: string;
}

// ─── Detected Region ───

export interface DetectedRegion {
  /** Normalized coordinates (0-1) of the detected feature */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Region area as percentage of image */
  areaPercent: number;
}

// ─── Chart Pattern Detection ───

export type ChartPatternType =
  | "ascending_triangle"
  | "descending_triangle"
  | "symmetrical_triangle"
  | "rising_wedge"
  | "falling_wedge"
  | "head_and_shoulders"
  | "inverse_head_and_shoulders"
  | "double_top"
  | "double_bottom"
  | "triple_top"
  | "triple_bottom"
  | "bull_flag"
  | "bear_flag"
  | "bull_pennant"
  | "bear_pennant"
  | "cup_and_handle"
  | "rounding_bottom"
  | "channel_up"
  | "channel_down"
  | "horizontal_range"
  | "diamond_top"
  | "diamond_bottom"
  | "measured_move";

export type PatternDirection = "bullish" | "bearish" | "neutral";
export type PatternCompletion = "forming" | "confirmed" | "breaking_out" | "failed";

export interface DetectedChartPattern {
  /** Unique identifier */
  id: string;
  /** Pattern classification */
  type: ChartPatternType;
  /** Human-readable name */
  name: string;
  /** Directional bias of the pattern */
  direction: PatternDirection;
  /** Current completion status */
  completion: PatternCompletion;
  /** Detection confidence */
  confidence: VisionFeatureConfidence;
  /** Image region where pattern was detected */
  region: DetectedRegion;
  /** Price at pattern start */
  startPrice: number;
  /** Price at pattern end/current */
  endPrice: number;
  /** Price target if pattern completes */
  priceTarget?: number;
  /** Measured move target */
  measuredMoveTarget?: number;
  /** Pattern description */
  description: string;
  /** Significance assessment */
  significance: "high" | "medium" | "low";
  /** Timeframe the pattern appears on */
  timeframe?: string;
  /** Number of touches on key levels */
  touches?: number;
  /** Volume profile during pattern formation */
  volumeProfile?: "increasing" | "decreasing" | "neutral";
}

// ─── Support & Resistance Levels ───

export type LevelType = "support" | "resistance" | "pivot" | "supply" | "demand" | "order_block" | "fair_value_gap";
export type LevelStrength = "strong" | "moderate" | "weak";

export interface DetectedLevel {
  /** Unique identifier */
  id: string;
  /** Price level */
  price: number;
  /** Type of level */
  type: LevelType;
  /** Strength based on touches and recency */
  strength: LevelStrength;
  /** Number of confirmed touches */
  touches: number;
  /** Detection confidence */
  confidence: VisionFeatureConfidence;
  /** Image region */
  region: DetectedRegion;
  /** Description of the level */
  description: string;
  /** Whether this level is currently being tested */
  isBeingTested: boolean;
  /** Timeframe where level is most significant */
  timeframe?: string;
  /** Age of the level (how long it has held) */
  age?: string;
  /** Confluence with other levels */
  confluenceFactors?: string[];
}

// ─── Trend Analysis ───

export type TrendDirection = "uptrend" | "downtrend" | "sideways" | "choppy";
export type TrendStrength = "strong" | "moderate" | "weak";

export interface TrendAnalysis {
  /** Primary trend direction */
  direction: TrendDirection;
  /** Trend strength assessment */
  strength: TrendStrength;
  /** Confidence in trend assessment */
  confidence: VisionFeatureConfidence;
  /** Higher highs in uptrend */
  higherHighs: boolean;
  /** Higher lows in uptrend */
  higherLows: boolean;
  /** Lower highs in downtrend */
  lowerHighs: boolean;
  /** Lower lows in downtrend */
  lowerLows: boolean;
  /** Market structure shift detected */
  structureShift: boolean;
  /** Break of structure detected */
  breakOfStructure: boolean;
  /** Change of character detected */
  changeOfCharacter: boolean;
  /** Description of trend analysis */
  description: string;
  /** Higher timeframe trend alignment */
  higherTimeframeTrend?: TrendDirection;
  /** Trend duration estimate */
  estimatedDuration?: string;
}

// ─── Candlestick Pattern Recognition ───

export type CandlestickPatternType =
  | "doji"
  | "hammer"
  | "inverted_hammer"
  | "shooting_star"
  | "hanging_man"
  | "engulfing_bullish"
  | "engulfing_bearish"
  | "morning_star"
  | "evening_star"
  | "three_white_soldiers"
  | "three_black_crows"
  | "harami_bullish"
  | "harami_bearish"
  | "piercing_line"
  | "dark_cloud_cover"
  | "marubozu_bullish"
  | "marubozu_bearish"
  | "spinning_top"
  | "tweezer_top"
  | "tweezer_bottom"
  | "inside_bar"
  | "outside_bar";

export interface DetectedCandlestickPattern {
  /** Unique identifier */
  id: string;
  /** Pattern type */
  type: CandlestickPatternType;
  /** Human-readable name */
  name: string;
  /** Bullish/bearish/neutral signal */
  signal: "bullish" | "bearish" | "neutral";
  /** Detection confidence */
  confidence: VisionFeatureConfidence;
  /** Image region */
  region: DetectedRegion;
  /** Price where pattern formed */
  price: number;
  /** Description of the pattern */
  description: string;
  /** Reliability rating based on historical performance */
  reliability: "high" | "medium" | "low";
  /** Context (at support, resistance, etc.) */
  context?: string;
  /** Confirms or contradicts current trend */
  trendAlignment: "with_trend" | "against_trend" | "neutral";
}

// ─── Indicator Visualization ───

export type IndicatorType = "ema" | "sma" | "rsi" | "macd" | "bollinger" | "volume" | "atr" | "fibonacci" | "ichimoku" | "vwap";
export type IndicatorSignal = "bullish" | "bearish" | "neutral" | "overbought" | "oversold";

export interface DetectedIndicator {
  /** Unique identifier */
  id: string;
  /** Indicator type */
  type: IndicatorType;
  /** Human-readable name (e.g., "EMA 200") */
  name: string;
  /** Current value if readable */
  value?: number;
  /** Signal derived from indicator */
  signal: IndicatorSignal;
  /** Detection confidence */
  confidence: VisionFeatureConfidence;
  /** Image region */
  region: DetectedRegion;
  /** Description of indicator state */
  description: string;
  /** Period/setting if visible */
  period?: string;
  /** Interpretation for traders */
  interpretation: string;
}

// ─── Trade Annotation Detection ───

export type AnnotationType = "entry" | "stop_loss" | "take_profit" | "limit_order" | "comment" | "trend_line" | "horizontal_line" | "rectangle" | "fibonacci_retracement";

export interface DetectedTradeAnnotation {
  /** Unique identifier */
  id: string;
  /** Type of annotation */
  type: AnnotationType;
  /** Detected text label */
  label?: string;
  /** Associated price level */
  price?: number;
  /** Detection confidence */
  confidence: VisionFeatureConfidence;
  /** Image region */
  region: DetectedRegion;
  /** Description */
  description: string;
  /** Whether this annotation appears to be hand-drawn or automatic */
  isHandDrawn: boolean;
  /** Color of the annotation if visible */
  color?: string;
}

// ─── Volume Analysis ───

export interface VolumeAnalysis {
  /** Overall volume trend */
  trend: "increasing" | "decreasing" | "neutral";
  /** Volume at key moments */
  volumeAtKeyLevels: Array<{
    price: number;
    volumeRelative: "high" | "average" | "low";
    significance: string;
  }>;
  /** Volume confidence */
  confidence: VisionFeatureConfidence;
  /** Description */
  description: string;
}

// ─── Timeframe Detection ───

export interface TimeframeDetection {
  /** Detected timeframe */
  timeframe: string;
  /** Confidence in detection */
  confidence: VisionFeatureConfidence;
  /** Whether multiple timeframes are visible */
  multipleTimeframes: boolean;
  /** Additional detected timeframes */
  additionalTimeframes?: string[];
}

// ─── Broker/Platform Detection ───

export interface PlatformDetection {
  /** Detected platform name */
  platform: string;
  /** Confidence */
  confidence: VisionFeatureConfidence;
  /** Version if visible */
  version?: string;
  /** Theme detected */
  theme?: "light" | "dark";
  /** Known platform signatures */
  detectedFeatures: string[];
}
