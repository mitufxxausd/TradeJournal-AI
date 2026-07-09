/**
 * AI Vision Provider Types
 * Interfaces for future AI Vision providers.
 *
 * These interfaces define the contract that any AI Vision provider must implement.
 * They are designed to be provider-agnostic, allowing seamless swapping between
 * different vision AI services without changing the application code.
 *
 * Supported future providers:
 * - OpenAI Vision (GPT-4V)
 * - Google Gemini Vision
 * - Anthropic Claude Vision
 * - OpenRouter (unified API)
 *
 * NO fake analysis is implemented. These are pure interfaces only.
 */

import type { OCRResult, OCROptions } from "@/services/ocr/types";

// ─── Base Vision Provider Interface ───

/**
 * Base interface for all AI Vision providers.
 * Any provider (OpenAI, Gemini, Claude, etc.) must implement this.
 */
export interface VisionProvider {
  /** Provider display name */
  readonly name: string;
  /** Provider identifier (e.g., "openai", "gemini", "claude") */
  readonly providerId: string;
  /** Whether the provider is configured and available */
  isAvailable(): boolean;
  /** Analyze a trading chart screenshot */
  analyzeChart(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult>;
  /** Extract trade data from a broker screenshot */
  extractTradeData(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult>;
}

// ─── Vision Request Options ───

export interface VisionRequestOptions extends OCROptions {
  /** Specific analysis type to perform */
  analysisType?: "chart" | "trade_extraction" | "full";
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

// ─── Vision Analysis Result ───

/**
 * Result from a vision analysis.
 * This wraps the OCR result with additional vision-specific metadata.
 */
export interface VisionAnalysisResult {
  /** Whether the analysis was successful */
  success: boolean;
  /** The OCR/trade extraction result */
  ocrResult: OCRResult;
  /** Provider that performed the analysis */
  provider: string;
  /** Model used (if applicable) */
  model?: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Error message if analysis failed */
  error?: string;
}

// ─── Vision Provider Configuration ───

export interface VisionProviderConfig {
  /** Provider identifier */
  providerId: string;
  /** API key (stored securely) */
  apiKey?: string;
  /** API base URL (for custom endpoints like OpenRouter) */
  baseUrl?: string;
  /** Model to use */
  model?: string;
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Provider priority (lower = higher priority) */
  priority: number;
}

// ─── Vision Provider Registry ───

/**
 * Registry for managing multiple vision providers.
 * Provides failover and priority-based selection.
 */
export interface VisionProviderRegistry {
  /** Register a new vision provider */
  register(provider: VisionProvider): void;
  /** Get the best available provider */
  getPrimaryProvider(): VisionProvider | null;
  /** Get all available providers */
  getAvailableProviders(): VisionProvider[];
  /** Get a provider by ID */
  getProvider(providerId: string): VisionProvider | null;
  /** Check if any provider is available */
  hasAvailableProvider(): boolean;
}

// ─── Stub Implementations (for future use) ───

/**
 * OpenAI Vision Provider Stub
 * Will be implemented when API keys are configured.
 */
export class OpenAIVisionProvider implements VisionProvider {
  readonly name = "OpenAI Vision";
  readonly providerId = "openai";

  isAvailable(): boolean {
    // Requires API key - not available until configured
    return false;
  }

  async analyzeChart(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("OpenAI Vision not configured. Add API key in AI Settings.");
  }

  async extractTradeData(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("OpenAI Vision not configured. Add API key in AI Settings.");
  }
}

/**
 * Google Gemini Vision Provider Stub
 */
export class GeminiVisionProvider implements VisionProvider {
  readonly name = "Google Gemini Vision";
  readonly providerId = "gemini";

  isAvailable(): boolean {
    return false;
  }

  async analyzeChart(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("Gemini Vision not configured. Add API key in AI Settings.");
  }

  async extractTradeData(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("Gemini Vision not configured. Add API key in AI Settings.");
  }
}

/**
 * Claude Vision Provider Stub
 */
export class ClaudeVisionProvider implements VisionProvider {
  readonly name = "Anthropic Claude Vision";
  readonly providerId = "claude";

  isAvailable(): boolean {
    return false;
  }

  async analyzeChart(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("Claude Vision not configured. Add API key in AI Settings.");
  }

  async extractTradeData(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("Claude Vision not configured. Add API key in AI Settings.");
  }
}

/**
 * OpenRouter Vision Provider Stub
 * Provides unified access to multiple vision models.
 */
export class OpenRouterVisionProvider implements VisionProvider {
  readonly name = "OpenRouter Vision";
  readonly providerId = "openrouter";

  isAvailable(): boolean {
    return false;
  }

  async analyzeChart(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("OpenRouter Vision not configured. Add API key in AI Settings.");
  }

  async extractTradeData(_imageFile: File, _options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    throw new Error("OpenRouter Vision not configured. Add API key in AI Settings.");
  }
}

/**
 * Simple vision provider registry implementation.
 */
export class DefaultVisionRegistry implements VisionProviderRegistry {
  private providers: Map<string, VisionProvider> = new Map();

  register(provider: VisionProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  getPrimaryProvider(): VisionProvider | null {
    for (const [, provider] of this.providers) {
      if (provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  getAvailableProviders(): VisionProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable());
  }

  getProvider(providerId: string): VisionProvider | null {
    return this.providers.get(providerId) || null;
  }

  hasAvailableProvider(): boolean {
    return this.getAvailableProviders().length > 0;
  }
}

// ─── Singleton Registry ───

let globalRegistry: VisionProviderRegistry | null = null;

export function getVisionRegistry(): VisionProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new DefaultVisionRegistry();
    // Register stub providers for future use
    globalRegistry.register(new OpenAIVisionProvider());
    globalRegistry.register(new GeminiVisionProvider());
    globalRegistry.register(new ClaudeVisionProvider());
    globalRegistry.register(new OpenRouterVisionProvider());
  }
  return globalRegistry;
}

/**
 * Reset the global registry (useful for testing).
 */
export function resetVisionRegistry(): void {
  globalRegistry = null;
}
