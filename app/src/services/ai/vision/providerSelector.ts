/**
 * Vision Provider Selector
 * Manages provider selection with availability status.
 *
 * Providers:
 *  - Mock Vision (available)
 *  - OpenAI Vision (coming soon)
 *  - Gemini Vision (coming soon)
 *  - Claude Vision (coming soon)
 *  - OpenRouter Vision (coming soon)
 *  - Local Vision (coming soon)
 *
 * Unavailable providers display "Coming Soon" status.
 */

import type { VisionProvider, VisionProviderConfig, VisionProviderCapabilities } from "./VisionProvider";
import type { VisionFeatureFlags } from "./VisionAnalysisResult";
import { DEFAULT_VISION_FEATURE_FLAGS } from "./VisionAnalysisResult";

// ─── Provider Availability Status ───

export type ProviderAvailabilityStatus = "available" | "coming_soon" | "beta" | "unavailable";

export interface ProviderOption {
  id: string;
  name: string;
  description: string;
  status: ProviderAvailabilityStatus;
  providerId: string;
  features: VisionFeatureFlags;
  requiresApiKey: boolean;
  isLocal: boolean;
  estimatedLatencyMs: number;
  logo?: string;
  documentationUrl?: string;
}

// ─── Provider Options ───

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: "mock-vision",
    name: "Mock Vision",
    description: "Development/testing provider with simulated analysis results. Always available, no API key needed.",
    status: "available",
    providerId: "mock-vision",
    features: { ...DEFAULT_VISION_FEATURE_FLAGS },
    requiresApiKey: false,
    isLocal: true,
    estimatedLatencyMs: 1000,
  },
  {
    id: "openai",
    name: "OpenAI Vision",
    description: "GPT-4o and GPT-4V vision models for advanced chart analysis. Requires API key.",
    status: "coming_soon",
    providerId: "openai",
    features: {
      ...DEFAULT_VISION_FEATURE_FLAGS,
      volume: false,
    },
    requiresApiKey: true,
    isLocal: false,
    estimatedLatencyMs: 3000,
    documentationUrl: "https://platform.openai.com/docs/guides/vision",
  },
  {
    id: "gemini",
    name: "Google Gemini Vision",
    description: "Gemini Pro Vision for comprehensive chart and trade data extraction. Requires API key.",
    status: "coming_soon",
    providerId: "gemini",
    features: { ...DEFAULT_VISION_FEATURE_FLAGS },
    requiresApiKey: true,
    isLocal: false,
    estimatedLatencyMs: 2500,
    documentationUrl: "https://ai.google.dev/gemini-api/docs/vision",
  },
  {
    id: "claude",
    name: "Anthropic Claude Vision",
    description: "Claude 3 Opus/Sonnet for detailed chart pattern recognition. Requires API key.",
    status: "coming_soon",
    providerId: "claude",
    features: {
      ...DEFAULT_VISION_FEATURE_FLAGS,
      volume: false,
      platform: false,
    },
    requiresApiKey: true,
    isLocal: false,
    estimatedLatencyMs: 4000,
    documentationUrl: "https://docs.anthropic.com/claude/docs/vision",
  },
  {
    id: "openrouter",
    name: "OpenRouter Vision",
    description: "Unified API for multiple vision models. Choose from various providers. Requires API key.",
    status: "coming_soon",
    providerId: "openrouter",
    features: { ...DEFAULT_VISION_FEATURE_FLAGS },
    requiresApiKey: true,
    isLocal: false,
    estimatedLatencyMs: 3500,
    documentationUrl: "https://openrouter.ai/docs",
  },
  {
    id: "local",
    name: "Local Vision",
    description: "Run vision models locally using Ollama or LM Studio. No API key needed, fully private.",
    status: "coming_soon",
    providerId: "local",
    features: {
      ...DEFAULT_VISION_FEATURE_FLAGS,
      volume: false,
    },
    requiresApiKey: false,
    isLocal: true,
    estimatedLatencyMs: 5000,
  },
];

// ─── Provider Selector ───

