export { runOCR, cancelOCR, preloadTesseract, runMultiPassOCR } from "./tesseractOCR";

export type { OCROptions, PreprocessOptions } from "./tesseractOCR";

export type {
  OCRResult,
  OCRTrade,
  OCRQualityMetrics,
  DetectedPrice,
  DetectedOrderType,
  ParsedFields,
} from "./types";

// Runtime values (constants + functions) — must NOT be type-only
export {
  CONFIDENCE_THRESHOLDS,
  getConfidenceLevel,
  getConfidenceColor,
  SYMBOL_ALIASES,
  VALID_TRADING_PAIRS,
} from "./types";
