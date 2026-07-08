/**
 * Feature Guards
 * Utility functions for checking feature access based on subscription tier.
 */

import type { SubscriptionTier, FeatureFlag } from "./types";
import { FEATURE_TIER_MAP } from "./types";
import { FEATURE_MATRIX } from "../ai/types";

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, elite: 2 };

/**
 * Check if a user's tier has access to a specific feature
 */
export function hasFeatureAccess(userTier: SubscriptionTier, feature: FeatureFlag): boolean {
  const requiredTier = FEATURE_TIER_MAP[feature];
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}

/**
 * Check if user has Pro or higher
 */
export function isPro(userTier: SubscriptionTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK.pro;
}

/**
 * Check if user has Elite
 */
export function isElite(userTier: SubscriptionTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK.elite;
}

/**
 * Get all features available to a tier
 */
export function getAvailableFeatures(tier: SubscriptionTier): FeatureFlag[] {
  const features = FEATURE_MATRIX[tier];
  return (Object.entries(features) as [FeatureFlag, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Get features NOT available to a tier
 */
export function getLockedFeatures(tier: SubscriptionTier): FeatureFlag[] {
  const allFeatures = Object.keys(FEATURE_TIER_MAP) as FeatureFlag[];
  return allFeatures.filter((f) => !hasFeatureAccess(tier, f));
}

/**
 * Get the upgrade tier required for a feature
 */
export function getRequiredTier(feature: FeatureFlag): SubscriptionTier {
  return FEATURE_TIER_MAP[feature];
}
