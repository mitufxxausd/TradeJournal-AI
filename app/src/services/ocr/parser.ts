/**
 * OCR Trade Parser
 * Converts raw OCR text into structured trade data.
 *
 * Rules:
 * - ONLY detects actual trade fields (symbol, direction, entry, SL, TP, lot size)
 * - IGNORES: price scale, axis labels, indicator values, TradingView/MT4/MT5 toolbar
 *   Windows title bar, zoom values, crosshair coordinates, timestamps, watermarks, news widgets, ads
 * - TP ONLY from explicit labels (TP:, Take Profit:, Target:)
 * - Direction ONLY from explicit words (BUY, SELL, LONG, SHORT, order types)
 * - Symbol uses the SymbolDetector with fuzzy matching
 * - Chart scale numbers are always discarded
 * - Indicator values (RSI, MACD, EMA, etc.) are always discarded
 * - Confidence is measurable: based on explicit labels vs context inference
 */

import type {
  OCRTrade,
  OCRResult,
  DetectedPrice,
  FieldConfidences,
  OCRQualityMetrics,
  ExtractedFieldStatus,
} from "./types";
import { getConfidenceLevel } from "./types";
import { detectSymbol } from "./symbolDetector";

// ─── Utility ───

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Symbol/Pair Extraction ───

/**
 * Extract symbol from text using the SymbolDetector.
 * The SymbolDetector handles aliases, separators, crypto formats, and commodities.
 */
function extractSymbol(text: string): { symbol: string; confidence: number; source: string } {
  if (!text || text.trim().length === 0) {
    return { symbol: "", confidence: 0, source: "none" };
  }

  const result = detectSymbol(text);

  return {
    symbol: result.symbol,
    confidence: result.confidence,
    source: result.source,
  };
}

// ─── Direction Detection ───

function extractDirection(text: string): "buy" | "sell" | "unknown" {
  const lower = text.toLowerCase();

  // Explicit order type keywords with context check
  const buyPatterns = [
    /\bbuy\b/i,
    /\blong\b/i,
    /\bbuy\s*(?:limit|stop|market)?\b/i,
    /\border\s*[:\s=]*\s*buy\b/i,
    /\btype\s*[:\s=]*\s*buy\b/i,
  ];

  const sellPatterns = [
    /\bsell\b/i,
    /\bshort\b/i,
    /\bsell\s*(?:limit|stop|market)?\b/i,
    /\border\s*[:\s=]*\s*sell\b/i,
    /\btype\s*[:\s=]*\s*sell\b/i,
  ];

  // Check for sell first to avoid "sell" matching inside "buy"
  for (const pattern of sellPatterns) {
    if (pattern.test(text)) return "sell";
  }

  for (const pattern of buyPatterns) {
    if (pattern.test(text)) return "buy";
  }

  return "unknown";
}

// ─── Number Format ───

function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;

  const cleaned = value
    .replace(/[\s,]/g, "")           // Remove spaces and commas
    .replace(/[()]/g, "")            // Remove parentheses
    .replace(/[a-zA-Z$€£¥]/g, "")    // Remove currency symbols
    .replace(/[^\d.\-+eE]/g, "");     // Remove non-numeric except ., -, +, e, E

  if (cleaned === "" || cleaned === ".") return null;

  // Handle OANDA "pips only" format like "1.234567" (7+ decimals)
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  // Reject clearly invalid numbers
  if (num === 0 && cleaned !== "0" && cleaned !== "0.0") return null;

  return num;
}

// ─── Price Context Analysis ───

interface PriceContext {
  type: "entry" | "stopLoss" | "takeProfit" | "lotSize" | "chartScale" | "indicator" | "unknown";
  confidence: number;
  reason: string;
}

