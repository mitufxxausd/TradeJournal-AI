import type {
  AIProviderName,
  AIProviderCapability,
  AIProviderConfig,
} from "../../types/common";
import type { AIProvider } from "../interfaces";

/**
 * Provider Registry
 * Maintains a registry of all available AI providers
 */
class ProviderRegistry {
  private providers: Map<AIProviderName, AIProvider> = new Map();
  private configs: Map<AIProviderName, AIProviderConfig> = new Map();

  /**
   * Register a provider with the registry
   */
  register(name: AIProviderName, provider: AIProvider, config: AIProviderConfig): void {
    this.providers.set(name, provider);
    this.configs.set(name, config);
  }

  /**
   * Unregister a provider
   */
  unregister(name: AIProviderName): void {
    this.providers.delete(name);
    this.configs.delete(name);
  }

  /**
   * Get a registered provider by name
   */
  get(name: AIProviderName): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get provider configuration
   */
  getConfig(name: AIProviderName): AIProviderConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * Check if a provider is registered
   */
  has(name: AIProviderName): boolean {
    return this.providers.has(name);
  }

  /**
   * Get all registered providers
   */
  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all registered provider names
   */
  getAllNames(): AIProviderName[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all provider configs
   */
  getAllConfigs(): AIProviderConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get providers that support a specific capability
   */
  getByCapability(capability: AIProviderCapability): AIProvider[] {
    const result: AIProvider[] = [];
    for (const [name, config] of this.configs) {
      if (config.enabled && config.capabilities.includes(capability)) {
        const provider = this.providers.get(name);
        if (provider) result.push(provider);
      }
    }
    return result;
  }

  /**
   * Get providers sorted by priority
   */
  getByPriority(): AIProvider[] {
    const entries = Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);

    return entries
      .map(([name]) => this.providers.get(name))
      .filter((p): p is AIProvider => p !== undefined);
  }

  /**
   * Get the highest priority provider for a specific capability
   */
  getPrimaryForCapability(capability: AIProviderCapability): AIProvider | undefined {
    const entries = Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled && config.capabilities.includes(capability))
      .sort((a, b) => a[1].priority - b[1].priority);

    for (const [name] of entries) {
      const provider = this.providers.get(name);
      if (provider) return provider;
    }
    return undefined;
  }

  /**
   * Get provider name from instance
   */
  getName(provider: AIProvider): AIProviderName | undefined {
    for (const [name, p] of this.providers) {
      if (p === provider) return name;
    }
    return undefined;
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
    this.configs.clear();
  }

  /**
   * Get count of registered providers
   */
  get count(): number {
    return this.providers.size;
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry();

// Export class for testing or custom instances
export { ProviderRegistry };
