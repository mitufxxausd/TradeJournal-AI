/**
 * Enhanced OCR Processing
 * Normalizes OCR text, removes duplicates, merges split numbers,
 * and filters out non-trade elements.
 *
 * Filters out:
 *  - Price scale numbers
 *  - Axis labels
 *  - Indicator values
 *  - Volume data
 *  - FPS counter
 *  - Zoom values
 *  - Watermarks
 *  - Toolbar icons/labels
 */

import type { OCRResult } from "@/services/ocr/types";

// ─── Patterns to Ignore ───

/** Patterns that should be removed from OCR text */
const IGNORED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Price scale - sequential numbers
  { pattern: /\b\d{1,2}\.\d{4,5}\b(?=\s*\n\s*\d{1,2}\.\d{4,5})/g, reason: "price_scale" },

  // Time values
  { pattern: /\b\d{2}:\d{2}:\d{2}\b/g, reason: "time" },
  { pattern: /\b\d{2}:\d{2}\b/g, reason: "time" },

  // FPS counter
  { pattern: /\b\d+\s*FPS\b/gi, reason: "fps" },
  { pattern: /\bFPS\s*[:\s]*\s*\d+\b/gi, reason: "fps" },

  // Zoom indicators
  { pattern: /\b\d+%\s*zoom\b/gi, reason: "zoom" },
  { pattern: /\bzoom\s*[:\s]*\s*\d+%\b/gi, reason: "zoom" },

  // Watermarks
  { pattern: /\bTradingView\b/gi, reason: "watermark" },
  { pattern: /\bMetaQuotes\b/gi, reason: "watermark" },
  { pattern: /\bFxsprites\b/gi, reason: "watermark" },
  { pattern: /\bPowered by\b/gi, reason: "watermark" },

  // Toolbar items
  { pattern: /\b(Login|File|View|Insert|Charts|Tools|Window|Help|New|Open|Save)\b/g, reason: "toolbar" },
  { pattern: /\b(New Order|Modify|Delete|Close|Properties)\b/g, reason: "toolbar" },

  // Crosshair coordinates
  { pattern: /\bO\s*[HLC]\s*[:\s]*\s*\d+\.?\d*\b/gi, reason: "crosshair" },
  { pattern: /\b[ohlc]\s*=\s*\d+\.?\d*\b/gi, reason: "crosshair" },

  // Indicator values (format: "RSI 14: 65.43")
  { pattern: /\bRSI\s*\(?(?:14|12|21|9)\)?\s*[:\s]*\s*\d+\.?\d*\b/gi, reason: "indicator" },
  { pattern: /\bMACD\s*\(?[^)]*\)?\s*[:\s]*\s*[\d.-]+\b/gi, reason: "indicator" },
  { pattern: /\bEMA\s*\d+\s*[:\s]*\s*\d+\.?\d*\b/gi, reason: "indicator" },
  { pattern: /\bSMA\s*\d+\s*[:\s]*\s*\d+\.?\d*\b/gi, reason: "indicator" },

  // Volume
  { pattern: /\bVol(?:ume)?\s*[:\s]*\s*\d+(?:[KM]?)\b/gi, reason: "volume" },

  // Generic UI labels
  { pattern: /\b(Account\s*(History|Info)|Journal|Alerts|Mailbox|Market|Signals)\b/gi, reason: "ui_panel" },
  { pattern: /\b(Data\s*Window|Navigator|Terminal)\b/gi, reason: "ui_panel" },

  // Pinging/status
  { pattern: /\b(Pinging|Connecting|Reconnecting)\b/gi, reason: "status" },
  { pattern: /\b\d+\s*ms\b/g, reason: "ping" },
];

// ─── Text Normalization ───

/**
 * Normalize OCR text by:
 * 1. Removing ignored patterns
 * 2. Merging split numbers (e.g., "1. 2345" → "1.2345")
 * 3. Removing duplicate words
 * 4. Cleaning whitespace
 */
export function normalizeOCRText(rawText: string): string {
  if (!rawText || rawText.trim().length === 0) {
    return "";
  }

  let normalized = rawText;

  // Step 1: Remove ignored patterns
  for (const { pattern } of IGNORED_PATTERNS) {
    normalized = normalized.replace(pattern, "");
  }

  // Step 2: Merge split numbers
  normalized = mergeSplitNumbers(normalized);

  // Step 3: Remove duplicate words (consecutive same words)
  normalized = removeDuplicateWords(normalized);

  // Step 4: Remove duplicate lines
  normalized = removeDuplicateLines(normalized);

  // Step 5: Clean whitespace
  normalized = normalized
    .replace(/[ \t]+/g, " ")     // Multiple spaces → single space
    .replace(/\n{3,}/g, "\n\n")   // 3+ newlines → 2 newlines
    .trim();

  return normalized;
}

// ─── Split Number Merging ───

/**
 * Merge numbers that were split by OCR.
 * Examples:
 *   "1. 2345" → "1.2345"
 *   "123 . 45" → "123.45"
 *   "1 .2 3 4" → "1.234"
 */
function mergeSplitNumbers(text: string): string {
  // Pattern: digit(s) . space(s) digit(s) → digit(s).digit(s)
  let result = text.replace(/(\d)\s*\.\s+(\d)/g, "$1.$2");

  // Pattern: digit space comma space digit → digit,digit
  result = result.replace(/(\d)\s*,\s*(\d)/g, "$1,$2");

  // Pattern for OANDA-style split: "1. 234 56" → "1.23456"
  // Match sequences where we have a decimal point followed by spaced digits
  result = result.replace(/(\d+\.\d)\s+(\d)/g, "$1$2");

  // Handle cases like "1 . 2 3 4 5" (completely split decimal)
  result = result.replace(/(\d)\s+\.\s+(\d)\s+(\d)\s+(\d)\s+(\d)/g, "$1.$2$3$4$5");

  return result;
}