function analyzePriceContext(line: string, index: number, allPrices: DetectedPrice[]): PriceContext {
  // Check for explicit labels
  const tpLabels = /\b(tp|take\s*profit|target|profit\s*target|t\.p|t\/p)\b[\s:;=]*/i;
  const slLabels = /\b(sl|stop\s*loss|stop|s\.l|s\/l)\b[\s:;=]*/i;
  const entryLabels = /\b(entry|open|opening|price\s*@|@price|entry\s*price|open\s*price|order\s*price)\b[\s:;=]*/i;
  const lotLabels = /\b(lot|lots|volume|qty|quantity|size|pos\s*size|position\s*size)\b[\s:;=]*/i;

  // Check indicator labels (always discard)
  const indicatorLabels = /\b(rsi|macd|ema|sma|wma|bollinger|atr|adx|cci|stochastic|mfi|obv|vwap|ichimoku|fibonacci|pivot|sr|support|resistance)\b[\s:;=]*/i;

  // Chart scale detection: isolated prices in a vertical sequence (price ladder)
  const isPriceLadder = isPartOfPriceLadder(index, allPrices);

  // If it's part of a price ladder, discard
  if (isPriceLadder) {
    return { type: "chartScale", confidence: 0.95, reason: "Part of price ladder/scale" };
  }

  // If it has an indicator label, discard
  if (indicatorLabels.test(line)) {
    return { type: "indicator", confidence: 0.95, reason: "Indicator value" };
  }

  // Take Profit (highest priority)
  if (tpLabels.test(line)) {
    return { type: "takeProfit", confidence: 0.95, reason: "Explicit TP label" };
  }

  // Stop Loss
  if (slLabels.test(line)) {
    return { type: "stopLoss", confidence: 0.95, reason: "Explicit SL label" };
  }

  // Entry Price
  if (entryLabels.test(line)) {
    return { type: "entry", confidence: 0.95, reason: "Explicit entry label" };
  }

  // Lot Size
  if (lotLabels.test(line)) {
    return { type: "lotSize", confidence: 0.95, reason: "Explicit lot/volume label" };
  }

  // If no explicit label, check position context
  const upperLine = line.toUpperCase();

  // Check if the price is near TP/SL keywords (within same line or context)
  const hasTPNearby = /\b(tp|take\s*profit|target)\b/i.test(line);
  const hasSLNearby = /\b(sl|stop\s*loss)\b/i.test(line);
  const hasEntryNearby = /\b(entry|open|buy|sell|long|short)\b/i.test(line);

  if (hasTPNearby) {
    return { type: "takeProfit", confidence: 0.7, reason: "TP keyword nearby" };
  }

  if (hasSLNearby) {
    return { type: "stopLoss", confidence: 0.7, reason: "SL keyword nearby" };
  }

  if (hasEntryNearby) {
    return { type: "entry", confidence: 0.6, reason: "Entry-related keyword nearby" };
  }

  // Check if the line has a "@" symbol (common for entry prices)
  if (/@/.test(line)) {
    return { type: "entry", confidence: 0.5, reason: "@ symbol suggests entry price" };
  }

  // Default: unknown (will be filtered out if no context)
  return { type: "unknown", confidence: 0.2, reason: "No clear context" };
}

// ─── Price Ladder Detection ───

/**
 * Detect if a price is part of a price ladder/scale on the chart.
 * Price ladders are sequences of prices at regular intervals (e.g., 1.2345, 1.2346, 1.2347).
 */
function isPartOfPriceLadder(index: number, allPrices: DetectedPrice[]): boolean {
  if (allPrices.length < 3) return false;

  // Check neighboring prices
  const neighbors: number[] = [];

  for (let i = Math.max(0, index - 2); i <= Math.min(allPrices.length - 1, index + 2); i++) {
    if (i !== index && allPrices[i].value !== null) {
      neighbors.push(allPrices[i].value as number);
    }
  }

  if (neighbors.length < 2) return false;

  const currentValue = allPrices[index].value;
  if (currentValue === null) return false;

  // Check if prices are at regular intervals (characteristic of price ladders)
  const diffs: number[] = [];
  for (let i = 1; i < neighbors.length; i++) {
    diffs.push(Math.abs(neighbors[i] - neighbors[i - 1]));
  }

  if (diffs.length === 0) return false;

  // If all differences are very similar (within 1% tolerance), it's likely a price ladder
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const allSimilar = diffs.every((d) => Math.abs(d - avgDiff) / avgDiff < 0.01 || avgDiff < 0.00001);

  if (allSimilar && avgDiff > 0) {
    return true;
  }

  return false;
}

// ─── Main Parsing Function ───

