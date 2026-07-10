/**
 * Tesseract OCR Integration
 * Phase 7C Enhanced: Multi-pass OCR with advanced preprocessing
 *
 * Pipeline:
 *   Image → Enhanced Preprocessing → Multi-Pass OCR →
 *   Text Merge → Parser → Trade Extraction → Validation
 */

import type { OCRResult, OCRTrade, OCRQualityMetrics } from "./types";
import { parseOCRText } from "./parser";

// ─── Tesseract Lazy Loading ───

let tesseractPromise: Promise<typeof import("tesseract.js")> | null = null;

function getTesseract(): Promise<typeof import("tesseract.js")> {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js").then((m) => m);
  }
  return tesseractPromise;
}

export async function preloadTesseract(): Promise<void> {
  await getTesseract();
}

let isCancelled = false;

export function cancelOCR(): void {
  isCancelled = true;
}

// ─── Options ───

export interface OCROptions {
  language?: string;
  imageQuality?: "low" | "medium" | "high";
  onProgress?: (progress: number) => void;
}

export interface PreprocessOptions {
  quality?: "low" | "medium" | "high";
  upscale?: number;
  contrast?: number;
  adaptiveThreshold?: boolean;
  grayscale?: boolean;
  denoise?: boolean;
  sharpen?: boolean;
  jpegQuality?: number;
}

// ─── Image Preprocessing ───

interface PreprocessResult {
  dataUrl: string;
  width: number;
  height: number;
}

async function preprocessImage(imageFile: File, options: PreprocessOptions = {}): Promise<PreprocessResult> {
  const {
    quality = "medium", upscale = 2, contrast = 1.3,
    adaptiveThreshold = true, grayscale = true, denoise = true, sharpen = true, jpegQuality = 0.95,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const maxDimensions: Record<string, number> = { low: 800, medium: 1200, high: 2000 };
      const maxDim = maxDimensions[quality] || 1200;
      let { width, height } = img;

      const isSmall = width < 600 || height < 400;
      if (isSmall && upscale > 1) {
        width = Math.round(width * upscale);
        height = Math.round(height * upscale);
      }

      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, width: img.width, height: img.height });
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
        return;
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let imageData = ctx.getImageData(0, 0, width, height);
      let data = imageData.data;

      if (grayscale) {
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
        }
      }

      if (contrast > 1.0) {
        const factor = contrast;
        const intercept = 128 * (1 - factor);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept));
          data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept));
          data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept));
        }
      }

      if (adaptiveThreshold) applyAdaptiveThreshold(data, width, height);
      if (denoise) applyDenoise(data, width, height);
      if (sharpen) applySharpen(data, width, height);

      ctx.putImageData(imageData, 0, 0);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", jpegQuality), width, height });
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

function buildIntegralImage(gray: Uint8Array, width: number, height: number): Uint32Array {
  const integral = new Uint32Array(width * height);
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[y * width + x] = rowSum + (y > 0 ? integral[(y - 1) * width + x] : 0);
    }
  }
  return integral;
}

function applyAdaptiveThreshold(data: Uint8ClampedArray, width: number, height: number): void {
  const blockSize = 15, c = 10;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) gray[i] = data[i * 4];

  const integralImage = buildIntegralImage(gray, width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - blockSize), y1 = Math.max(0, y - blockSize);
      const x2 = Math.min(width - 1, x + blockSize), y2 = Math.min(height - 1, y + blockSize);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      const a = y1 > 0 && x1 > 0 ? integralImage[(y1 - 1) * width + (x1 - 1)] : 0;
      const b = y1 > 0 ? integralImage[(y1 - 1) * width + x2] : 0;
      const c1 = x1 > 0 ? integralImage[y2 * width + (x1 - 1)] : 0;
      const d = integralImage[y2 * width + x2];
      const sum = d + a - b - c1;
      const mean = sum / count;

      const idx = (y * width + x) * 4;
      const val = gray[y * width + x] > mean - c ? 255 : 0;
      data[idx] = val; data[idx + 1] = val; data[idx + 2] = val;
    }
  }
}

function applyDenoise(data: Uint8ClampedArray, width: number, height: number): void {
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const neighbors: number[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          neighbors.push(copy[((y + dy) * width + (x + dx)) * 4]);
        }
      }
      neighbors.sort((a, b) => a - b);
      const idx = (y * width + x) * 4;
      const blended = Math.round(0.7 * copy[idx] + 0.3 * neighbors[4]);
      data[idx] = blended; data[idx + 1] = blended; data[idx + 2] = blended;
    }
  }
}

function applySharpen(data: Uint8ClampedArray, width: number, height: number): void {
  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = copy[idx];
      const top = copy[((y - 1) * width + x) * 4];
      const bottom = copy[((y + 1) * width + x) * 4];
      const left = copy[(y * width + (x - 1)) * 4];
      const right = copy[(y * width + (x + 1)) * 4];
      const sharpened = 5 * center - top - bottom - left - right;
      const clamped = Math.min(255, Math.max(0, sharpened));
      const blended = Math.round(0.6 * center + 0.4 * clamped);
      data[idx] = blended; data[idx + 1] = blended; data[idx + 2] = blended;
    }
  }
}

