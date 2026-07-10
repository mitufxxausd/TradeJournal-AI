/**
 * Intelligent Symbol Detection
 * Enhanced symbol detection with prioritized source order.
 *
 * Priority order:
 *  1. Window title
 *  2. Chart title
 *  3. Broker title
 *  4. TradingView header
 *  5. MT5 header
 *  6. Position panel
 *  7. OCR fallback
 *
 * Never uses:
 *  - Chart price scale
 *  - Indicator names
 *  - Volume values
 *  - FPS/zoom values
 *  - Watermarks
 */

import type { DetectedImageRegion, DetectedSymbolResult, FieldSource } from "./pipeline";
import {
  detectSymbol,
  detectSymbolFromSources,
  normalizeSymbol,
} from "@/services/ocr/symbolDetector";
import type { SymbolDetectionResult, SymbolSource } from "@/services/ocr/symbolDetector";

// ─── Symbol Source Priority ───

interface SymbolSourceConfig {
  source: FieldSource;
  priority: number;
  description: string;
  regionTypes: string[];
}

const SYMBOL_SOURCE_PRIORITY: SymbolSourceConfig[] = [
  { source: "window_title", priority: 1, description: "Window title", regionTypes: ["window_title"] },
  { source: "chart_title", priority: 2, description: "Chart title", regionTypes: ["chart"] },
  { source: "broker_title", priority: 3, description: "Broker header/title", regionTypes: ["broker_header"] },
  { source: "tradingview_header", priority: 4, description: "TradingView header bar", regionTypes: ["toolbar"] },
  { source: "mt5_header", priority: 5, description: "MetaTrader 5 header", regionTypes: ["menu_bar", "toolbar"] },
  { source: "position_panel", priority: 6, description: "Position/order panel", regionTypes: ["position_panel", "order_panel"] },
  { source: "ocr_explicit_label", priority: 7, description: "OCR text with explicit label", regionTypes: [] },
  { source: "ocr_context", priority: 8, description: "OCR text (fallback)", regionTypes: [] },
];

// ─── Ignored Patterns ───

/** Patterns that should NEVER be considered as symbols */
const IGNORED_SYMBOL_PATTERNS = [
  // Price scale numbers
  /^\d+\.\d{2}$/, // 1.23 (2 decimals - likely price scale)
  /^\d{1,2}:\d{2}$/, // Time format
  /^\d{4}\.\d{4}$/, // 4.4 decimal pattern (price scale)
  // Indicator names
  /^RSI$/i, /^MACD$/i, /^EMA\d*$/i, /^SMA\d*$/i, /^WMA$/i,
  /^BOLLINGER$/i, /^ATR$/i, /^ADX$/i, /^CCI$/i, /^STOCHASTIC$/i,
  /^MFI$/i, /^OBV$/i, /^VWAP$/i, /^ICHIMOKU$/i, /^FIBONACCI$/i,
  // Volume
  /^VOL$/i, /^VOLUME$/i,
  // UI elements
  /^FPS$/i, /^ZOOM$/i, /^OHLC$/i, /^HLC$/i,
  // Watermarks
  /^TRADINGVIEW$/i, /^METAQUOTES$/i, /^FOREX\.COM$/i,
  // Single numbers
  /^\d+$/, /^\d+\.\d+$/,
  // Generic words
  /^GOLD$/i, /^SILVER$/i, /^OIL$/i, /^BTC$/i, /^ETH$/i,
];

/**
 * Check if a matched text should be ignored as a symbol source.
 */
