/**
 * Stub Vision Providers
 * Placeholder implementations for real AI Vision providers.
 *
 * These stubs:
 * - Return isAvailable() === false (no accidental API usage)
 * - Throw descriptive errors when called
 * - Are ready for real implementation when API keys are configured
 * - Follow the same VisionProvider interface as all other providers
 *
 * To activate a provider:
 * 1. Set the corresponding environment variable (API key)
 * 2. Implement the actual API calls in the provider class
 * 3. Update isAvailable() to check for the API key
 *
 * Supported providers:
 * - OpenAI (GPT-4V, GPT-4o)
 * - Google Gemini (Gemini Pro Vision)
 * - Anthropic Claude (Claude 3 Opus/Sonnet)
 * - OpenRouter (unified API for multiple models)
 */

import type { VisionProvider, VisionProviderConfig } from "../VisionProvider";
import type {
  VisionAnalysisResult,
  VisionRequestOptions,
  VisionBatchResult,
  VisionFeatureFlags,
} from "../VisionAnalysisResult";
import { DEFAULT_VISION_FEATURE_FLAGS } from "../VisionAnalysisResult";

// ─── Base Stub Class ───

abstract class StubVisionProvider implements VisionProvider {
  abstract readonly name: string;
  abstract readonly providerId: string;
  readonly version = "0.0.0-stub";

  abstract readonly supportedFeatures: VisionFeatureFlags;

  protected config: VisionProviderConfig;

  constructor(config?: Partial<VisionProviderConfig>) {
    this.config = {
      providerId: this.providerId,
      name: this.name,
      enabled: false,
      priority: 99,
      timeoutMs: 30000,
      features: { ...DEFAULT_VISION_FEATURE_FLAGS },
      ...config,
      providerId: this.providerId,
      name: this.name,
    };
  }

  /**
   * Stubs are never available until properly implemented.
   * Override this in the actual implementation.
   */
  isAvailable(): boolean {
    return false;
  }

  /**
   * Throws an error directing the user to configure the provider.
   * Override this in the actual implementation with real API calls.
   */
  async analyze(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error(
      `${this.name} is not configured. ` +
      `Set ${this.getApiKeyEnvVar()} environment variable and implement the provider. ` +
      `See AI_VISION_ARCHITECTURE.md for setup instructions.`
    );
  }

  async analyzeBatch(_imageFiles: File[], _options?: VisionRequestOptions): Promise<VisionBatchResult> {
    throw new Error(`${this.name} batch analysis not implemented. Configure the provider first.`);
  }

  /**
   * Returns unhealthy status since this is a stub.
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    return {
      healthy: false,
      latencyMs: 0,
      message: `${this.name} is not configured (stub implementation)`,
    };
  }

  /**
   * Get the environment variable name for the API key.
   */
  protected abstract getApiKeyEnvVar(): string;
}

// ─── OpenAI Vision Provider Stub ───

export class OpenAIVisionProvider extends StubVisionProvider {
  readonly name = "OpenAI Vision";
  readonly providerId = "openai";
  readonly supportedFeatures: VisionFeatureFlags = {
    patterns: true,
    levels: true,
    trend: true,
    candlestickPatterns: true,
    indicators: true,
    volume: false,
    annotations: true,
    tradeData: true,
    platform: true,
  };

  protected getApiKeyEnvVar(): string {
    return "VITE_OPENAI_API_KEY";
  }
}

// ─── Google Gemini Vision Provider Stub ───

export class GeminiVisionProvider extends StubVisionProvider {
  readonly name = "Google Gemini Vision";
  readonly providerId = "gemini";
  readonly supportedFeatures: VisionFeatureFlags = {
    patterns: true,
    levels: true,
    trend: true,
    candlestickPatterns: true,
    indicators: true,
    volume: true,
    annotations: true,
    tradeData: true,
    platform: true,
  };

  protected getApiKeyEnvVar(): string {
    return "VITE_GEMINI_API_KEY";
  }
}

// ─── Anthropic Claude Vision Provider Stub ───

export class ClaudeVisionProvider extends StubVisionProvider {
  readonly name = "Anthropic Claude Vision";
  readonly providerId = "claude";
  readonly supportedFeatures: VisionFeatureFlags = {
    patterns: true,
    levels: true,
    trend: true,
    candlestickPatterns: true,
    indicators: true,
    volume: false,
    annotations: true,
    tradeData: true,
    platform: false,
  };

  protected getApiKeyEnvVar(): string {
    return "VITE_CLAUDE_API_KEY";
  }
}

// ─── OpenRouter Vision Provider Stub ───

export class OpenRouterVisionProvider extends StubVisionProvider {
  readonly name = "OpenRouter Vision";
  readonly providerId = "openrouter";
  readonly supportedFeatures: VisionFeatureFlags = {
    patterns: true,
    levels: true,
    trend: true,
    candlestickPatterns: true,
    indicators: true,
    volume: true,
    annotations: true,
    tradeData: true,
    platform: true,
  };

  protected getApiKeyEnvVar(): string {
    return "VITE_OPENROUTER_API_KEY";
  }
}

// ─── Provider Factory ───

export type StubVisionProviderType =
  | "openai"
  | "gemini"
  | "claude"
  | "openrouter";

/**
 * Create a stub vision provider by type.
 */
export function createStubVisionProvider(
  type: StubVisionProviderType,
  config?: Partial<VisionProviderConfig>
): StubVisionProvider {
  switch (type) {
    case "openai": return new OpenAIVisionProvider(config);
    case "gemini": return new GeminiVisionProvider(config);
    case "claude": return new ClaudeVisionProvider(config);
    case "openrouter": return new OpenRouterVisionProvider(config);
    default:
      throw new Error(`Unknown stub vision provider type: ${type}`);
  }
}

/**
 * Get all available stub provider types.
 */
export function getStubVisionProviderTypes(): StubVisionProviderType[] {
  return ["openai", "gemini", "claude", "openrouter"];
}

/**
 * Create all stub providers at once.
 */
export function createAllStubVisionProviders(): StubVisionProvider[] {
  return getStubVisionProviderTypes().map((type) => createStubVisionProvider(type));
}