// ─── Tesseract OCR ───

export async function extractTextFromImage(imageFile: File, options: OCROptions = {}): Promise<{ text: string; confidence: number; processingTimeMs: number }> {
  const { language = "eng", imageQuality = "medium", onProgress } = options;
  const startTime = Date.now();
  const Tesseract = await getTesseract();

  const preprocessOpts: PreprocessOptions = {
    quality: imageQuality, upscale: 2, contrast: 1.3,
    adaptiveThreshold: true, grayscale: true, denoise: true, sharpen: true, jpegQuality: 0.95,
  };

  const { dataUrl } = await preprocessImage(imageFile, preprocessOpts);

  const result = await Tesseract.recognize(dataUrl, language, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text" && onProgress) onProgress(Math.round(m.progress * 100));
    },
  });

  const processingTimeMs = Date.now() - startTime;
  const cleanedText = cleanOCRText(result.data.text);

  return { text: cleanedText, confidence: result.data.confidence, processingTimeMs };
}

/**
 * Multi-pass OCR with different preprocessing configurations.
 * Runs OCR 3 times with varied settings and returns the best result.
 */
export async function runMultiPassOCR(imageFile: File, options: OCROptions = {}): Promise<{ text: string; confidence: number; processingTimeMs: number }> {
  const startTime = Date.now();

  const passes: PreprocessOptions[] = [
    { quality: "high", upscale: 2, contrast: 1.3, adaptiveThreshold: true, grayscale: true, denoise: true, sharpen: true, jpegQuality: 0.95 },
    { quality: "high", upscale: 2, contrast: 1.6, adaptiveThreshold: true, grayscale: true, denoise: false, sharpen: true, jpegQuality: 0.95 },
    { quality: "high", upscale: 2, contrast: 1.2, adaptiveThreshold: false, grayscale: true, denoise: true, sharpen: false, jpegQuality: 0.98 },
  ];

  const Tesseract = await getTesseract();
  const results: Array<{ text: string; confidence: number; len: number }> = [];

  for (let i = 0; i < passes.length; i++) {
    try {
      const { dataUrl } = await preprocessImage(imageFile, passes[i]);
      const result = await Tesseract.recognize(dataUrl, options.language || "eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text" && options.onProgress) {
            options.onProgress(Math.round(((i + m.progress) / passes.length) * 100));
          }
        },
      });
      const cleanedText = cleanOCRText(result.data.text);
      results.push({ text: cleanedText, confidence: result.data.confidence, len: cleanedText.length });
    } catch { /* continue to next pass */ }
  }

  if (results.length === 0) return { text: "", confidence: 0, processingTimeMs: Date.now() - startTime };

  const best = results.reduce((best, current) => {
    const bestScore = best.confidence * 0.6 + Math.min(best.len, 500) * 0.4;
    const currentScore = current.confidence * 0.6 + Math.min(current.len, 500) * 0.4;
    return currentScore > bestScore ? current : best;
  });

  const mergedText = mergeOCRResults(best, results);
  return { text: mergedText, confidence: best.confidence, processingTimeMs: Date.now() - startTime };
}

function mergeOCRResults(best: { text: string; confidence: number; len: number }, allResults: Array<{ text: string; confidence: number; len: number }>): string {
  if (allResults.length <= 1) return best.text;
  const lines = new Set(best.text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0));
  for (const result of allResults) {
    if (result === best) continue;
    const resultLines = result.text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    for (const line of resultLines) {
      if (!lines.has(line) && looksLikeTradeData(line)) lines.add(line);
    }
  }
  return Array.from(lines).join("\n");
}

function looksLikeTradeData(line: string): boolean {
  const tradeKeywords = /\b(buy|sell|long|short|entry|sl|tp|stop|loss|profit|lot|volume|price|@)\b/i;
  return tradeKeywords.test(line) && /\d/.test(line);
}

function cleanOCRText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Main OCR Runner ───

export async function runOCR(imageFile: File, options: OCROptions = {}): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const { text, confidence: ocrConfidence } = await runMultiPassOCR(imageFile, options);

    if (!text || text.trim().length === 0) {
      return {
        rawText: "", trades: [], detectedPrices: [], detectedOrderTypes: [],
        overallConfidence: 0, confidenceLevel: "low",
        processingTimeMs: Date.now() - startTime, error: "No text detected in image",
        qualityMetrics: { ocrQuality: Math.round(ocrConfidence), parserConfidence: 0, tradeCompleteness: 0, fieldsDetected: 0, totalFields: 6, detectedFields: [] },
      };
    }

    const parseResult = parseOCRText(text, ocrConfidence);
    return { ...parseResult, processingTimeMs: Date.now() - startTime };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OCR error";
    return {
      rawText: "", trades: [], detectedPrices: [], detectedOrderTypes: [],
      overallConfidence: 0, confidenceLevel: "low",
      processingTimeMs: Date.now() - startTime, error: message,
      qualityMetrics: { ocrQuality: 0, parserConfidence: 0, tradeCompleteness: 0, fieldsDetected: 0, totalFields: 6, detectedFields: [] },
    };
  }
}