function shouldIgnoreMatch(matchedText: string): boolean {
  if (!matchedText || matchedText.trim().length === 0) return true;
  const trimmed = matchedText.trim();

  for (const pattern of IGNORED_SYMBOL_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

// ─── Main Symbol Detection with Regions ───

/**
 * Detect symbol using regions and priority order.
 * Returns the highest-confidence symbol from the highest-priority source.
 */
export function detectSymbolWithRegions(
  regions: DetectedImageRegion[],
  ocrText: string
): DetectedSymbolResult {
  const startTime = Date.now();

  // Group regions by their source priority
  const results: Array<{
    result: SymbolDetectionResult;
    source: FieldSource;
    priority: number;
    regionType: string;
  }> = [];

  for (const sourceConfig of SYMBOL_SOURCE_PRIORITY) {
    // Get text from relevant regions
    const relevantRegions = regions.filter((r) =>
      sourceConfig.regionTypes.includes(r.type)
    );

    const textToSearch = relevantRegions.length > 0
      ? relevantRegions.map((r) => r.extractedText || "").join("\n")
      : sourceConfig.priority >= 7 ? ocrText : ""; // OCR fallback only for lowest priorities

    if (!textToSearch || textToSearch.trim().length === 0) continue;

    const detectionResult = detectSymbol(textToSearch);

    if (detectionResult.confidence > 0 && !shouldIgnoreMatch(detectionResult.matchedText)) {
      results.push({
        result: detectionResult,
        source: sourceConfig.source,
        priority: sourceConfig.priority,
        regionType: sourceConfig.regionTypes[0] || "ocr",
      });

      // Early exit for very high confidence results from high-priority sources
      if (sourceConfig.priority <= 3 && detectionResult.confidence >= 0.9) {
        break;
      }
    }
  }

  // Also try direct OCR text for remaining priorities
  if (results.length === 0 && ocrText) {
    const fallbackResult = detectSymbol(ocrText);
    if (fallbackResult.confidence > 0 && !shouldIgnoreMatch(fallbackResult.matchedText)) {
      results.push({
        result: fallbackResult,
        source: "ocr_context",
        priority: 8,
        regionType: "ocr",
      });
    }
  }

  if (results.length === 0) {
    return {
      symbol: "",
      confidence: 0,
      source: "none",
      priority: 99,
      matchedText: "",
    };
  }

  // Sort by priority first, then by confidence
  results.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.result.confidence - a.result.confidence;
  });

  const best = results[0];

  return {
    symbol: normalizeSymbol(best.result.symbol),
    confidence: best.result.confidence,
    source: best.source,
    priority: best.priority,
    matchedText: best.result.matchedText,
  };
}

// ─── Multi-Source Symbol Detection (Enhanced) ───

/**
 * Enhanced multi-source symbol detection with region awareness.
 * Maps legacy source names to the new FieldSource system.
 */
export function detectSymbolFromSourcesWithRegions(
  sources: Record<string, string | null>,
  regions?: DetectedImageRegion[]
): DetectedSymbolResult {
  // Map legacy source keys to prioritized sources
  const sourcePriorityMap: Record<string, FieldSource> = {
    windowTitle: "window_title",
    chartTitle: "chart_title",
    brokerTitle: "broker_title",
    watchlist: "ocr_context",
    marketPanel: "position_panel",
    ocrText: "ocr_context",
  };

  const results: Array<{
    result: SymbolDetectionResult;
    source: FieldSource;
    priority: number;
    matchedText: string;
  }> = [];

  for (const [sourceKey, text] of Object.entries(sources)) {
    if (!text || text.trim().length === 0) continue;

    const detectionResult = detectSymbol(text);
    if (detectionResult.confidence > 0 && !shouldIgnoreMatch(detectionResult.matchedText)) {
      const mappedSource = sourcePriorityMap[sourceKey] || "ocr_context";
      const priorityConfig = SYMBOL_SOURCE_PRIORITY.find((s) => s.source === mappedSource);
      const priority = priorityConfig?.priority || 8;

      results.push({
        result: detectionResult,
        source: mappedSource,
        priority,
        matchedText: detectionResult.matchedText,
      });
    }
  }

  // Also check regions if provided
  if (regions && regions.length > 0) {
    const regionResult = detectSymbolWithRegions(regions, "");
    if (regionResult.confidence > 0) {
      results.push({
        result: {
          symbol: regionResult.symbol,
          confidence: regionResult.confidence,
          source: "alias" as SymbolSource,
          matchedText: regionResult.matchedText,
        },
        source: regionResult.source,
        priority: regionResult.priority,
        matchedText: regionResult.matchedText,
      });
    }
  }

  if (results.length === 0) {
    return {
      symbol: "",
      confidence: 0,
      source: "none",
      priority: 99,
      matchedText: "",
    };
  }

  // Sort by priority, then confidence
  results.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.result.confidence - a.result.confidence;
  });

  const best = results[0];

  return {
    symbol: normalizeSymbol(best.result.symbol),
    confidence: best.result.confidence,
    source: best.source,
    priority: best.priority,
    matchedText: best.matchedText,
  };
}

// ─── Symbol Validation ───

/**
 * Validate that a detected symbol is legitimate.
 */
export function isValidSymbol(symbol: string): boolean {
  if (!symbol || symbol.trim().length === 0) return false;
  if (symbol.length < 4) return false; // Minimum forex pair length
  return true;
}

/**
 * Get the display name for a symbol source.
 */
export function getSymbolSourceDisplay(source: FieldSource): string {
  const config = SYMBOL_SOURCE_PRIORITY.find((s) => s.source === source);
  return config?.description || source;
}

/**
 * Get all symbol sources sorted by priority.
 */
export function getSymbolSourcePriorityList(): SymbolSourceConfig[] {
  return [...SYMBOL_SOURCE_PRIORITY];
}
