/**
 * OCR Service Index
 * Centralized exports for OCR functionality
 */

export {
  runOCR,
  extractTextFromImage,
  cancelOCR,
  getOCRLanguages,
} from "./tesseractOCR";

export type {
  OCRTrade,
  OCROptions,
  OCRResult,
} from "./tesseractOCR";
