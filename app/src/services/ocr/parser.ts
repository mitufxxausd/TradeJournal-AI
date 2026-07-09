/**
 * Intelligent OCR Trade Parser
 * Parses raw OCR text into structured trade information.
 *
 * Architecture:
 *   OCR Text → Clean → Extract Prices with Context → Filter Chart Scale →
 *   Extract Symbol (fuzzy) → Extract Direction (explicit only) →
 *   Assign Prices (labeled only) → Calculate Confidence → Return Trade
 *
 * Rules:
 * - ONLY reads visible text, NEVER understands charts
 * - Ignores chart price scales, indicator values, volume labels
 * - Ignores TradingView UI, MT4/MT5 toolbars, watermarks
 * - Symbol detection uses fuzzy matching with aliases
 * - Direction ONLY detected from explicit words (BUY, SELL, LONG, SHORT)
 * - TP NEVER comes from chart axis numbers
 * - All fields are editable, never invented
 */

import type {
  OCRTrade,
  OCRResult,
  DetectedPrice,
  FieldConfidences,
  OCRQualityMetrics,
  ExtractedFieldStatus,
  TradeField,
} from "./types";
import { getConfidenceLevel, CONFIDENCE_THRESHOLDS, SYMBOL_ALIASES, VALID_TRADING_PAIRS } from "./types";

// ─── Constants ───

const DIRECTION_WORDS: Record<string, "buy" | "sell"> = {
  buy: "buy", long: "buy", bullish: "buy", call: "buy",
  sell: "sell", short: "sell", bearish: "sell", put: "sell",
} as const;

const EXPLICIT_ORDER_TYPES: Record<string, "buy" | "sell"> = {
  "buy": "buy",
  "buy market": "buy",
  "buy limit": "buy",
  "buy stop": "buy",
  "long": "buy",
  "sell": "sell",
  "sell market": "sell",
  "sell limit": "sell",
  "sell stop": "sell",
  "short": "sell",
} as const;

/** Labels that indicate chart price scale or UI elements - discard these numbers */
const CHART_UI_KEYWORDS = [
  // Price axis
  "price", "bid", "ask", "spread",
  // Time axis
  "time", "date", "gmt", "utc", "min", "hour", "daily", "weekly", "monthly",
  // Zoom and UI
  "zoom", "auto", "log", "lin", "percent", "%",
  // Indicator labels - numbers near these are NEVER trade prices
  "rsi", "macd", "ema", "sma", "bb", "bollinger", "atr", "stoch",
  "volume", "vol", "obv", "cci", "adx", "williams", "ichimoku",
  "mfi", "momentum", "parabolic", "sar", "psar",
  // Chart patterns
  "support", "resistance", "pivot", "fibonacci", "fib", "retracement",
  // MT4/MT5 specific UI
  "chart", "period", "template", "object", "navigator", "terminal",
  "market watch", "data window", " toolbox",
  // TradingView UI
  "compare", "indicators", "financials", "templates", "alert",
  "replay", "goto", "screenshot", "publish", "ideas",
  // Watermark/common UI
  "tradingview", "metaquotes", "metatrader", "forex.com", "copyright",
] as const;

/** Watermark text patterns to remove */
const WATERMARK_PATTERNS = [
  /tradingview/gi,
  /metaquotes/gi,
  /mt4|mt5|metatrader/gi,
  /forex\.com/gi,
  /oanda/gi,
  /ig\.com/gi,
  /xm\.com/gi,
  /icmarkets/gi,
] as const;

/** Take Profit ONLY comes from these explicit sources */
const TP_SOURCES = [
  /\btp\s*[:=-]?\s*[\d.]+/i,
  /\btake\s*profit\s*[:=-]?\s*[\d.]+/i,
  /\btarget\s*[:=-]?\s*[\d.]+/i,
  /\bt\/p\s*[:=-]?\s*[\d.]+/i,
];

