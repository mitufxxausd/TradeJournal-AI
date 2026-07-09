/**
 * OCR Module for TradeJournal AI
 * Exports all OCR-related functionality including the SymbolDetector.
 */

export { runOCR, cancelOCR, preloadTesseract } from "./tesseractOCR";

export type { OCROptions } from "./tesseractOCR";

export {
  parseOCRText,
  cleanOCRText,
} from "./parser";

export {
  detectSymbol,
  detectSymbolFromSources,
  normalizeSymbol,
} from "./symbolDetector";

export type {
  SymbolDetectionResult,
  SymbolSource,
} from "./symbolDetector";

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
