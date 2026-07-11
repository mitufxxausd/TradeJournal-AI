/**
 * Stub Vision Provider Implementations
 *
 * Placeholder implementations for vision providers that are not yet fully implemented.
 * These stubs maintain the provider registry structure while the actual implementations
 * are being developed.
 */

import type {
  VisionProvider,
  VisionProviderConfig,
  VisionFeatureFlags,
} from "../types/VisionProvider";
import { DEFAULT_VISION_FEATURE_FLAGS } from "../types/VisionProvider";

/**
 * Base stub class with common functionality
 */
abstract class BaseStubVisionProvider implements VisionProvider {
  abstract readonly providerId: string;
  abstract readonly name: string;

  protected config: VisionProviderConfig;

  constructor(config?: Partial<VisionProviderConfig>) {
    this.config = {
      providerId: this.providerId,
      name: this.name,
      enabled: false,
      priority: 99,
      timeoutMs: 30000,
      features: { ...DEFAULT_VISION_FEATURE_FLAGS },
      ...config,
    };
  }

  /**
   * Stubs are never available until properly implemented.
   * Override this in the actual implementation.
   */
  async isAvailable(): Promise<boolean> {
    return false;
  }

  /**
   * Stub analyze - throws error directing to use the actual implementation
   */
  async analyze(_imageData: string | Buffer): Promise<{
    text: string;
    confidence: number;
    boundingBoxes?: Array<{
      text: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
  }> {
    throw new Error(
      `${this.name} vision provider is not yet implemented. ` +
        "Please use the OCR pipeline instead for text extraction."
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): VisionProviderConfig {
    return { ...this.config };
  }

  /**
   * Get supported features (all disabled for stubs)
   */
  getSupportedFeatures(): VisionFeatureFlags {
    return { ...DEFAULT_VISION_FEATURE_FLAGS };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VisionProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get provider status
   */
  async getStatus(): Promise<{
    available: boolean;
    message: string;
    config: VisionProviderConfig;
  }> {
    return {
      available: false,
      message: `${this.name} is a stub implementation. Not yet available.`,
      config: this.getConfig(),
    };
  }
}

/**
 * Google Cloud Vision stub
 */
export class GoogleCloudVisionProvider extends BaseStubVisionProvider {
  readonly providerId = "google-cloud-vision";
  readonly name = "Google Cloud Vision";
}

/**
 * Azure Computer Vision stub
 */
export class AzureComputerVisionProvider extends BaseStubVisionProvider {
  readonly providerId = "azure-computer-vision";
  readonly name = "Azure Computer Vision";
}

/**
 * AWS Textract stub
 */
export class AWSTextractProvider extends BaseStubVisionProvider {
  readonly providerId = "aws-textract";
  readonly name = "AWS Textract";
}

/**
 * Tesseract Vision stub (for future native integration)
 */
export class TesseractVisionProvider extends BaseStubVisionProvider {
  readonly providerId = "tesseract-vision";
  readonly name = "Tesseract Vision";
}

/**
 * OpenAI Vision stub (for future GPT-4V integration)
 */
export class OpenAIVisionProvider extends BaseStubVisionProvider {
  readonly providerId = "openai-vision";
  readonly name = "OpenAI Vision";
}

/**
 * Factory function to create the appropriate stub provider
 */
export function createStubVisionProvider(
  providerId: string,
  config?: Partial<VisionProviderConfig>
): VisionProvider {
  switch (providerId) {
    case "google-cloud-vision":
      return new GoogleCloudVisionProvider(config);
    case "azure-computer-vision":
      return new AzureComputerVisionProvider(config);
    case "aws-textract":
      return new AWSTextractProvider(config);
    case "tesseract-vision":
      return new TesseractVisionProvider(config);
    case "openai-vision":
      return new OpenAIVisionProvider(config);
    default:
      throw new Error(`Unknown vision provider: ${providerId}`);
  }
}
