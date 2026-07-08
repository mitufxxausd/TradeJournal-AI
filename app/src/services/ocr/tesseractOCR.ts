/**
 * Tesseract OCR Provider
 * Implements the OCRProvider interface using Tesseract.js.
 * Supports lazy loading of the Tesseract engine for better performance.
 */

import type { OCROptions, OCRResult } from "./types";
import { parseOCRText, cleanOCRText } from "./parser";

// ─── Lazy-loaded Tesseract module ───

let TesseractModule: typeof import("tesseract.js") | null = null;
let tesseractLoadPromise: Promise<typeof import("tesseract.js")> | null = null;

/**
 * Lazy load Tesseract.js only when needed.
 * Prevents unnecessary bundle loading on app startup.
 */
async function getTesseract(): Promise<typeof import("tesseract.js")> {
  if (TesseractModule) {
    return TesseractModule;
  }

  if (tesseractLoadPromise) {
    return tesseractLoadPromise;
  }

  tesseractLoadPromise = import("tesseract.js").then((mod) => {
    TesseractModule = mod;
    return mod;
  });

  return tesseractLoadPromise;
}

/**
 * Preload Tesseract.js in the background.
 * Call this when navigating to the screenshot analysis page.
 */
export function preloadTesseract(): void {
  if (!TesseractModule && !tesseractLoadPromise) {
    tesseractLoadPromise = import("tesseract.js").then((mod) => {
      TesseractModule = mod;
      return mod;
    });
  }
}

// ─── Image Preprocessing ───

interface PreprocessResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Compress and preprocess image before OCR for better accuracy.
 * Applies contrast enhancement for dark mode screenshots.
 */
async function preprocessImage(
  imageFile: File,
  quality: "low" | "medium" | "high" = "medium"
): Promise<PreprocessResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const maxDimensions: Record<string, number> = {
        low: 800,
        medium: 1200,
        high: 1600,
      };

      const maxDim = maxDimensions[quality] || 1200;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        // Fallback: use original file as data URL
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            dataUrl: reader.result as string,
            width: img.width,
            height: img.height,
          });
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
        return;
      }

      // White background for better OCR on dark screenshots
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Apply subtle contrast enhancement
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Increase contrast slightly
        const factor = 1.1;
        data[i] = Math.min(255, ((data[i] - 128) * factor + 128));
        data[i + 1] = Math.min(255, ((data[i + 1] - 128) * factor + 128));
        data[i + 2] = Math.min(255, ((data[i + 2] - 128) * factor + 128));
      }
      ctx.putImageData(imageData, 0, 0);

      resolve({
        dataUrl: canvas.toDataURL("image/jpeg", 0.92),
        width,
        height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

// ─── Text Extraction ───

/**
 * Extract raw text from an image using Tesseract.js.
 * This is the low-level OCR function that just returns text.
 */
export async function extractTextFromImage(
  imageFile: File,
  options: OCROptions = {}
): Promise<{
  text: string;
  confidence: number;
  processingTimeMs: number;
}> {
  const { language = "eng", imageQuality = "medium", onProgress } = options;
  const startTime = Date.now();

  try {
    // Lazy load Tesseract
    const Tesseract = await getTesseract();

    // Preprocess image
    const { dataUrl } = await preprocessImage(imageFile, imageQuality);

    // Run OCR
    const result = await Tesseract.recognize(dataUrl, language, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const processingTimeMs = Date.now() - startTime;

    // Clean the OCR text
    const cleanedText = cleanOCRText(result.data.text);

    return {
      text: cleanedText,
      confidence: result.data.confidence,
      processingTimeMs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR failed";
    throw new Error(`OCR extraction failed: ${message}`);
  }
}

// ─── Main OCR Function ───

/**
 * Run full OCR and trade extraction on an image.
 * Uses the intelligent parser layer for trade data extraction.
 */
export async function runOCR(
  imageFile: File,
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    // Step 1: Extract raw text using Tesseract
    const { text, confidence: ocrConfidence } = await extractTextFromImage(
      imageFile,
      options
    );

    if (!text || text.trim().length === 0) {
      return {
        rawText: "",
        trades: [],
        detectedPrices: [],
        detectedOrderTypes: [],
        overallConfidence: 0,
        confidenceLevel: "low",
        processingTimeMs: Date.now() - startTime,
        error: "No text detected in image",
      };
    }

    // Step 2: Parse the text using the intelligent parser
    const parseResult = parseOCRText(text, ocrConfidence);

    return {
      ...parseResult,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OCR error";
    return {
      rawText: "",
      trades: [],
      detectedPrices: [],
      detectedOrderTypes: [],
      overallConfidence: 0,
      confidenceLevel: "low",
      processingTimeMs: Date.now() - startTime,
      error: message,
    };
  }
}

// ─── Utility Functions ───

/**
 * Cancel ongoing OCR processing.
 * Note: Tesseract.js doesn't fully support cancellation,
 * so this is a best-effort implementation.
 */
export function cancelOCR(): void {
  // Tesseract.js worker termination happens automatically
  // Future: implement AbortController for true cancellation
}

/**
 * Get list of available OCR languages.
 */
export function getOCRLanguages(): { code: string; name: string }[] {
  return [
    { code: "eng", name: "English" },
    { code: "deu", name: "German" },
    { code: "fra", name: "French" },
    { code: "spa", name: "Spanish" },
    { code: "ita", name: "Italian" },
    { code: "por", name: "Portuguese" },
    { code: "rus", name: "Russian" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "chi_tra", name: "Chinese (Traditional)" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
    { code: "ara", name: "Arabic" },
    { code: "tur", name: "Turkish" },
    { code: "nld", name: "Dutch" },
    { code: "pol", name: "Polish" },
  ];
}
