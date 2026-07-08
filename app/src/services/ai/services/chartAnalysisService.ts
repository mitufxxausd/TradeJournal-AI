import type { AIRequestOptions, AIResponse } from "../types/common";
import type { ChartAnalysisRequest, ChartAnalysisResult } from "../types/chart-analysis";
import { providerRegistry } from "../providers/registry";
import { isChartAnalysisProvider } from "../providers/interfaces";

/**
 * Chart Analysis Service
 * High-level service for analyzing chart images using AI providers
 */
class ChartAnalysisService {
  private getProvider() {
    const provider = providerRegistry.getPrimaryForCapability("chart-analysis");
    if (!provider || !isChartAnalysisProvider(provider)) {
      throw new ChartAnalysisError("No chart analysis provider available");
    }
    return provider;
  }

  /**
   * Full chart analysis
   */
  async analyze(request: ChartAnalysisRequest, options?: AIRequestOptions): Promise<AIResponse<ChartAnalysisResult>> {
    const provider = this.getProvider();
    return provider.analyze(request, options);
  }

  /**
   * Quick pattern detection
   */
  async detectPatterns(imageUrl: string, options?: AIRequestOptions) {
    const provider = this.getProvider();
    return provider.detectPatterns(imageUrl, options);
  }

  /**
   * Identify support/resistance levels
   */
  async identifyLevels(imageUrl: string, options?: AIRequestOptions) {
    const provider = this.getProvider();
    return provider.identifyLevels(imageUrl, options);
  }
}

class ChartAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChartAnalysisError";
  }
}

export const chartAnalysisService = new ChartAnalysisService();
export { ChartAnalysisService, ChartAnalysisError };
