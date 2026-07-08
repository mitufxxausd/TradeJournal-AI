import { useMemo } from "react";
import { providerRegistry } from "@/services/ai/providers/registry";
import { providerFactory } from "@/services/ai/providers/factory";
import { mockProvider } from "@/services/ai/providers/mock";
import { getDefaultProviderConfigs } from "@/services/ai/config";
import type { AIProvider, AIProviderName } from "@/services/ai/types/common";

/**
 * useAI Hook
 * Provides access to the AI provider system
 * Used to initialize and access AI providers
 */
export function useAI() {
  return useMemo(() => {
    const initialize = () => {
      const configs = getDefaultProviderConfigs();

      configs.forEach((config) => {
        if (config.name === "mock" && config.enabled) {
          providerRegistry.register("mock", mockProvider, config);
          providerFactory.registerCreator("mock", () => mockProvider);
        }
        // Future providers will be registered here
        // e.g., if (config.name === "openai" && config.enabled) { ... }
      });
    };

    const getProvider = (name: AIProviderName): AIProvider | undefined => {
      return providerRegistry.get(name);
    };

    const getActiveProvider = (): AIProvider | undefined => {
      const providers = providerRegistry.getByPriority();
      return providers[0];
    };

    const isAvailable = (name: AIProviderName): boolean => {
      const provider = providerRegistry.get(name);
      return provider?.isAvailable() ?? false;
    };

    const hasCapability = (capability: Parameters<typeof providerRegistry.getByCapability>[0]): boolean => {
      return providerRegistry.getByCapability(capability).length > 0;
    };

    return {
      initialize,
      getProvider,
      getActiveProvider,
      isAvailable,
      hasCapability,
      registry: providerRegistry,
      factory: providerFactory,
    };
  }, []);
}