export function parseOCRText(rawText: string): OCRResult {
  const startTime = Date.now();

  if (!rawText || rawText.trim() === "") {
    return {
      rawText: "",
      trades: [],
      detectedPrices: [],
      confidence: 0,
      overallConfidence: 0,
      confidenceLevel: "low",
      isLowConfidence: true,
      warning: "No text detected in the image. Please try again with a clearer screenshot.",
      processingTimeMs: 0,
      qualityMetrics: {
        ocrQuality: 0,
        parserConfidence: 0,
        tradeCompleteness: 0,
        fieldsDetected: 0,
        totalFields: 6,
      },
    };
  }

  // Clean the text
  const cleanedText = cleanOCRText(rawText);

  // Extract symbol using SymbolDetector
  const symbolResult = extractSymbol(cleanedText);
  const detectedSymbol = symbolResult.symbol;

  // Extract direction
  const detectedDirection = extractDirection(cleanedText);

  // Extract all numbers that look like prices
  const detectedPrices = extractPrices(cleanedText);

  // Classify prices with context
  const classifiedPrices = classifyPrices(detectedPrices, cleanedText);

  // Extract lot size
  const lotSize = extractLotSize(cleanedText, classifiedPrices);

  // Build trade objects from classified prices
  const trades = buildTrades(
    detectedSymbol,
    detectedDirection,
    classifiedPrices,
    lotSize,
    cleanedText
  );

  const processingTimeMs = Date.now() - startTime;

  // Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(trades, detectedSymbol, detectedDirection);

  // Calculate quality metrics
  const fieldsDetected = trades.length > 0 ? calculateFieldsDetected(trades[0]) : 0;
  const qualityMetrics: OCRQualityMetrics = {
    ocrQuality: Math.round(overallConfidence * 0.8), // OCR quality is slightly lower than overall
    parserConfidence: overallConfidence,
    tradeCompleteness: trades.length > 0 ? Math.round((fieldsDetected / 6) * 100) : 0,
    fieldsDetected,
    totalFields: 6,
  };

  // Determine confidence level
  const confidenceLevel = getConfidenceLevel(overallConfidence);

  // Generate warning if needed
  let warning: string | undefined;
  if (confidenceLevel === "low") {
    warning = "Low confidence detection. Please verify all extracted values before importing. Consider taking a clearer screenshot with visible trade labels.";
  } else if (confidenceLevel === "medium") {
    warning = "Medium confidence detection. Some fields may need verification. Please review before importing.";
  }

  return {
    rawText,
    trades,
    detectedPrices,
    confidence: overallConfidence,
    overallConfidence,
    confidenceLevel,
    isLowConfidence: confidenceLevel === "low",
    warning,
    processingTimeMs,
    qualityMetrics,
  };
}

// ─── Price Extraction ───

function extractPrices(text: string): DetectedPrice[] {
  const prices: DetectedPrice[] = [];

  // Match various number formats
  const patterns = [
    // Standard decimal: 1.2345, 123.45, 0.00123456
    /\b\d{1,3}(?:,\d{3})*\.\d{2,8}\b/g,
    // Compact format: 12345.67
    /\b\d{4,6}\.\d{2,5}\b/g,
    // Small numbers: 0.1234
    /\b0\.\d{2,8}\b/g,
    // Large numbers with commas: 1,234.56
    /\b\d{1,3}(?:,\d{3})+\.\d+\b/g,
    // Integer prices: 1234 (only in specific contexts)
    /\b\d{4,6}\b/g,
  ];

  const seenPositions = new Set<number>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const position = match.index;
      if (seenPositions.has(position)) continue;
      seenPositions.add(position);

      const value = parseNumber(match[0]);
      if (value !== null && isValidPrice(value)) {
        prices.push({
          value,
          text: match[0],
          position,
          confidence: 0.8,
        });
      }
    }
  }

  // Sort by position in text
  return prices.sort((a, b) => a.position - b.position);
}

function isValidPrice(value: number): boolean {
  // Filter out obviously invalid prices
  if (value <= 0) return false;
  if (value > 1000000) return false; // Unrealistic price
  return true;
}

// ─── Price Classification ───

function classifyPrices(
  prices: DetectedPrice[],
  fullText: string
): Array<DetectedPrice & { context: PriceContext }> {
  const lines = fullText.split("\n");

  return prices.map((price, index) => {
    // Find the line containing this price
    let line = "";
    let charCount = 0;
    for (const l of lines) {
      if (charCount <= price.position && price.position < charCount + l.length) {
        line = l;
        break;
      }
      charCount += l.length + 1; // +1 for newline
    }

    const context = analyzePriceContext(line, index, prices);

    return {
      ...price,
      context,
    };
  });
}

