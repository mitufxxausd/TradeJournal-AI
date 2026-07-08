import type { AIRequestOptions, AIResponse } from "../types/common";
import { providerRegistry } from "../providers/registry";
import { isSummaryProvider } from "../providers/interfaces";

/**
 * Summary Service
 * High-level service for trade summarization
 */
class SummaryService {
  private getProvider() {
    const provider = providerRegistry.getPrimaryForCapability("summary");
    if (!provider || !isSummaryProvider(provider)) {
      throw new SummaryError("No summary provider available");
    }
    return provider;
  }

  /**
   * Summarize a single trade
   */
  async summarizeTrade(tradeId: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const provider = this.getProvider();
    return provider.summarizeTrade(tradeId, options);
  }

  /**
   * Summarize multiple trades
   */
  async summarizeTrades(tradeIds: string[], options?: AIRequestOptions): Promise<AIResponse<string>> {
    const provider = this.getProvider();
    return provider.summarizeTrades(tradeIds, options);
  }
}

class SummaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SummaryError";
  }
}

export const summaryService = new SummaryService();
export { SummaryService, SummaryError };
