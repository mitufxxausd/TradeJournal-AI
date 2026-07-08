import type { AIRequestOptions, AIResponse } from "../types/common";
import type { OCRResult, OCROptions } from "../types/ocr";
import { providerRegistry } from "../providers/registry";
import { isOCRProvider } from "../providers/interfaces";

/**
 * OCR Service
 * High-level service for extracting text and trade data from images
 */
class OCRService {
  private getProvider() {
    const provider = providerRegistry.getPrimaryForCapability("ocr");
    if (!provider || !isOCRProvider(provider)) {
      throw new OCRError("No OCR provider available");
    }
    return provider;
  }

  /**
   * Extract trade data from a screenshot
   */
  async extractTradeData(
    imageUrl: string,
    options?: OCROptions & AIRequestOptions
  ): Promise<AIResponse<OCRResult>> {
    const provider = this.getProvider();
    return provider.extractTradeData(imageUrl, options);
  }

  /**
   * Simple text extraction from image
   */
  async extractText(imageUrl: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const provider = this.getProvider();
    return provider.extractText(imageUrl, options);
  }
}

class OCRError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OCRError";
  }
}

export const ocrService = new OCRService();
export { OCRService, OCRError };
