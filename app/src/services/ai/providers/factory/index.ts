import type { AIProvider, AIProviderName, AIProviderConfig } from "../../types/common";
import { ProviderRegistry, providerRegistry } from "../registry";

/**
 * Provider Factory
 * Creates and manages AI provider instances
 */
class ProviderFactory {
  private registry: ProviderRegistry;
  private creators: Map<AIProviderName, (config: AIProviderConfig) => AIProvider> = new Map();

  constructor(registry: ProviderRegistry = providerRegistry) {
    this.registry = registry;
  }

  /**
   * Register a provider creator function
   */
  registerCreator(
    name: AIProviderName,
    creator: (config: AIProviderConfig) => AIProvider
  ): void {
    this.creators.set(name, creator);
  }

  /**
   * Check if a creator is registered for a provider
   */
  hasCreator(name: AIProviderName): boolean {
    return this.creators.has(name);
  }

  /**
   * Create a provider instance by name
   */
  create(name: AIProviderName, config: AIProviderConfig): AIProvider {
    const creator = this.creators.get(name);
    if (!creator) {
      throw new ProviderFactoryError(`No creator registered for provider: ${name}`);
    }

    try {
      const provider = creator(config);
      this.registry.register(name, provider, config);
      return provider;
    } catch (error) {
      throw new ProviderFactoryError(
        `Failed to create provider ${name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create and register multiple providers
   */
  createMany(configs: AIProviderConfig[]): AIProvider[] {
    return configs.map((config) => this.create(config.name, config));
  }

  /**
   * Get or create a provider
   */
  getOrCreate(name: AIProviderName, config: AIProviderConfig): AIProvider {
    const existing = this.registry.get(name);
    if (existing) return existing;
    return this.create(name, config);
  }

  /**
   * Remove a creator registration
   */
  unregisterCreator(name: AIProviderName): void {
    this.creators.delete(name);
  }

  /**
   * Get all registered creator names
   */
  getRegisteredCreators(): AIProviderName[] {
    return Array.from(this.creators.keys());
  }

  /**
   * Clear all creators
   */
  clear(): void {
    this.creators.clear();
  }
}

/**
 * Provider Factory Error
 */
class ProviderFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderFactoryError";
  }
}

// Singleton instance
export const providerFactory = new ProviderFactory();

// Export class for testing or custom instances
export { ProviderFactory, ProviderFactoryError };
