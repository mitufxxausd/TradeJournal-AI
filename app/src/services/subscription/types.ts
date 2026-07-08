/**
 * Subscription Types
 */

import type { SubscriptionTier } from "../ai/types";

export { type SubscriptionTier };

export interface UserSubscription {
  tier: SubscriptionTier;
  expiresAt?: string;
  startedAt: string;
  isActive: boolean;
}

export const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: "free",
  startedAt: new Date().toISOString(),
  isActive: true,
};

export type FeatureFlag =
  | "manualJournal"
  | "voiceNotes"
  | "ocr"
  | "aiScreenshotAnalysis"
  | "aiCoaching"
  | "aiTradeScore"
  | "futureAiFeatures";

export const FEATURE_TIER_MAP: Record<FeatureFlag, SubscriptionTier> = {
  manualJournal: "free",
  voiceNotes: "pro",
  ocr: "pro",
  aiScreenshotAnalysis: "pro",
  aiCoaching: "elite",
  aiTradeScore: "elite",
  futureAiFeatures: "elite",
};