export interface ProviderSelectorState {
  selectedProviderId: string;
  availableProviders: ProviderOption[];
  unavailableProviders: ProviderOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Get all provider options.
 */
export function getAllProviderOptions(): ProviderOption[] {
  return [...PROVIDER_OPTIONS];
}

/**
 * Get available providers.
 */
export function getAvailableProviders(): ProviderOption[] {
  return PROVIDER_OPTIONS.filter((p) => p.status === "available" || p.status === "beta");
}

/**
 * Get coming soon providers.
 */
export function getComingSoonProviders(): ProviderOption[] {
  return PROVIDER_OPTIONS.filter((p) => p.status === "coming_soon");
}

/**
 * Get a provider option by ID.
 */
export function getProviderOption(providerId: string): ProviderOption | undefined {
  return PROVIDER_OPTIONS.find((p) => p.providerId === providerId);
}

/**
 * Check if a provider is available.
 */
export function isProviderAvailable(providerId: string): boolean {
  const provider = getProviderOption(providerId);
  return provider?.status === "available" || provider?.status === "beta";
}

/**
 * Get the status display text for a provider.
 */
export function getProviderStatusDisplay(status: ProviderAvailabilityStatus): string {
  switch (status) {
    case "available": return "Available";
    case "beta": return "Beta";
    case "coming_soon": return "Coming Soon";
    case "unavailable": return "Unavailable";
    default: return "Unknown";
  }
}

/**
 * Get the status color for a provider.
 */
export function getProviderStatusColor(status: ProviderAvailabilityStatus): string {
  switch (status) {
    case "available": return "#22c55e"; // green-500
    case "beta": return "#3b82f6"; // blue-500
    case "coming_soon": return "#f59e0b"; // amber-500
    case "unavailable": return "#ef4444"; // red-500
    default: return "#6b7280"; // gray-500
  }
}

// ─── Provider Selection Manager ───

export interface ProviderSelectionConfig {
  preferredProviderId: string;
  fallbackToMock: boolean;
  autoSelectAvailable: boolean;
}

const DEFAULT_SELECTION_CONFIG: ProviderSelectionConfig = {
  preferredProviderId: "mock-vision",
  fallbackToMock: true,
  autoSelectAvailable: true,
};

let selectionConfig: ProviderSelectionConfig = { ...DEFAULT_SELECTION_CONFIG };

export function getProviderSelectionConfig(): ProviderSelectionConfig {
  return { ...selectionConfig };
}

export function setProviderSelectionConfig(config: Partial<ProviderSelectionConfig>): void {
  selectionConfig = { ...selectionConfig, ...config };
}

export function resetProviderSelectionConfig(): void {
  selectionConfig = { ...DEFAULT_SELECTION_CONFIG };
}

/**
 * Get the best available provider based on current configuration.
 */
export function getRecommendedProvider(): ProviderOption {
  // Check preferred provider
  const preferred = getProviderOption(selectionConfig.preferredProviderId);
  if (preferred && (preferred.status === "available" || preferred.status === "beta")) {
    return preferred;
  }

  // Auto-select first available
  if (selectionConfig.autoSelectAvailable) {
    const available = getAvailableProviders();
    if (available.length > 0) {
      return available[0];
    }
  }

  // Fallback to mock
  if (selectionConfig.fallbackToMock) {
    const mock = getProviderOption("mock-vision");
    if (mock) return mock;
  }

  // Last resort: return the first provider option
  return PROVIDER_OPTIONS[0];
}

// ─── Provider Comparison ───

export interface ProviderComparison {
  provider: ProviderOption;
  score: number;
  reasons: string[];
}

/**
 * Compare providers and rank them by suitability for a given use case.
 */
export function compareProviders(
  useCase: "chart_analysis" | "trade_extraction" | "full_analysis"
): ProviderComparison[] {
  const providers = getAllProviderOptions();
  const comparisons: ProviderComparison[] = providers.map((provider) => {
    let score = 0;
    const reasons: string[] = [];

    // Availability score
    if (provider.status === "available") {
      score += 100;
      reasons.push("Fully available");
    } else if (provider.status === "beta") {
      score += 70;
      reasons.push("In beta");
    } else if (provider.status === "coming_soon") {
      score += 20;
      reasons.push("Coming soon");
    }

    // Feature match score
    const features = provider.features;
    switch (useCase) {
      case "chart_analysis":
        if (features.patterns) { score += 10; reasons.push("Pattern detection"); }
        if (features.levels) { score += 10; reasons.push("Level detection"); }
        if (features.trend) { score += 10; reasons.push("Trend analysis"); }
        break;
      case "trade_extraction":
        if (features.tradeData) { score += 30; reasons.push("Trade data extraction"); }
        if (features.annotations) { score += 10; reasons.push("Annotation detection"); }
        break;
      case "full_analysis":
        if (features.patterns) { score += 5; reasons.push("Pattern detection"); }
        if (features.levels) { score += 5; reasons.push("Level detection"); }
        if (features.trend) { score += 5; reasons.push("Trend analysis"); }
        if (features.tradeData) { score += 10; reasons.push("Trade data extraction"); }
        break;
    }

    // Latency score (lower is better)
    if (provider.estimatedLatencyMs < 2000) {
      score += 10;
      reasons.push("Fast response");
    }

    // Local provider bonus (no API key needed)
    if (provider.isLocal) {
      score += 5;
      reasons.push("No API key needed");
    }

    return { provider, score, reasons };
  });

  return comparisons.sort((a, b) => b.score - a.score);
}