/** Stop Loss explicit sources */
const SL_SOURCES = [
  /\bsl\s*[:=-]?\s*[\d.]+/i,
  /\bstop\s*loss\s*[:=-]?\s*[\d.]+/i,
  /\bs\/l\s*[:=-]?\s*[\d.]+/i,
];

/** Entry explicit sources */
const ENTRY_SOURCES = [
  /\bentry\s*[:=-]?\s*[\d.]+/i,
  /\bopen\s*[:=-]?\s*[\d.]+/i,
  /\bopen\s*price\s*[:=-]?\s*[\d.]+/i,
  /@\s*[\d.]+/,
];

/** Numbers that are clearly timestamps, not prices */
const TIMESTAMP_PATTERNS = [
  /^\d{2}:\d{2}$/,           // HH:MM
  /^\d{2}:\d{2}:\d{2}$/,     // HH:MM:SS
  /^\d{4}-\d{2}-\d{2}$/,     // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/,   // MM/DD/YYYY
];

// ─── Text Cleaning ───

/**
 * Clean OCR text by removing watermark text and known UI elements.
 */
export function cleanOCRText(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // Remove watermark patterns
  for (const pattern of WATERMARK_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove common UI text
  const uiPatterns = [
    /copyright/gi,
    /all rights reserved/gi,
    /www\.[\w.]+/gi,
  ];

  for (const pattern of uiPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned;
}

// ─── Symbol/Pair Extraction with Fuzzy Matching ───

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSymbol(text: string): { symbol: string; confidence: number; source: string } {
  if (!text || text.trim().length === 0) {
    return { symbol: "", confidence: 0, source: "none" };
  }

  const upperText = text.toUpperCase().replace(/[^A-Z0-9/\s_-]/gi, "");

  // 1. Check symbol aliases first (exact match for "Gold Spot" → XAUUSD etc.)
  for (const [alias, standardSymbol] of Object.entries(SYMBOL_ALIASES)) {
    const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
    if (regex.test(text)) {
      return { symbol: standardSymbol, confidence: 0.95, source: "alias" };
    }
  }

  // 2. Direct match for known trading pairs
  for (const pair of VALID_TRADING_PAIRS) {
    const regex = new RegExp(`\\b${pair}\\b`, "i");
    if (regex.test(upperText)) {
      return { symbol: pair, confidence: 0.95, source: "exact" };
    }
  }

  // 3. Match with separators: EUR/USD, EUR_USD, EUR-USD
  const forexPattern = /\b([A-Z]{3})[/\-_]?([A-Z]{3})\b/;
  const match = upperText.match(forexPattern);
  if (match) {
    const combined = `${match[1]}${match[2]}`;
    return { symbol: combined, confidence: 0.85, source: "separator" };
  }

  // 4. Crypto pairs: BTC/USD, BTCUSDT, etc.
  const cryptoPattern = /\b(BTC|ETH|XRP|LTC|BNB|SOL|ADA|DOT|AVAX|LINK)[/\-_]?(USD|USDT|USDC|EUR|BTC|ETH)\b/i;
  const cryptoMatch = text.match(cryptoPattern);
  if (cryptoMatch) {
    const base = cryptoMatch[1].toUpperCase();
    const quote = cryptoMatch[2].toUpperCase();
    // Normalize USDT to USD for consistency
    const normalizedQuote = quote === "USDT" ? "USD" : quote;
    return {
      symbol: `${base}${normalizedQuote}`,
      confidence: 0.85,
      source: "crypto",
    };
  }

  // 5. Chart title / window title extraction
  const compactPattern = /\b([A-Z]{3,6}(?:USD|EUR|JPY|GBP|CAD|CHF|AUD|NZD))\b/i;
  const compactMatch = text.match(compactPattern);
  if (compactMatch) {
    return { symbol: compactMatch[1].toUpperCase(), confidence: 0.7, source: "compact" };
  }

  // 6. Commodities with loose matching
  const goldPattern = /\b(gold|xau|au)\b/i;
  const silverPattern = /\b(silver|xag|ag)\b/i;
  const oilPattern = /\b(wti|brent|crude|oil)\b/i;

  if (goldPattern.test(text)) return { symbol: "XAUUSD", confidence: 0.7, source: "commodity" };
  if (silverPattern.test(text)) return { symbol: "XAGUSD", confidence: 0.7, source: "commodity" };
  if (oilPattern.test(text)) return { symbol: "USOIL", confidence: 0.6, source: "commodity" };

  // No symbol detected
  return { symbol: "", confidence: 0, source: "none" };
}

// ─── Direction Extraction (Explicit Only) ───

function extractDirection(text: string): { direction: "buy" | "sell" | ""; confidence: number } {
  if (!text || text.trim().length === 0) {
    return { direction: "", confidence: 0 };
  }

  const lowerText = text.toLowerCase();

  // 1. Check explicit order type labels first (highest confidence)
  for (const [label, dir] of Object.entries(EXPLICIT_ORDER_TYPES)) {
    const regex = new RegExp(`\\b${escapeRegex(label)}\\b`, "i");
    if (regex.test(lowerText)) {
      return { direction: dir, confidence: 0.95 };
    }
  }

  // 2. Count direction word occurrences
  let buyCount = 0;
  let sellCount = 0;

  for (const [word, dir] of Object.entries(DIRECTION_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) {
      if (dir === "buy") buyCount += matches.length;
      else sellCount += matches.length;
    }
  }

  // 3. Only return direction if there's clear evidence
  if (buyCount > 0 && sellCount === 0) {
    return { direction: "buy", confidence: Math.min(0.85, 0.6 + buyCount * 0.05) };
  }
  if (sellCount > 0 && buyCount === 0) {
    return { direction: "sell", confidence: Math.min(0.85, 0.6 + sellCount * 0.05) };
  }

  // 4. Ambiguous - both buy and sell found, leave blank
  if (buyCount > 0 && sellCount > 0) {
    return { direction: "", confidence: 0 };
  }

  // 5. No direction evidence found - leave blank
  return { direction: "", confidence: 0 };
}

// ─── Price Extraction with Strict Context ───

/**
 * Extract prices with surrounding context for intelligent classification.
 * KEY RULE: Numbers from chart price scale are ALWAYS discarded.
 */
function extractPricesWithContext(text: string): DetectedPrice[] {
  const prices: DetectedPrice[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\n/);

  // Find all numeric patterns with their positions
  const allMatches: {
    value: number;
    lineNum: number;
    line: string;
    position: number;
    original: string;
  }[] = [];

  // Match decimal numbers (prices)
  const pricePattern = /-?\b(\d{1,6}(?:,\d{3})*\.\d{1,5})\b/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    while ((match = pricePattern.exec(line)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(value)) {
        allMatches.push({
          value,
          lineNum: i,
          line: line.trim(),
          position: match.index,
          original: match[0],
        });
      }
    }
  }

  // Analyze context for each price
  for (const match of allMatches) {
    const { value, lineNum, line } = match;

    // Skip if already seen (deduplicate by value+line)
    const key = `${value}_${lineNum}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Skip invalid values
    if (value <= 0) continue;
    if (value > 1_000_000) continue;

    const context = analyzePriceContext(line, lineNum, lines, allMatches);

    // Classify based on context
    const classification = classifyPrice(value, context, match, allMatches);

    prices.push({
      value,
      context: context.contextText,
      classification,
      confidence: calculatePriceConfidence(value, context, classification),
    });
  }

  return prices.sort((a, b) => a.value - b.value);
}

interface PriceContext {
  contextText: string;
  hasSLLabel: boolean;
  hasTPLabel: boolean;
  hasEntryLabel: boolean;
  hasLotLabel: boolean;
  hasChartLabel: boolean;
  hasIndicatorLabel: boolean;
  isIsolatedPrice: boolean;
  nearbyPrices: number;
  isPartOfSequence: boolean;
  hasPercentageSign: boolean;
  hasVolumeContext: boolean;
  isLikelyTimestamp: boolean;
  lineHasExplicitLabel: boolean;
}

function analyzePriceContext(
  line: string,
  lineNum: number,
  allLines: string[],
  allMatches: Array<{ value: number; lineNum: number }>
): PriceContext {
  const lowerLine = line.toLowerCase();

  // Check for explicit labels
  const hasSLLabel = SL_SOURCES.some((p) => p.test(line));
  const hasTPLabel = TP_SOURCES.some((p) => p.test(line));
  const hasEntryLabel = ENTRY_SOURCES.some((p) => p.test(line));
  const hasLotLabel = /\b(lots?|size|volume|qty|quantity|position)\b/i.test(line);
  const hasPercentageSign = /%/.test(line);
  const hasVolumeContext = /\b(volume|vol|tick|vwap)\b/i.test(line);

  // Check if this is a timestamp, not a price
  const isLikelyTimestamp = TIMESTAMP_PATTERNS.some((p) => p.test(line.trim()));

  // Check for chart/indicator labels
  const hasChartLabel = CHART_UI_KEYWORDS.some((label) =>
    new RegExp(`\\b${escapeRegex(label)}\\b`, "i").test(line)
  );
  const hasIndicatorLabel = /\b(rsi|macd|ema\d*|sma\d*|atr|stoch|cci|adx|bollinger|volume|vol|obv|mfi)\b/i.test(line);

  // Is this an isolated price on its own line? (typical of price axis)
  const isIsolatedPrice = /^\s*-?\d+\.?\d*\s*$/.test(line);

  // Count nearby prices on adjacent lines
  const nearbyPrices = allMatches.filter(
    (m) => m.lineNum >= lineNum - 1 && m.lineNum <= lineNum + 1 && m.lineNum !== lineNum
  ).length;

  // Check if part of sequential price ladder (chart scale)
  const sameLinePrices = allMatches.filter((m) => m.lineNum === lineNum).length;
  const isPartOfSequence = sameLinePrices >= 2 || (isIsolatedPrice && nearbyPrices >= 2);

  // Does this line have an explicit trade label?
  const lineHasExplicitLabel = hasSLLabel || hasTPLabel || hasEntryLabel || hasLotLabel;

  // Build context text (surrounding lines)
  const prevLine = lineNum > 0 ? allLines[lineNum - 1].trim() : "";
  const nextLine = lineNum < allLines.length - 1 ? allLines[lineNum + 1].trim() : "";
  const contextText = `${prevLine} | ${line} | ${nextLine}`;

  return {
    contextText,
    hasSLLabel,
    hasTPLabel,
    hasEntryLabel,
    hasLotLabel,
    hasChartLabel,
    hasIndicatorLabel,
    isIsolatedPrice,
    nearbyPrices,
    isPartOfSequence,
    hasPercentageSign,
    hasVolumeContext,
    isLikelyTimestamp,
    lineHasExplicitLabel,
  };
}

function classifyPrice(
  _value: number,
  context: PriceContext,
  _match: { value: number; lineNum: number; line: string; position: number; original: string },
  _allMatches: Array<{ value: number; lineNum: number }>
): DetectedPrice["classification"] {
  // CRITICAL: If it's a timestamp, not a price
  if (context.isLikelyTimestamp) return "indicator";

  // CRITICAL: If it has a percentage sign, it's not a trade price
  if (context.hasPercentageSign) return "indicator";

  // CRITICAL: If it's part of a price sequence on the chart scale, discard
  if (context.isPartOfSequence && context.isIsolatedPrice) return "chartScale";

  // CRITICAL: If it's an isolated price with many nearby prices (price axis ladder)
  if (context.isIsolatedPrice && context.nearbyPrices >= 3) return "chartScale";

  // If it has a chart/indicator label and no explicit trade label
  if (context.hasChartLabel && !context.lineHasExplicitLabel) return "chartScale";

  // If it has an indicator label and no explicit trade label
  if (context.hasIndicatorLabel && !context.lineHasExplicitLabel) return "indicator";

  // If it has volume context
  if (context.hasVolumeContext && !context.lineHasExplicitLabel) return "indicator";

  // Check for lot size patterns
  if (context.hasLotLabel) return "lotSize";
  if (isLikelyLotSize(_value) && !context.lineHasExplicitLabel) {
    return "lotSize";
  }

  // Check for explicit labels (highest priority)
  if (context.hasSLLabel) return "stopLoss";
  if (context.hasTPLabel) return "takeProfit";
  if (context.hasEntryLabel) return "entry";

  // Default: unknown (will NOT be assigned to TP/SL/Entry without explicit labels)
  return "unknown";
}

function isLikelyLotSize(value: number): boolean {
  const commonLotSizes = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09,
    0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19,
    0.20, 0.25, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90,
    1.00, 1.50, 2.00, 2.50, 3.00, 4.00, 5.00, 10.00, 15.00, 20.00, 50.00, 100.00];

  return commonLotSizes.some((lot) => Math.abs(value - lot) < 0.001);
}

function calculatePriceConfidence(
  value: number,
  context: PriceContext,
  classification: DetectedPrice["classification"]
): number {
  let confidence = 0.5;

  // Explicit labels boost confidence significantly
  if (context.hasEntryLabel) confidence += 0.4;
  if (context.hasSLLabel) confidence += 0.4;
  if (context.hasTPLabel) confidence += 0.4;
  if (context.hasLotLabel) confidence += 0.4;

  // Isolated prices without labels = very low confidence
  if (context.isIsolatedPrice && !context.lineHasExplicitLabel) {
    confidence = 0.1;
  }

  // Chart/indicator context eliminates confidence
  if (context.hasChartLabel && !context.lineHasExplicitLabel) confidence = 0;
  if (context.hasIndicatorLabel && !context.lineHasExplicitLabel) confidence = 0.05;
  if (context.hasPercentageSign) confidence = 0;
  if (context.isLikelyTimestamp) confidence = 0;

  // Volume context reduces confidence
  if (context.hasVolumeContext) confidence -= 0.3;

  // Lot size values
  if (classification === "lotSize" && isLikelyLotSize(value)) {
    confidence += 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}

// ─── Lot Size Extraction ───

function extractLotSize(text: string, prices: DetectedPrice[]): { lotSize: number | null; confidence: number } {
  // Look for explicit lot patterns: "0.50 lots", "Size: 1.00"
  const lotPattern = /(\d+\.?\d*)\s*(?:lots?|lot)/i;
  const lotMatch = text.match(lotPattern);
  if (lotMatch) {
    const value = parseFloat(lotMatch[1]);
    if (!isNaN(value) && value > 0 && value <= 1000) {
      return { lotSize: value, confidence: 0.95 };
    }
  }

  // Look for "Size: X.XX" patterns
  const sizePattern = /(?:size|volume|qty|quantity)[\s:]*(\d+\.?\d*)/i;
  const sizeMatch = text.match(sizePattern);
  if (sizeMatch) {
    const value = parseFloat(sizeMatch[1]);
    if (!isNaN(value) && value > 0 && value <= 1000) {
      return { lotSize: value, confidence: 0.9 };
    }
  }

  // Try to find lot size from classified prices
  const lotPrice = prices.find((p) => p.classification === "lotSize" && p.confidence >= 0.5);
  if (lotPrice && isLikelyLotSize(lotPrice.value)) {
    return { lotSize: lotPrice.value, confidence: lotPrice.confidence };
  }

  return { lotSize: null, confidence: 0 };
}

// ─── Multi-Trade Detection ───

function detectMultipleTrades(text: string): { count: number; segments: string[] } {
  // Look for explicit position/trade identifiers
  const ticketPattern = /(?:ticket|position|trade|order)\s*#?\s*(\d+)/gi;
  const tickets = text.match(ticketPattern);

  if (tickets && tickets.length >= 2) {
    const segments = text
      .split(/(?=\b(?:ticket|position|trade|order)\s*#?\s*\d+)/gi)
      .filter((s) => s.trim().length > 10);
    return { count: segments.length || tickets.length, segments };
  }

  // Check for multiple direction keywords on different lines with substantial text between
  const lines = text.split(/\n/);
  const directionBlocks: string[] = [];
  let currentBlock = "";

  for (const line of lines) {
    if (/(?:buy|sell|long|short)/i.test(line) && currentBlock.length > 50) {
      directionBlocks.push(currentBlock);
      currentBlock = line + "\n";
    } else {
      currentBlock += line + "\n";
    }
  }
  if (currentBlock.length > 10) {
    directionBlocks.push(currentBlock);
  }

  if (directionBlocks.length >= 2) {
    return { count: directionBlocks.length, segments: directionBlocks };
  }

  return { count: 1, segments: [text] };
}

// ─── Order Type Extraction ───

function extractOrderTypes(text: string): string[] {
  const types: string[] = [];
  const orderKeywords = [
    "market", "limit", "stop", "stop loss", "take profit",
    "pending", "buy stop", "sell stop", "buy limit", "sell limit",
  ];

  for (const keyword of orderKeywords) {
    if (new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i").test(text)) {
      types.push(keyword);
    }
  }

  return types;
}

// ─── Quality Metrics Calculation ───

function calculateQualityMetrics(
  trade: OCRTrade,
  ocrConfidence: number
): OCRQualityMetrics {
  const detectedFields: ExtractedFieldStatus[] = [
    {
      field: "symbol",
      detected: trade.symbol !== "" && trade.symbol !== "Symbol not detected",
      confidence: trade.fieldConfidences.symbol,
      source: trade.fieldConfidences.symbol > 0.7 ? "explicit_label" : trade.fieldConfidences.symbol > 0 ? "context_inference" : "none",
    },
    {
      field: "direction",
      detected: trade.direction !== "" && trade.direction !== "unknown",
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

  const fieldsDetected = detectedFields.filter((f) => f.detected).length;
  const totalFields = 6;

  // OCR Quality: based on Tesseract confidence (0-100)
  const ocrQuality = Math.round(ocrConfidence);

  // Parser Confidence: based on successful parsing of fields
  const parserConfidence = Math.round(
    (detectedFields.reduce((sum, f) => sum + f.confidence, 0) / totalFields) * 100
  );

  // Trade Completeness: percentage of fields detected
  const tradeCompleteness = Math.round((fieldsDetected / totalFields) * 100);

  return {
    ocrQuality,
    parserConfidence,
    tradeCompleteness,
    fieldsDetected,
    totalFields,
    detectedFields,
  };
}

// ─── Trade Segment Parser ───

function parseTradeSegment(
  segment: string,
  allPrices: DetectedPrice[],
  ocrConfidence: number
): { trade: OCRTrade | null; qualityMetrics: OCRQualityMetrics | null } {
  const symbolResult = extractSymbol(segment);
  const directionResult = extractDirection(segment);

  // Get prices specific to this segment
  const segmentPrices = extractPricesWithContext(segment);

  // Use segment-specific prices if available, otherwise filter from all prices
  const relevantPrices = segmentPrices.length >= 2
    ? segmentPrices
    : allPrices.filter((p) => segment.includes(String(p.value)));

  // STRICT FILTER: Discard ALL chart scale and indicator prices
  const tradePrices = relevantPrices.filter(
    (p) => p.classification !== "chartScale" && p.classification !== "indicator" && p.confidence > 0.3
  );

  // Extract lot size
  const lotResult = extractLotSize(segment, relevantPrices);

  // Assign values based on classification ONLY
  let entryPrice: number | null = null;
  let stopLoss: number | null = null;
  let takeProfit: number | null = null;

  const entryPrices = tradePrices.filter((p) => p.classification === "entry" && p.confidence >= 0.5);
  const slPrices = tradePrices.filter((p) => p.classification === "stopLoss" && p.confidence >= 0.5);
  const tpPrices = tradePrices.filter((p) => p.classification === "takeProfit" && p.confidence >= 0.5);

  // Get the highest confidence entry price (must have explicit label)
  if (entryPrices.length > 0) {
    entryPrice = entryPrices.sort((a, b) => b.confidence - a.confidence)[0].value;
  }

  // Get the highest confidence SL (must have explicit label)
  if (slPrices.length > 0) {
    stopLoss = slPrices.sort((a, b) => b.confidence - a.confidence)[0].value;
  }

  // Get ONLY the highest confidence TP (must have explicit TP label)
  // CRITICAL: TP only from explicit labels, never from chart axis
  if (tpPrices.length > 0) {
    takeProfit = tpPrices.sort((a, b) => b.confidence - a.confidence)[0].value;
  }

  // Validate: entry should not be a lot size
  if (entryPrice !== null && lotResult.lotSize !== null) {
    if (Math.abs(entryPrice - lotResult.lotSize) < 0.001) {
      entryPrice = null;
    }
  }

  // Validate: entry should not be an unrealistic value
  if (entryPrice !== null && isLikelyLotSize(entryPrice) && entryPrice < 1) {
    entryPrice = null;
  }

  // Calculate R:R
  let riskReward: number | null = null;
  if (entryPrice && stopLoss && takeProfit) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    if (risk > 0) {
      riskReward = parseFloat((reward / risk).toFixed(2));
    }
  }

  // Build field confidences
  const fieldConfidences: FieldConfidences = {
    symbol: symbolResult.confidence,
    direction: directionResult.confidence,
    entryPrice: entryPrice !== null ? (entryPrices.length > 0 ? entryPrices[0].confidence : 0) : 0,
    stopLoss: stopLoss !== null ? (slPrices.length > 0 ? slPrices[0].confidence : 0) : 0,
    takeProfit: takeProfit !== null ? (tpPrices.length > 0 ? tpPrices[0].confidence : 0) : 0,
    positionSize: lotResult.confidence,
  };

  // Calculate overall confidence
  const fieldValues = Object.values(fieldConfidences);
  const avgFieldConfidence = fieldValues.reduce((a, b) => a + b, 0) / fieldValues.length;
  const overallConfidence = Math.round(
    (avgFieldConfidence * 0.6 + (ocrConfidence / 100) * 0.4) * 100
  );

  const trade: OCRTrade = {
    symbol: symbolResult.symbol || "",
    direction: directionResult.direction || "unknown",
    entryPrice,
    stopLoss,
    takeProfit,
    positionSize: lotResult.lotSize,
    riskReward,
    confidence: Math.min(100, Math.max(0, overallConfidence)),
    fieldConfidences,
    rawText: segment.trim(),
  };

  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(trade, ocrConfidence);

  return { trade, qualityMetrics };
}

// ─── Main Parser Function ───

/**
 * Parse raw OCR text into structured trade data.
 * Workflow: OCR Text → Clean → Extract Prices → Filter Chart Scale →
 *           Extract Symbol/Direction → Assign Prices → Quality Metrics
 */
export function parseOCRText(text: string, ocrConfidence: number): OCRResult {
  const startTime = Date.now();

  if (!text || text.trim().length === 0) {
    return {
      rawText: "",
      trades: [],
      detectedPrices: [],
      detectedOrderTypes: [],
      overallConfidence: 0,
      confidenceLevel: "low",
      processingTimeMs: 0,
      error: "No text detected in image",
      qualityMetrics: {
        ocrQuality: 0,
        parserConfidence: 0,
        tradeCompleteness: 0,
        fieldsDetected: 0,
        totalFields: 6,
        detectedFields: [],
      },
    };
  }

  // Step 1: Clean the text
  const cleanedText = cleanOCRText(text);

  // Step 2: Detect multiple trades
  const { count, segments } = detectMultipleTrades(cleanedText);

  // Step 3: Extract all prices with context
  const allPrices = extractPricesWithContext(cleanedText);

  // Step 4: Filter out chart scale and indicator prices from display list
  const relevantPrices = allPrices.filter(
    (p) => p.classification !== "chartScale" && p.classification !== "indicator"
  );

  // Step 5: Parse each trade segment
  const trades: OCRTrade[] = [];
  let allQualityMetrics: OCRQualityMetrics | null = null;

  if (count > 1 && segments.length > 1) {
    for (const segment of segments) {
      if (segment.trim().length > 5) {
        const { trade, qualityMetrics } = parseTradeSegment(segment, allPrices, ocrConfidence);
        if (trade && (trade.symbol || trade.entryPrice !== null)) {
          trades.push(trade);
          if (qualityMetrics) allQualityMetrics = qualityMetrics;
        }
      }
    }
  }

  // If no trades parsed from segments, parse the whole text
  if (trades.length === 0) {
    const { trade, qualityMetrics } = parseTradeSegment(cleanedText, allPrices, ocrConfidence);
    if (trade && (trade.symbol || trade.entryPrice !== null)) {
      trades.push(trade);
      if (qualityMetrics) allQualityMetrics = qualityMetrics;
    }
  }

  const orderTypes = extractOrderTypes(cleanedText);
  const processingTimeMs = Date.now() - startTime;

  // Calculate overall confidence
  const overallConfidence = trades.length > 0
    ? Math.round(trades.reduce((sum, t) => sum + t.confidence, 0) / trades.length)
    : Math.round(ocrConfidence * 0.5); // Lower if no trades found

  const confidenceLevel = getConfidenceLevel(overallConfidence);

  // Aggregate quality metrics for all trades
  let qualityMetrics: OCRQualityMetrics;
  if (allQualityMetrics && trades.length === 1) {
    qualityMetrics = allQualityMetrics;
  } else if (trades.length > 0) {
    // Average across all trades
    const avgFieldsDetected = Math.round(
      trades.reduce((sum, t) => {
        const detected = [
          t.symbol !== "", t.direction !== "" && t.direction !== "unknown",
          t.entryPrice !== null, t.stopLoss !== null,
          t.takeProfit !== null, t.positionSize !== null,
        ].filter(Boolean).length;
        return sum + detected;
      }, 0) / trades.length
    );
    qualityMetrics = {
      ocrQuality: Math.round(ocrConfidence),
      parserConfidence: overallConfidence,
      tradeCompleteness: Math.round((avgFieldsDetected / 6) * 100),
      fieldsDetected: avgFieldsDetected,
      totalFields: 6,
      detectedFields: [],
    };
  } else {
    qualityMetrics = {
      ocrQuality: Math.round(ocrConfidence),
      parserConfidence: 0,
      tradeCompleteness: 0,
      fieldsDetected: 0,
      totalFields: 6,
      detectedFields: [],
    };
  }

  // Generate warning if confidence is low
  let warning: string | undefined;
  if (confidenceLevel === "low") {
    warning = "Low confidence detection. Please review all extracted values before importing.";
  } else if (confidenceLevel === "medium") {
    warning = "Some fields need review. Please verify extracted trade data before importing.";
  }

  return {
    rawText: cleanedText,
    trades,
    detectedPrices: relevantPrices,
    detectedOrderTypes: orderTypes,
    overallConfidence,
    confidenceLevel,
    processingTimeMs,
    warning,
    qualityMetrics,
  };
}