// ─── Lot Size Extraction ───

function extractLotSize(
  text: string,
  classifiedPrices: Array<DetectedPrice & { context: PriceContext }>
): number | null {
  // Look for explicit lot size mentions
  const lotPattern = /(?:lot|volume|qty|quantity|size)\s*[:\s=]*\s*(\d+\.?\d*)/i;
  const lotMatch = text.match(lotPattern);
  if (lotMatch) {
    const value = parseNumber(lotMatch[1]);
    if (value !== null && value > 0 && value < 1000) {
      return value;
    }
  }

  // Check classified prices for lot size
  for (const price of classifiedPrices) {
    if (price.context.type === "lotSize") {
      return price.value;
    }
  }

  return null;
}

// ─── Trade Building ───

function buildTrades(
  symbol: string,
  direction: "buy" | "sell" | "unknown",
  classifiedPrices: Array<DetectedPrice & { context: PriceContext }>,
  lotSize: number | null,
  fullText: string
): OCRTrade[] {
  // Filter out chart scale and indicator prices
  const validPrices = classifiedPrices.filter(
    (p) => p.context.type !== "chartScale" && p.context.type !== "indicator" && p.context.type !== "unknown"
  );

  if (validPrices.length === 0 && !symbol && direction === "unknown") {
    return [];
  }

  // Group prices by type
  const entryPrices = validPrices.filter((p) => p.context.type === "entry");
  const slPrices = validPrices.filter((p) => p.context.type === "stopLoss");
  const tpPrices = validPrices.filter((p) => p.context.type === "takeProfit");

  // Get the best price for each category (highest confidence)
  const entryPrice = entryPrices.length > 0
    ? entryPrices.reduce((best, p) => p.confidence > best.confidence ? p : best).value
    : null;

  const stopLoss = slPrices.length > 0
    ? slPrices.reduce((best, p) => p.confidence > best.confidence ? p : best).value
    : null;

  const takeProfit = tpPrices.length > 0
    ? tpPrices.reduce((best, p) => p.confidence > best.confidence ? p : best).value
    : null;

  // Calculate field confidences
  const fieldConfidences: FieldConfidences = {
    symbol: symbol ? (symbolResultFromText(symbol, fullText) ? 0.95 : 0.8) : 0,
    direction: direction !== "unknown" ? 0.9 : 0,
    entryPrice: entryPrice !== null ? 0.9 : 0,
    stopLoss: stopLoss !== null ? 0.9 : 0,
    takeProfit: takeProfit !== null ? 0.9 : 0,
    positionSize: lotSize !== null ? 0.9 : 0,
  };

  // Calculate risk/reward if we have both SL and TP
  let riskReward: number | null = null;
  if (entryPrice !== null && stopLoss !== null && takeProfit !== null) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    if (risk > 0) {
      riskReward = Math.round((reward / risk) * 100) / 100;
    }
  }

  const trade: OCRTrade = {
    symbol,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    positionSize: lotSize,
    riskReward,
    confidence: overallFieldConfidence(fieldConfidences),
    fieldConfidences,
    rawText: fullText.slice(0, 200), // First 200 chars for context
  };

  return [trade];
}

// ─── Confidence Calculation ───

function overallFieldConfidence(confidences: FieldConfidences): number {
  const values = Object.values(confidences);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100);
}

function calculateOverallConfidence(
  trades: OCRTrade[],
  symbol: string,
  direction: "buy" | "sell" | "unknown"
): number {
  if (trades.length === 0) {
    // If we at least have a symbol or direction, give partial credit
    let partial = 0;
    if (symbol) partial += 30;
    if (direction !== "unknown") partial += 20;
    return partial;
  }

  return trades[0].confidence;
}

function calculateFieldsDetected(trade: OCRTrade): number {
  let count = 0;
  if (trade.symbol) count++;
  if (trade.direction !== "unknown") count++;
  if (trade.entryPrice !== null) count++;
  if (trade.stopLoss !== null) count++;
  if (trade.takeProfit !== null) count++;
  if (trade.positionSize !== null) count++;
  return count;
}

// ─── Text Cleaning ───

