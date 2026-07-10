/**
 * Vision Provider Interface
 * Defines the contract that all AI Vision providers must implement.
 *
 * This interface is designed to be provider-agnostic, allowing seamless
 * swapping between different vision AI services (OpenAI, Gemini, Claude,
 * OpenRouter, or local models) without changing application code.
 *
 * Architecture:
 *   Screenshot → VisionProvider.analyze() → VisionAnalysisResult
 *                           ↑
 *                   OCR Fallback (always available)
 */

import type {
  VisionAnalysisResult,
  VisionRequestOptions,
  VisionBatchResult,
  VisionFeatureFlags,
} from "./VisionAnalysisResult";

// ─── Vision Provider Interface ───

export interface VisionProvider {
  /** Provider display name (e.g., "OpenAI Vision") */
  readonly name: string;

  /** Unique provider identifier (e.g., "openai", "gemini", "claude") */
  readonly providerId: string;

  /** Provider version */
  readonly version: string;

  /** Feature flags indicating what this provider supports */
  readonly supportedFeatures: VisionFeatureFlags;

  /** Whether the provider is configured and available for use */
  isAvailable(): boolean;

  /** Analyze a trading screenshot (chart or broker screenshot) */
  analyze(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult>;

  /** Analyze multiple screenshots in batch */
  analyzeBatch(imageFiles: File[], options?: VisionRequestOptions): Promise<VisionBatchResult>;

  /** Quick health check */
  healthCheck?(): Promise<{ healthy: boolean; latencyMs: number; message: string }>;
}

// ─── Vision Provider Configuration ───

export interface VisionProviderConfig {
  /** Provider identifier */
  providerId: string;
  /** Display name */
  name: string;
  /** API key (if needed) */
  apiKey?: string;
  /** Custom base URL (for OpenRouter, Azure, etc.) */
  baseUrl?: string;
  /** Model to use */
  model?: string;
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Provider priority (lower = higher priority) */
  priority: number;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Feature flags */
  features?: Partial<VisionFeatureFlags>;
}

// ─── Vision Provider Capabilities ───

export interface VisionProviderCapabilities {
  /** Provider identifier */
  providerId: string;
  /** Provider name */
  name: string;
  /** Available features */
  features: VisionFeatureFlags;
  /** Maximum image size supported (in bytes) */
  maxImageSizeBytes: number;
  /** Supported image formats */
  supportedFormats: string[];
  /** Maximum number of images per batch */
  maxBatchSize: number;
  /** Average latency estimate in ms */
  estimatedLatencyMs: number;
  /** Whether the provider requires API key */
  requiresApiKey: boolean;
  /** Whether the provider works offline/locally */
  isLocal: boolean;
}
