import type { Trade } from "@/types";

/**
 * Trade Analysis Types
 */

export interface TradeAnalysisRequest {
  trade: Trade;
  includePatterns?: boolean;
  includeScore?: boolean;
  includeRiskAnalysis?: boolean;
  includeSuggestions?: boolean;
}

export interface TradeScore {
  overall: number;
  entryQuality: number;
  exitQuality: number;
  riskManagement: number;
  psychology: number;
  setupQuality: number;
  maxScore: number;
}

export interface ConfidenceScore {
  level: "high" | "medium" | "low";
  score: number;
  reasoning: string;
}

export interface RiskAnalysis {
  riskRewardRatio: number;
  riskPercent: number;
  positionSizing: "optimal" | "too-large" | "too-small";
  stopLossQuality: "good" | "too-tight" | "too-wide" | "missing";
  takeProfitQuality: "good" | "too-conservative" | "too-aggressive" | "missing";
  maxDrawdownRisk: "low" | "medium" | "high";
  suggestions: string[];
}

export interface TradeSuggestion {
  category: "entry" | "exit" | "risk" | "psychology" | "setup";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionable: boolean;
}

export interface TradeSummary {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  keyTakeaways: string[];
  verdict: "excellent" | "good" | "average" | "poor" | "needs-improvement";
}

export interface TradeAnalysisResult {
  summary: TradeSummary;
  score: TradeScore;
  confidence: ConfidenceScore;
  riskAnalysis: RiskAnalysis;
  suggestions: TradeSuggestion[];
  metadata: {
    analysisVersion: string;
    analyzedAt: string;
    provider: string;
  };
}
