/**
 * Vision Provider Registry
 * Manages multiple AI Vision providers with priority-based selection,
 * failover support, and capability-based filtering.
 *
 * Usage:
 *   const registry = getVisionProviderRegistry();
 *   registry.register(new MyVisionProvider());
 *   const primary = registry.getPrimaryProvider();
 *   const result = await primary.analyze(imageFile);
 *
 * Architecture:
 *   - Providers are registered with priority (lower = higher priority)
 *   - Primary provider is the highest-priority available provider
 *   - Automatic failover to next available provider
 *   - Capability-based filtering for specific analysis types
 */

import type { VisionProvider, VisionProviderConfig, VisionProviderCapabilities } from "./VisionProvider";
import type { VisionFeatureFlags, VisionFeatureType } from "./VisionAnalysisResult";
import { DEFAULT_VISION_FEATURE_FLAGS } from "./VisionAnalysisResult";

// ─── Registry Interface ───

export interface VisionProviderRegistry {
  /** Register a new vision provider */
  register(provider: VisionProvider, priority?: number): void;

  /** Unregister a provider by ID */
  unregister(providerId: string): boolean;

  /** Get the highest-priority available provider */
  getPrimaryProvider(): VisionProvider | null;

  /** Get provider by ID */
  getProvider(providerId: string): VisionProvider | null;

  /** Get all registered providers (sorted by priority) */
  getAllProviders(): RegisteredVisionProvider[];

  /** Get all available (configured and ready) providers */
  getAvailableProviders(): VisionProvider[];

  /** Get providers that support a specific feature */
  getProvidersByFeature(feature: VisionFeatureType): VisionProvider[];

  /** Check if any provider is available */
  hasAvailableProvider(): boolean;

  /** Check if a specific provider is registered */
  hasProvider(providerId: string): boolean;

  /** Get count of registered providers */
  getProviderCount(): number;

  /** Get count of available providers */
  getAvailableCount(): number;

  /** Clear all registered providers */
  clear(): void;

  /** Get provider capabilities info */
  getProviderCapabilities(providerId: string): VisionProviderCapabilities | null;

  /** Set provider priority */
  setProviderPriority(providerId: string, priority: number): boolean;

  /** Create a provider config for a known provider type */
  createConfig(providerId: string, overrides?: Partial<VisionProviderConfig>): VisionProviderConfig;
}

// ─── Registered Provider Entry ───

export interface RegisteredVisionProvider {
  /** The provider instance */
  provider: VisionProvider;
  /** Registration priority (lower = higher priority) */
  priority: number;
  /** When the provider was registered */
  registeredAt: string;
  /** Provider configuration */
  config?: VisionProviderConfig;
}

// ─── Registry Implementation ───

class DefaultVisionProviderRegistry implements VisionProviderRegistry {
  private providers: Map<string, RegisteredVisionProvider> = new Map();
  private priorities: Map<string, number> = new Map();
  private autoIncrementPriority = 100;

  register(provider: VisionProvider, priority?: number): void {
    const effectivePriority = priority ?? this.autoIncrementPriority++;
    this.providers.set(provider.providerId, {
      provider,
      priority: effectivePriority,
      registeredAt: new Date().toISOString(),
    });
    this.priorities.set(provider.providerId, effectivePriority);
  }

  unregister(providerId: string): boolean {
    this.priorities.delete(providerId);
    return this.providers.delete(providerId);
  }

  getPrimaryProvider(): VisionProvider | null {
    const sorted = this.getSortedAvailable();
    return sorted[0] ?? null;
  }

  getProvider(providerId: string): VisionProvider | null {
    const entry = this.providers.get(providerId);
    return entry?.provider ?? null;
  }

  getAllProviders(): RegisteredVisionProvider[] {
    return Array.from(this.providers.values()).sort(
      (a, b) => a.priority - b.priority
    );
  }

  getAvailableProviders(): VisionProvider[] {
    return this.getSortedAvailable();
  }

