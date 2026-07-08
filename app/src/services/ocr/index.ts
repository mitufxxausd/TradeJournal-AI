/**
 * OCR Service Index
 * Centralized exports for OCR functionality.
 *
 * Architecture:
 *   OCR Provider (Tesseract) -> Raw Text -> Parser -> Trade Objects -> UI
 *
 * Future providers can implement the OCRProvider interface
 * and plug into the same parser layer.
 */

export {
  runOCR,
  extractTextFromImage,
  cancelOCR,
  getOCRLanguages,
  preloadTesseract,
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
} from "./types";

export {
  getConfidenceLevel,
  getConfidenceColor,
  CONFIDENCE_THRESHOLDS,
} from "./types";
