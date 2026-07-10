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

/**
 * Feature availability matrix per subscription tier.
 * Defines which features are enabled (true) or disabled (false) for each tier.
 */
export const FEATURE_MATRIX: Record<SubscriptionTier, Record<FeatureFlag, boolean>> = {
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