// ─── Duplicate Word Removal ───

/**
 * Remove consecutive duplicate words from text.
 * OCR sometimes produces "BUY BUY" or "1.2345 1.2345".
 */
function removeDuplicateWords(text: string): string {
  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    const words = line.split(/\s+/);
    const uniqueWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const current = words[i];
      const previous = uniqueWords[uniqueWords.length - 1];

      // Skip if same as previous (case-insensitive for text, sensitive for numbers)
      if (previous && current.toLowerCase() === previous.toLowerCase()) {
        continue;
      }

      uniqueWords.push(current);
    }

    return uniqueWords.join(" ");
  });

  return processedLines.join("\n");
}

// ─── Duplicate Line Removal ───

/**
 * Remove duplicate lines from OCR text.
 * OCR sometimes reads the same line twice.
 */
function removeDuplicateLines(text: string): string {
  const lines = text.split("\n");
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      unique.push("");
      continue;
    }

    const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");

    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(trimmed);
    }
  }

  return unique.join("\n");
}

// ─── OCR Text Filtering ───

/**
 * Filter out non-trade text from OCR output.
 * Returns only text that is relevant for trade extraction.
 */
export function filterTradeRelevantText(rawText: string): string {
  const lines = rawText.split("\n");
  const relevantLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Skip if line only contains ignored content
    if (isIgnoredLine(trimmed)) continue;

    // Skip if line looks like a price scale entry
    if (isPriceScaleLine(trimmed)) continue;

    // Skip if line looks like an axis label
    if (isAxisLabel(trimmed)) continue;

    // Skip pure indicator lines
    if (isIndicatorLine(trimmed)) continue;

    relevantLines.push(trimmed);
  }

  return relevantLines.join("\n");
}

// ─── Line Classification ───

function isIgnoredLine(line: string): boolean {
  const lower = line.toLowerCase();

  // Check against all ignored patterns
  for (const { pattern } of IGNORED_PATTERNS) {
    if (pattern.test(line)) return true;
  }

  return false;
}

function isPriceScaleLine(line: string): boolean {
  // Price scale lines are typically just numbers at regular intervals
  const trimmed = line.trim();

  // Just a number with 4-5 decimal places (likely price scale)
  if (/^\d+\.\d{4,5}$/.test(trimmed)) return true;

  // Just a number with no context
  if (/^\d+\.?\d*$/.test(trimmed) && trimmed.length < 10) {
    // Check if surrounded by similar numbers (would need more context)
    return true;
  }

  return false;
}

function isAxisLabel(line: string): boolean {
  // Date/time labels on x-axis
  if (/^\d{2}[\/\-.]\d{2}[\/\-.]\d{2,4}$/.test(line)) return true;
  if (/^\d{4}[\/\-.]\d{2}[\/\-.]\d{2}$/.test(line)) return true;
  if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$/i.test(line)) return true;

  return false;
}

function isIndicatorLine(line: string): boolean {
  const indicatorNames = [
    "RSI", "MACD", "EMA", "SMA", "WMA", "Bollinger", "ATR", "ADX",
    "CCI", "Stochastic", "MFI", "OBV", "VWAP", "Ichimoku", "Fibonacci",
    "Williams", "Momentum", "Volume", "RVI", "StdDev",
  ];

  const lower = line.toLowerCase();
  for (const name of indicatorNames) {
    if (lower.includes(name.toLowerCase())) {
      // Check if it's just the indicator value, not a trade field
      const tradeKeywords = ["sl", "tp", "stop", "profit", "entry", "lot", "buy", "sell"];
      const hasTradeKeyword = tradeKeywords.some((kw) => lower.includes(kw));
      if (!hasTradeKeyword) return true;
    }
  }

  return false;
}

// ─── Enhanced OCR Result Processing ───

/**
 * Process an OCR result through the enhanced pipeline.
 * Normalizes text, removes duplicates, filters non-trade content.
 */
export function processOCRResult(ocrResult: OCRResult): OCRResult {
  if (!ocrResult.rawText) return ocrResult;

  const normalizedText = normalizeOCRText(ocrResult.rawText);
  const filteredText = filterTradeRelevantText(normalizedText);

  return {
    ...ocrResult,
    rawText: filteredText || normalizedText, // Fallback to normalized if filtering removes everything
  };
}

// ─── OCR Text Statistics ───

export interface OCRTextStats {
  originalLength: number;
  normalizedLength: number;
  removedChars: number;
  duplicateWordsRemoved: number;
  duplicateLinesRemoved: number;
  ignoredPatternsFound: Array<{ pattern: string; count: number }>;
}

/**
 * Get statistics about OCR text processing.
 */
export function getOCRTextStats(originalText: string, normalizedText: string): OCRTextStats {
  const removedChars = originalText.length - normalizedText.length;

  // Count duplicate words removed
  const origWords = originalText.split(/\s+/).filter((w) => w.length > 0);
  const normWords = normalizedText.split(/\s+/).filter((w) => w.length > 0);
  const duplicateWordsRemoved = origWords.length - normWords.length;

  // Count duplicate lines removed
  const origLines = originalText.split("\n").filter((l) => l.trim().length > 0);
  const normLines = normalizedText.split("\n").filter((l) => l.trim().length > 0);
  const duplicateLinesRemoved = origLines.length - normLines.length;

  return {
    originalLength: originalText.length,
    normalizedLength: normalizedText.length,
    removedChars,
    duplicateWordsRemoved,
    duplicateLinesRemoved,
    ignoredPatternsFound: [],
  };
}
