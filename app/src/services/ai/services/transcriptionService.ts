import type { AIRequestOptions, AIResponse } from "../types/common";
import type { TranscriptionRequest, VoiceTranscript } from "../types/transcription";
import { providerRegistry } from "../providers/registry";
import { isTranscriptionProvider } from "../providers/interfaces";

/**
 * Transcription Service
 * High-level service for voice-to-text transcription
 */
class TranscriptionService {
  private getProvider() {
    const provider = providerRegistry.getPrimaryForCapability("transcription");
    if (!provider || !isTranscriptionProvider(provider)) {
      throw new TranscriptionError("No transcription provider available");
    }
    return provider;
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(
    request: TranscriptionRequest,
    options?: AIRequestOptions
  ): Promise<AIResponse<VoiceTranscript>> {
    const provider = this.getProvider();
    return provider.transcribe(request, options);
  }

  /**
   * Check if real-time transcription is supported
   */
  supportsRealtime(): boolean {
    try {
      const provider = this.getProvider();
      return provider.supportsRealtime();
    } catch {
      return false;
    }
  }
}

class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

export const transcriptionService = new TranscriptionService();
export { TranscriptionService, TranscriptionError };
