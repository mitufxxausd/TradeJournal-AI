/**
 * AI Vision Service Index
 * Centralized exports for AI Vision functionality.
 *
 * This module provides the architecture for future AI Vision providers.
 * Currently, all vision providers are stubs (no API keys required).
 *
 * The OCR pipeline (Tesseract + Parser) remains the primary
 * screenshot analysis method until a vision provider is configured.
 */

export type {
  VisionProvider,
  VisionRequestOptions,
  VisionAnalysisResult,
  VisionProviderConfig,
  VisionProviderRegistry,
} from "./types";

export {
  OpenAIVisionProvider,
  GeminiVisionProvider,
  ClaudeVisionProvider,
  OpenRouterVisionProvider,
  DefaultVisionRegistry,
  getVisionRegistry,
  resetVisionRegistry,
} from "./types";