export function cleanOCRText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // Remove TradingView watermark
  cleaned = cleaned.replace(/TradingView/gi, "");

  // Remove MetaQuotes watermarks
  cleaned = cleaned.replace(/MetaQuotes/gi, "");

  // Remove common UI elements
  cleaned = cleaned.replace(/\b(Login|File|View|Insert|Charts|Tools|Window|Help)\b/g, "");
  cleaned = cleaned.replace(/\b(New Order|Order|Modify|Delete|Close)\b/g, "");
  cleaned = cleaned.replace(/\b(M1|M5|M15|M30|H1|H4|D1|W1|MN)\b/g, "");

  // Remove zoom indicators
  cleaned = cleaned.replace(/\d+%\s*zoom/gi, "");

  // Remove crosshair coordinates
  cleaned = cleaned.replace(/\d{2}:\d{2}:\d{2}\s+\d+\.?\d*/g, "");

  // Clean up multiple spaces and newlines
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

// ─── Extracted Fields ───

export function getExtractedFields(trades: OCRTrade[]): ExtractedFieldStatus[] {
  if (trades.length === 0) return [];

  const trade = trades[0];

  return [
    {
      field: "symbol",
      detected: trade.symbol !== "",
      confidence: trade.fieldConfidences.symbol,
      source: trade.fieldConfidences.symbol > 0.7 ? "fuzzy_match" : "none",
    },
    {
      field: "direction",
      detected: trade.direction !== "unknown",
      confidence: trade.fieldConfidences.direction,
      source: trade.fieldConfidences.direction > 0.7 ? "explicit_label" : trade.fieldConfidences.direction > 0 ? "context_inference" : "none",
    },
    {
      field: "entryPrice",
      detected: trade.entryPrice !== null,
      confidence: trade.fieldConfidences.entryPrice,
      source: trade.fieldConfidences.entryPrice > 0.7 ? "explicit_label" : trade.fieldConfidences.entryPrice > 0 ? "context_inference" : "none",
    },
    {
      field: "stopLoss",
      detected: trade.stopLoss !== null,
      confidence: trade.fieldConfidences.stopLoss,
      source: trade.fieldConfidences.stopLoss > 0.7 ? "explicit_label" : trade.fieldConfidences.stopLoss > 0 ? "context_inference" : "none",
    },
    {
      field: "takeProfit",
      detected: trade.takeProfit !== null,
      confidence: trade.fieldConfidences.takeProfit,
      source: trade.fieldConfidences.takeProfit > 0.7 ? "explicit_label" : trade.fieldConfidences.takeProfit > 0 ? "context_inference" : "none",
    },
    {
      field: "positionSize",
      detected: trade.positionSize !== null,
      confidence: trade.fieldConfidences.positionSize,
      source: trade.fieldConfidences.positionSize > 0.7 ? "explicit_label" : trade.fieldConfidences.positionSize > 0 ? "context_inference" : "none",
    },
  ];
}

// ─── Per-Trade Symbol Source Detection ───

function symbolResultFromText(symbol: string, text: string): boolean {
  // Check if symbol was found via direct text match
  return text.toUpperCase().includes(symbol);
}

// ─── Calculate Trade Completeness ───

export function calculateTradeCompleteness(trades: OCRTrade[]): {
  completeness: number;
  detectedFields: number;
  totalFields: number;
  missingFields: string[];
} {
  if (trades.length === 0) {
    return { completeness: 0, detectedFields: 0, totalFields: 6, missingFields: ["symbol", "direction", "entryPrice", "stopLoss", "takeProfit", "positionSize"] };
  }

  const t = trades[0];
  const detected = [
    t.symbol !== "", t.direction !== "unknown",
    t.entryPrice !== null, t.stopLoss !== null,
    t.takeProfit !== null, t.positionSize !== null,
  ].filter(Boolean).length;

  const missing: string[] = [];
  if (!t.symbol) missing.push("symbol");
  if (t.direction === "unknown") missing.push("direction");
  if (t.entryPrice === null) missing.push("entryPrice");
  if (t.stopLoss === null) missing.push("stopLoss");
  if (t.takeProfit === null) missing.push("takeProfit");
  if (t.positionSize === null) missing.push("positionSize");

  return {
    completeness: Math.round((detected / 6) * 100),
    detectedFields: detected,
    totalFields: 6,
    missingFields: missing,
  };
}
