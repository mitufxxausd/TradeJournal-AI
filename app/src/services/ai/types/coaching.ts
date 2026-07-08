import type { Trade } from "@/types";

/**
 * AI Coaching Types
 */

export type CoachingCategory =
  | "risk-management"
  | "psychology"
  | "technical-analysis"
  | "strategy"
  | "discipline"
  | "journaling"
  | "review"
  | "goal-setting";

export type CoachingPriority = "critical" | "high" | "medium" | "low";

export interface CoachingItem {
  id: string;
  category: CoachingCategory;
  priority: CoachingPriority;
  title: string;
  description: string;
  actionableSteps: string[];
  relatedTrades?: string[];
  expectedOutcome: string;
  createdAt: string;
  expiresAt?: string;
  completed: boolean;
  dismissed: boolean;
}

export interface CoachingInsight {
  id: string;
  type: "pattern" | "behavior" | "trend" | "warning" | "improvement";
  title: string;
  description: string;
  dataPoints: number;
  confidence: number;
  severity: "info" | "warning" | "critical";
  relatedMetrics?: string[];
}

export interface CoachingPlan {
  id: string;
  title: string;
  description: string;
  goals: CoachingGoal[];
  items: CoachingItem[];
  insights: CoachingInsight[];
  createdAt: string;
  updatedAt: string;
  status: "active" | "completed" | "archived";
}

export interface CoachingGoal {
  id: string;
  title: string;
  target: string;
  deadline?: string;
  progress: number;
  status: "in-progress" | "completed" | "overdue";
}

export interface CoachingRequest {
  trades: Trade[];
  period?: { from: string; to: string };
  focusAreas?: CoachingCategory[];
  userGoals?: string[];
}

export interface CoachingResult {
  plan: CoachingPlan;
  insights: CoachingInsight[];
  topStrengths: string[];
  topWeaknesses: string[];
  recommendedFocus: CoachingCategory[];
  weeklyFocus?: string;
  metadata: {
    version: string;
    generatedAt: string;
    provider: string;
    tradeCount: number;
  };
}

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: string;
  context?: {
    tradeId?: string;
    category?: CoachingCategory;
  };
}

export interface CoachingSession {
  id: string;
  messages: CoachMessage[];
  createdAt: string;
  updatedAt: string;
  context?: {
    tradeId?: string;
    focusArea?: CoachingCategory;
  };
}