  getProvidersByFeature(feature: VisionFeatureType): VisionProvider[] {
    return this.getSortedAvailable().filter((provider) => {
      const caps = provider.supportedFeatures;
      switch (feature) {
        case "patterns": return caps.patterns;
        case "levels": return caps.levels;
        case "trend": return caps.trend;
        case "candlestick_patterns": return caps.candlestickPatterns;
        case "indicators": return caps.indicators;
        case "volume": return caps.volume;
        case "annotations": return caps.annotations;
        case "trade_data": return caps.tradeData;
        case "platform": return caps.platform;
        default: return false;
      }
    });
  }

  hasAvailableProvider(): boolean {
    return this.getSortedAvailable().length > 0;
  }

  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  getProviderCount(): number {
    return this.providers.size;
  }

  getAvailableCount(): number {
    return this.getSortedAvailable().length;
  }

  clear(): void {
    this.providers.clear();
    this.priorities.clear();
    this.autoIncrementPriority = 100;
  }

  getProviderCapabilities(providerId: string): VisionProviderCapabilities | null {
    const entry = this.providers.get(providerId);
    const provider = entry?.provider;
    if (!provider) return null;

    return {
      providerId: provider.providerId,
      name: provider.name,
      features: provider.supportedFeatures,
      maxImageSizeBytes: 20 * 1024 * 1024, // 20MB default
      supportedFormats: ["image/png", "image/jpeg", "image/webp"],
      maxBatchSize: 10,
      estimatedLatencyMs: 2000,
      requiresApiKey: !this.isLocalProvider(providerId),
      isLocal: this.isLocalProvider(providerId),
    };
  }

  setProviderPriority(providerId: string, priority: number): boolean {
    const entry = this.providers.get(providerId);
    if (!entry) return false;

    entry.priority = priority;
    this.priorities.set(providerId, priority);
    return true;
  }

  createConfig(providerId: string, overrides?: Partial<VisionProviderConfig>): VisionProviderConfig {
    return {
      providerId,
      name: overrides?.name ?? providerId,
      apiKey: overrides?.apiKey ?? "",
      baseUrl: overrides?.baseUrl,
      model: overrides?.model,
      enabled: overrides?.enabled ?? false,
      priority: overrides?.priority ?? 10,
      timeoutMs: overrides?.timeoutMs ?? 30000,
      features: overrides?.features ?? { ...DEFAULT_VISION_FEATURE_FLAGS },
    };
  }

  // ─── Private Helpers ───

  private getSortedAvailable(): VisionProvider[] {
    return Array.from(this.providers.values())
      .filter((entry) => entry.provider.isAvailable())
      .sort((a, b) => a.priority - b.priority)
      .map((entry) => entry.provider);
  }

  private isLocalProvider(providerId: string): boolean {
    // Local providers don't need API keys
    const localProviders = ["mock", "local", "ollama", "lmstudio"];
    return localProviders.some((id) => providerId.toLowerCase().includes(id));
  }
}

// ─── Singleton Instance ───

let globalRegistry: VisionProviderRegistry | null = null;

/**
 * Get the global vision provider registry.
 * Creates a new registry on first call.
 */
export function getVisionProviderRegistry(): VisionProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new DefaultVisionProviderRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (useful for testing).
 */
export function resetVisionProviderRegistry(): void {
  globalRegistry = null;
}

/**
 * Create a fresh registry instance (not the singleton).
 * Useful for testing or isolated use cases.
 */
export function createVisionProviderRegistry(): VisionProviderRegistry {
  return new DefaultVisionProviderRegistry();
}

// ─── Legacy compatibility exports ───

/**
 * @deprecated Use getVisionProviderRegistry instead.
 */
export function getVisionRegistry(): VisionProviderRegistry {
  return getVisionProviderRegistry();
}

/**
 * @deprecated Use resetVisionProviderRegistry instead.
 */
export function resetVisionRegistry(): void {
  resetVisionProviderRegistry();
}

// Re-export the class for testing
export { DefaultVisionProviderRegistry };
