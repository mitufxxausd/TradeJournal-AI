/**
 * AI Analysis Types for TradeJournal AI
 * Core type definitions for all AI-powered features
 */

import type { Screenshot } from "@/types";

// ─── OCR / Structured Data Extraction ───

export interface ExtractedTradeData {
  pair?: string;
  timeframe?: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  positionSize?: number;
  riskPercent?: number;
  rrRatio?: number;
  tradeDate?: string;
  entryTime?: string;
  exitTime?: string;
  broker?: string;
  account?: string;
  direction?: "buy" | "sell";
  market?: string;
  confidence: number; // 0-1
}

// ─── Chart Pattern / Technical Analysis ───

export type PatternType =
  | "trend_up"
  | "trend_down"
  | "range"
  | "support"
  | "resistance"
  | "liquidity_sweep"
  | "breakout"
  | "retest"
  | "choch"
  | "bos"
  | "fair_value_gap"
  | "order_block"
  | "supply_zone"
  | "demand_zone"
  | "premium"
  | "discount"
  | "double_top"
  | "double_bottom"
  | "head_and_shoulders"
  | "inverse_head_and_shoulders"
  | "triangle_ascending"
  | "triangle_descending"
  | "triangle_symmetrical"
  | "wedge_rising"
  | "wedge_falling"
  | "flag_bullish"
  | "flag_bearish"
  | "channel_ascending"
  | "channel_descending"
  | "engulfing_bullish"
  | "engulfing_bearish"
  | "doji"
  | "hammer"
  | "shooting_star"
  | "morning_star"
  | "evening_star";

export type IndicatorType =
  | "ema"
  | "rsi"
  | "macd"
  | "vwap"
  | "atr"
  | "volume"
  | "bollinger_bands"
  | "fibonacci"
  | "pivot_points";

export interface DetectedPattern {
  type: PatternType;
  label: string;
  confidence: number; // 0-1
  description: string;
  location?: string; // e.g. "upper resistance zone"
}

export interface DetectedIndicator {
  type: IndicatorType;
  label: string;
  value?: string;
  signal?: "bullish" | "bearish" | "neutral";
  confidence: number;
}

export interface MarketStructure {
  trend: "bullish" | "bearish" | "sideways";
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  structureShift: boolean;
  keyLevels: KeyLevel[];
}

export interface KeyLevel {
  price: number;
  type: "support" | "resistance" | "supply" | "demand" | "poc" | "vwap";
  strength: number; // 1-10
  description: string;
}

export interface ChartAnalysis {
  patterns: DetectedPattern[];
  indicators: DetectedIndicator[];
  marketStructure: MarketStructure;
  keyLevels: KeyLevel[];
  session?: string;
  timeframe?: string;
  overallBias: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-1
  summary: string;
}

// ─── Screenshot Analysis Result ───

export interface ScreenshotAnalysis {
  extractedData: ExtractedTradeData | null;
  chartAnalysis: ChartAnalysis | null;
  source: "tradingview" | "mt4" | "mt5" | "ctrader" | "dxtrade" | "broker" | "unknown";
  processingTimeMs: number;
  provider: string;
}

// ─── AI Trade Summary ───

export interface TradeSummary {
  summary: string;
  entryReason: string;
  exitReason: string;
  riskAssessment: string;
  mistakes: string[];
  strengths: string[];
  weaknesses: string[];
  tradeQualityScore: number; // 0-100
  confidenceScore: number; // 0-100
  provider: string;
  generatedAt: string;
}

// ─── AI Coaching ───

export type CoachingType =
  | "risk_management"
  | "timing"
  | "exit_strategy"
  | "confirmation"
  | "discipline"
  | "emotional"
  | "revenge_trading"
  | "overtrading"
  | "patience"
  | "positive";

export interface CoachingItem {
  id: string;
  type: CoachingType;
  severity: "info" | "warning" | "critical" | "positive";
  title: string;
  message: string;
  actionable: string; // actionable advice
  relatedField?: string; // e.g. "riskPercent", "entryPrice"
}

export interface AICoaching {
  overallFeedback: string;
  items: CoachingItem[];
  disciplineScore: number; // 0-100
  emotionalScore: number; // 0-100
  riskScore: number; // 0-100
  provider: string;
  generatedAt: string;
}

// ─── Complete AI Trade Analysis ───

export interface AIAnalysisResult {
  screenshots: ScreenshotAnalysis[];
  tradeSummary: TradeSummary | null;
  coaching: AICoaching | null;
  overallScore: number; // 0-100
  hasAIData: boolean;
  provider: string;
  generatedAt: string;
  processingStatus: "idle" | "processing" | "completed" | "error";
  error?: string;
}

// ─── Voice Note ───

export interface VoiceNote {
  id: string;
  name: string;
  url: string;
  duration: number; // seconds
  createdAt: string;
  transcribedText?: string;
  transcriptionStatus: "pending" | "processing" | "completed" | "error";
}

// ─── Feature Tiers ───

export type SubscriptionTier = "free" | "pro" | "elite";

export interface FeatureAccess {
  tier: SubscriptionTier;
  features: {
    manualJournal: boolean;
    voiceNotes: boolean;
    ocr: boolean;
    aiScreenshotAnalysis: boolean;
    aiCoaching: boolean;
    aiTradeScore: boolean;
    futureAiFeatures: boolean;
  };
}

export const FEATURE_MATRIX: Record<SubscriptionTier, FeatureAccess["features"]> = {
  free: {
    manualJournal: true,
    voiceNotes: false,
    ocr: false,
    aiScreenshotAnalysis: false,
    aiCoaching: false,
    aiTradeScore: false,
    futureAiFeatures: false,
  },
  pro: {
    manualJournal: true,
    voiceNotes: true,
    ocr: true,
    aiScreenshotAnalysis: true,
    aiCoaching: false,
    aiTradeScore: false,
    futureAiFeatures: false,
  },
  elite: {
    manualJournal: true,
    voiceNotes: true,
    ocr: true,
    aiScreenshotAnalysis: true,
    aiCoaching: true,
    aiTradeScore: true,
    futureAiFeatures: true,
  },
};
