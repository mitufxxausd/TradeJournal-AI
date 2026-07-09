/**
 * OCR Service Index
 * Centralized exports for OCR functionality.
 *
 * Architecture:
 *   OCR Provider (Tesseract) → Raw Text → Parser → Trade Objects → UI
 *
 * Each layer is independent:
 * - OCR Provider: Only extracts text from images
 * - Parser: Only converts text to structured data
 * - Trade Extractor: Only filters and validates trade fields
 * - UI: Only displays data, never invents it
 *
 * Future providers can implement the OCRProvider or VisionProvider interface
 * and plug into the same parser layer.
 */

export {
  runOCR,
  extractTextFromImage,
  cancelOCR,
  getOCRLanguages,
  preloadTesseract,
  getOCRProvider,
} from "./tesseractOCR";

export {
  parseOCRText,
  cleanOCRText,
} from "./parser";

export type {
  OCRTrade,
  OCROptions,
  OCRResult,
  DetectedPrice,
  FieldConfidences,
  OCRProvider,
  OCRParser,
  VisionProvider,
  OCRQualityMetrics,
  ExtractedFieldStatus,
  TradeField,
} from "./types";

export {
  getConfidenceLevel,
  getConfidenceColor,
  CONFIDENCE_THRESHOLDS,
  SYMBOL_ALIASES,
  VALID_TRADING_PAIRS,
} from "./types";
