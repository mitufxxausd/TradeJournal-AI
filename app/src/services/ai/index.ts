/**
 * AI Foundation Module
 * Centralized exports for the entire AI system
 *
 * Usage:
 *   import { useAI, useTradeAnalysis, useCoach } from "@/hooks/ai";
 *   import { aiInitializer } from "@/services/ai";
 */

// ─── Types ───
export * from "./types";

// ─── Provider System ───
export { ProviderRegistry, providerRegistry } from "./providers/registry";
export { ProviderFactory, providerFactory, ProviderFactoryError } from "./providers/factory";
export {
  isVisionProvider,
  isOCRProvider,
  isSummaryProvider,
  isCoachingProvider,
  isTranscriptionProvider,
  isChartAnalysisProvider,
  isTradeAnalysisProvider,
} from "./providers/interfaces";
export type {
  AIProvider,
  VisionProvider,
  OCRProvider,
  SummaryProvider,
  CoachingProvider,
  TranscriptionProvider,
  ChartAnalysisProvider,
  TradeAnalysisProvider,
  FullAIProvider,
} from "./providers/interfaces";
export { MockProvider, mockProvider } from "./providers/mock";

// ─── Services ───
export {
  tradeAnalysisService,
  TradeAnalysisService,
  TradeAnalysisError,
} from "./services/tradeAnalysisService";
export {
  chartAnalysisService,
  ChartAnalysisService,
  ChartAnalysisError,
} from "./services/chartAnalysisService";
export { ocrService, OCRService, OCRError } from "./services/ocrService";
export { coachingService, CoachingService, CoachingError } from "./services/coachingService";
export { transcriptionService, TranscriptionService, TranscriptionError } from "./services/transcriptionService";
export { summaryService, SummaryService, SummaryError } from "./services/summaryService";

// ─── Config ───
export {
  getDefaultProviderConfigs,
  getActiveProviderName,
  getProviderConfig,
  getEnabledProviderConfigs,
  getAISettings,
  hasRealProviderConfigured,
} from "./config";

// ─── Initializer ───
import { providerRegistry } from "./providers/registry";
import { providerFactory } from "./providers/factory";
import { mockProvider } from "./providers/mock";
import { getDefaultProviderConfigs } from "./config";

/**
 * AI Initializer
 * Call this once at app startup to register all AI providers
 */
export function initializeAI(): void {
  const configs = getDefaultProviderConfigs();

  configs.forEach((config) => {
    if (!config.enabled) return;

    switch (config.name) {
      case "mock":
        providerRegistry.register("mock", mockProvider, config);
        providerFactory.registerCreator("mock", () => mockProvider);
        break;
      // Future providers:
      // case "openai":
      //   providerRegistry.register("openai", new OpenAIProvider(config), config);
      //   providerFactory.registerCreator("openai", (cfg) => new OpenAIProvider(cfg));
      //   break;
      // case "gemini": ...
      // case "claude": ...
      // case "openrouter": ...
      // case "groq": ...
      // case "deepseek": ...
      // case "azure-openai": ...
      default:
        // Provider not yet implemented - skip
        break;
    }
  });
}

/**
 * Get AI system status
 */
export function getAIStatus() {
  const providers = providerRegistry.getAllConfigs();
  return {
    initialized: providers.length > 0,
    providerCount: providers.length,
    providers: providers.map((p) => ({
      name: p.name,
      enabled: p.enabled,
      capabilities: p.capabilities,
    })),
    capabilities: [
      "trade-analysis",
      "chart-analysis",
      "ocr",
      "coaching",
      "transcription",
      "summary",
    ] as const,
  };
}
