/**
 * useSubscription Hook
 * Provides subscription state and feature access helpers.
 * Currently returns mock subscription data. Replace with real backend integration.
 */

import { useState, useCallback } from "react";
import type { SubscriptionTier, UserSubscription, FeatureFlag } from "@/services/subscription/types";
import { DEFAULT_SUBSCRIPTION } from "@/services/subscription/types";
import {
  hasFeatureAccess,
  isPro as checkIsPro,
  isElite as checkIsElite,
  getRequiredTier,
} from "@/services/subscription/featureGuards";

interface UseSubscriptionReturn {
  subscription: UserSubscription;
  tier: SubscriptionTier;
  hasAccess: (feature: FeatureFlag) => boolean;
  isPro: boolean;
  isElite: boolean;
  upgradeMessage: (feature: FeatureFlag) => string;
  setTier: (tier: SubscriptionTier) => void;
  refresh: () => Promise<void>;
}

// In-memory store for the session
let globalTier: SubscriptionTier = "elite"; // Default to elite for development/demo

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription>({
    ...DEFAULT_SUBSCRIPTION,
    tier: globalTier,
  });

  const hasAccess = useCallback(
    (feature: FeatureFlag) => hasFeatureAccess(subscription.tier, feature),
    [subscription.tier]
  );

  const setTier = useCallback((tier: SubscriptionTier) => {
    globalTier = tier;
    setSubscription((prev) => ({ ...prev, tier }));
  }, []);

  const refresh = useCallback(async () => {
    // TODO: Fetch real subscription from backend
    // const response = await fetch('/api/subscription');
    // const data = await response.json();
    // setSubscription(data);
    setSubscription((prev) => ({ ...prev, tier: globalTier }));
  }, []);

  const upgradeMessage = useCallback(
    (feature: FeatureFlag) => {
      const required = getRequiredTier(feature);
      return `Upgrade to ${required.charAt(0).toUpperCase() + required.slice(1)} to access this feature.`;
    },
    []
  );

  return {
    subscription,
    tier: subscription.tier,
    hasAccess,
    isPro: checkIsPro(subscription.tier),
    isElite: checkIsElite(subscription.tier),
    upgradeMessage,
    setTier,
    refresh,
  };
}
