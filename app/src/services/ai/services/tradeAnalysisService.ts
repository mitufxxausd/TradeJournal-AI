import type { AIRequestOptions } from "../types/common";
import type { TradeAnalysisRequest, TradeAnalysisResult, TradeScore } from "../types/trade-analysis";
import type { AIResponse } from "../types/common";
import { providerRegistry } from "../providers/registry";
import { isTradeAnalysisProvider } from "../providers/interfaces";

/**
 * Trade Analysis Service
 * High-level service for analyzing trades using AI providers
 */
class TradeAnalysisService {
  private getProvider() {
    const provider = providerRegistry.getPrimaryForCapability("trade-analysis");
    if (!provider || !isTradeAnalysisProvider(provider)) {
      throw new TradeAnalysisError("No trade analysis provider available");
    }
    return provider;
  }

  /**
   * Perform full trade analysis
   */
  async analyze(request: TradeAnalysisRequest, options?: AIRequestOptions): Promise<AIResponse<TradeAnalysisResult>> {
    const provider = this.getProvider();
    return provider.analyze(request, options);
  }

  /**
   * Get trade score only (faster)
   */
  async scoreTrade(tradeId: string, options?: AIRequestOptions): Promise<AIResponse<TradeScore>> {
    const provider = this.getProvider();
    return provider.scoreTrade(tradeId, options);
  }
}

class TradeAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TradeAnalysisError";
  }
}

// Singleton
export const tradeAnalysisService = new TradeAnalysisService();
export { TradeAnalysisService, TradeAnalysisError };
