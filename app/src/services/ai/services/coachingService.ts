import type { AIRequestOptions, AIResponse } from "../types/common";
import type { CoachingRequest, CoachingResult, CoachMessage } from "../types/coaching";
import { providerRegistry } from "../providers/registry";
import { isCoachingProvider } from "../providers/interfaces";

/**
 * Coaching Service
 * High-level service for AI coaching and mentorship
 */
class CoachingService {
  private getProvider() {
    const provider = providerRegistry.getPrimaryForCapability("coaching");
    if (!provider || !isCoachingProvider(provider)) {
      throw new CoachingError("No coaching provider available");
    }
    return provider;
  }

  /**
   * Generate coaching plan based on trading history
   */
  async generateCoaching(
    request: CoachingRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<CoachingResult>> {
    const provider = this.getProvider();
    return provider.generateCoaching(request, options);
  }

  /**
   * Chat with AI coach
   */
  async chat(message: string, sessionId?: string, options?: AIRequestOptions): Promise<AIResponse<CoachMessage>> {
    const provider = this.getProvider();
    return provider.chat(message, sessionId, options);
  }
}

class CoachingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoachingError";
  }
}

export const coachingService = new CoachingService();
export { CoachingService, CoachingError };
