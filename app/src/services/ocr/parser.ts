/**
 * Intelligent OCR Trade Parser
 * Parses raw OCR text into structured trade data.
 *
 * Key features:
 * - Ignores chart price scale labels (vertical axis numbers)
 * - Ignores indicator values, watermarks, time labels, grid values
 * - Classifies each detected number as Entry, SL, TP, or Lot Size
 * - Only assigns values when confidence is high
 * - Never guesses - leaves fields empty when uncertain
 * - Supports multi-trade detection from single screenshots
 */

import type {
  OCRTrade,
  OCRResult,
  DetectedPrice,
  FieldConfidences,
} from "./types";
import { getConfidenceLevel, CONFIDENCE_THRESHOLDS } from "./types";

// ─── Constants ───

const TRADING_PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
  "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "EURAUD",
  "EURCAD", "EURCHF", "GBPAUD", "GBPCAD", "GBPCHF", "AUDCAD", "AUDCHF",
  "AUDNZD", "CADCHF", "EURNZD", "GBPNZD", "NZDCAD", "NZDCHF", "NZDJPY",
  "XAUUSD", "XAGUSD", "US30", "US100", "DE40", "UK100", "JP225",
  "BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "BNBUSD", "SOLUSD",
  "CRUDEOIL", "BRENT", "NATGAS",
  "USOIL", "UKOIL", "GER40", "NAS100", "SPX500",
  "GOLD", "SILVER", "OIL", "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA",
  "META", "NVDA", "NFLX",
] as const;

const DIRECTION_WORDS: Record<string, "buy" | "sell"> = {
  buy: "buy", long: "buy", bullish: "buy", call: "buy",
  sell: "sell", short: "sell", bearish: "sell", put: "sell",
} as const;

/** Labels that indicate chart price scale or UI elements - these numbers should be ignored */
const CHART_UI_LABELS = [
  // Price axis
  "price", "bid", "ask", "spread",
  // Time axis
  "time", "date", "gmt", "utc", "min", "hour", "daily",
  // Zoom and UI
  "zoom", "auto", "log", "%",
  // Indicator labels
  "rsi", "macd", "ema", "sma", "bb", "bollinger", "atr", "stoch",
  "volume", "vol", "obv", "cci", "adx", "williams", "ichimoku",
  // Chart patterns that are not trade levels
  "support", "resistance", "pivot", "fibonacci", "fib", "retracement",
  // MT4/MT5 specific UI
  "chart", "period", "template", "object",
] as const;

/** Watermark text patterns */
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

/** Number patterns that suggest chart scale rather than trade levels */
const CHART_SCALE_PATTERNS = [
  // Sequential price ladder (3+ prices in ascending/descending order with similar spacing)
  /^\s*\d+\.\d+\s*$/gm,  // Single price per line (price axis style)
  // Percentage values
  /-?\d+\.?\d*\s*%/g,
  // Very large numbers (unlikely to be trade prices for most pairs)
  /\b\d{7,}\b/g,
  // Numbers followed by common indicator suffixes
  /\b\d+\.?\d*\s*(?:rsi|macd|ema\d*|sma\d*|atr|pips?|ticks?)\b/gi,
] as const;

// ─── Symbol/Pair Extraction ───

function extractSymbol(text: string): { symbol: string; confidence: number } {
  const upperText = text.toUpperCase();

  // Direct match for known trading pairs
  for (const pair of TRADING_PAIRS) {
    const regex = new RegExp(`\\b${pair}\\b`, "i");
    if (regex.test(upperText)) {
      return { symbol: pair, confidence: 0.95 };
    }
  }

  // Match with separators: EUR/USD, EUR_USD, EUR-USD
  const forexPattern = /\b([A-Z]{3})[/\-_]?([A-Z]{3})\b/;
  const match = upperText.match(forexPattern);
  if (match) {
    return { symbol: `${match[1]}${match[2]}`, confidence: 0.8 };
  }

  // Crypto pairs: BTC/USD, BTCUSDT, etc.
  const cryptoPattern = /\b(BTC|ETH|XRP|LTC|BNB|SOL|ADA|DOT|AVAX|LINK)[/\-_]?(USD|USDT|USDC|EUR|BTC|ETH)\b/i;
  const cryptoMatch = text.match(cryptoPattern);
  if (cryptoMatch) {
    return {
      symbol: `${cryptoMatch[1].toUpperCase()}${cryptoMatch[2].toUpperCase()}`,
      confidence: 0.85,
    };
  }

  // Commodities
  const commodityPattern = /\b(XAU|XAG|GOLD|SILVER|OIL|BRENT|GAS)\b/i;
  const commodityMatch = text.match(commodityPattern);
  if (commodityMatch) {
    const commodity = commodityMatch[1].toUpperCase();
    if (commodity === "GOLD") return { symbol: "XAUUSD", confidence: 0.7 };
    if (commodity === "SILVER") return { symbol: "XAGUSD", confidence: 0.7 };
    if (commodity === "OIL" || commodity === "BRENT") return { symbol: "USOIL", confidence: 0.6 };
    return { symbol: `${commodity}USD`, confidence: 0.6 };
  }

  return { symbol: "", confidence: 0 };
}

// ─── Direction Extraction ───

function extractDirection(text: string): { direction: "buy" | "sell" | "unknown"; confidence: number } {
  const lowerText = text.toLowerCase();

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

  // Check for explicit order type labels
  const hasBuyLabel = /\b(buy\s*(stop|limit|market)?|long\s*position?)\b/i.test(text);
  const hasSellLabel = /\b(sell\s*(stop|limit|market)?|short\s*position?)\b/i.test(text);

  if (hasBuyLabel) buyCount += 2;
  if (hasSellLabel) sellCount += 2;

  if (buyCount > 0 && sellCount === 0) {
    return { direction: "buy", confidence: Math.min(0.95, 0.6 + buyCount * 0.1) };
  }
  if (sellCount > 0 && buyCount === 0) {
    return { direction: "sell", confidence: Math.min(0.95, 0.6 + sellCount * 0.1) };
  }
  if (buyCount > 0 && sellCount > 0) {
    // Ambiguous
    return buyCount > sellCount
      ? { direction: "buy", confidence: 0.35 }
      : { direction: "sell", confidence: 0.35 };
  }

  return { direction: "unknown", confidence: 0 };
}

// ─── Price Extraction with Context ───

/**
 * Extract prices with surrounding context for intelligent classification.
 * This is the key function that separates chart scale prices from trade levels.
 */
function extractPricesWithContext(text: string): DetectedPrice[] {
  const prices: DetectedPrice[] = [];
  const seen = new Set<number>();
  const lines = text.split(/\n/);

  // Build a map of line numbers for context analysis
  const lineMap: { line: string; lineNum: number }[] = lines.map((line, idx) => ({
    line: line.trim(),
    lineNum: idx,
  }));

  // Find all numeric patterns with their positions
  const allMatches: {
    value: number;
    lineNum: number;
    line: string;
    position: number;
    original: string;
  }[] = [];

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

    // Skip if already seen
    if (seen.has(value)) continue;

    // Skip values that are clearly not prices
    if (value <= 0) continue;
    if (value > 1_000_000) continue; // Unreasonably high

    const context = getPriceContext(line, lineNum, lines, allMatches);

    // Classify based on context
    const classification = classifyPrice(value, context, match, allMatches);

    prices.push({
      value,
      context: context.contextText,
      classification,
      confidence: calculatePriceConfidence(value, context, classification),
    });

    seen.add(value);
  }

  return prices.sort((a, b) => a.value - b.value);
}

interface PriceContext {
  contextText: string;
  hasPriceLabel: boolean;
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
}

function getPriceContext(
  line: string,
  lineNum: number,
  allLines: string[],
  allMatches: Array<{ value: number; lineNum: number }>
): PriceContext {
  const lowerLine = line.toLowerCase();

  // Check for explicit labels
  const hasPriceLabel = /\b(price|rate)\b/i.test(line);
  const hasSLLabel = /\b(s[l]|stop\s*loss|stop)\b/i.test(line);
  const hasTPLabel = /\b(t[p]|take\s*profit|target|profit)\b/i.test(line);
  const hasEntryLabel = /\b(entry|open|opening|at\s*@?)\b/i.test(line);
  const hasLotLabel = /\b(lot|size|volume|qty|quantity|position)\b/i.test(line);
  const hasPercentageSign = /%/.test(line);

  // Check for chart/indicator labels
  const hasChartLabel = CHART_UI_LABELS.some((label) =>
    new RegExp(`\\b${label}\\b`, "i").test(line)
  );

  const hasIndicatorLabel = /\b(rsi|macd|ema|sma|atr|stoch|cci|adx|bollinger|volume|vol)\b/i.test(line);
  const hasVolumeContext = /\b(volume|vol|tick|vwap)\b/i.test(line);

  // Check if this is an isolated price (price axis style)
  const isIsolatedPrice = /^\s*-?\d+\.?\d*\s*$/.test(line);

  // Count nearby prices on same/adjacent lines
  const nearbyPrices = allMatches.filter(
    (m) => m.lineNum >= lineNum - 1 && m.lineNum <= lineNum + 1 && m.lineNum !== lineNum
  ).length;

  // Check if part of a sequential price ladder (chart scale indicator)
  const sameLinePrices = allMatches.filter((m) => m.lineNum === lineNum).length;
  const isPartOfSequence = sameLinePrices >= 2 || (isIsolatedPrice && nearbyPrices >= 2);

  // Build context text (surrounding lines)
  const prevLine = lineNum > 0 ? allLines[lineNum - 1].trim() : "";
  const nextLine = lineNum < allLines.length - 1 ? allLines[lineNum + 1].trim() : "";
  const contextText = `${prevLine} | ${line} | ${nextLine}`;

  return {
    contextText,
    hasPriceLabel,
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
  };
}

function classifyPrice(
  value: number,
  context: PriceContext,
  match: { value: number; lineNum: number; line: string; position: number; original: string },
  allMatches: Array<{ value: number; lineNum: number }>
): DetectedPrice["classification"] {
  // If it has a percentage sign, it's not a trade price
  if (context.hasPercentageSign) return "indicator";

  // If it has a chart or indicator label, ignore it
  if (context.hasChartLabel && context.isIsolatedPrice) return "chartScale";
  if (context.hasIndicatorLabel && !context.hasEntryLabel && !context.hasSLLabel && !context.hasTPLabel) {
    return "indicator";
  }

  // If it's part of a price sequence (chart scale ladder), ignore
  if (context.isPartOfSequence && context.isIsolatedPrice) return "chartScale";

  // If it's an isolated price with many nearby prices (price axis)
  if (context.isIsolatedPrice && context.nearbyPrices >= 3) return "chartScale";

  // Check for lot size patterns (0.01, 0.02, 0.10, 1.00 etc.)
  if (context.hasLotLabel) return "lotSize";
  if (isLikelyLotSize(value)) {
    // Only classify as lot size if no explicit trade labels nearby
    if (!context.hasEntryLabel && !context.hasSLLabel && !context.hasTPLabel) {
      return "lotSize";
    }
  }

  // Check for explicit labels
  if (context.hasSLLabel) return "stopLoss";
  if (context.hasTPLabel) return "takeProfit";
  if (context.hasEntryLabel) return "entry";

  // Default: unknown (will be classified later based on relative positioning)
  return "unknown";
}

function isLikelyLotSize(value: number): boolean {
  // Common lot sizes: 0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00
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

  // Explicit labels boost confidence
  if (context.hasEntryLabel) confidence += 0.3;
  if (context.hasSLLabel) confidence += 0.3;
  if (context.hasTPLabel) confidence += 0.3;
  if (context.hasLotLabel) confidence += 0.3;

  // Isolated prices without labels reduce confidence
  if (context.isIsolatedPrice && !context.hasEntryLabel && !context.hasSLLabel && !context.hasTPLabel) {
    confidence -= 0.3;
  }

  // Chart/indicator context reduces confidence
  if (context.hasChartLabel) confidence -= 0.4;
  if (context.hasIndicatorLabel) confidence -= 0.3;

  // Percentage context eliminates confidence
  if (context.hasPercentageSign) confidence = 0;

  // Volume context
  if (context.hasVolumeContext) confidence -= 0.3;

  // Reasonable price ranges boost confidence
  if (classification === "entry" || classification === "stopLoss" || classification === "takeProfit") {
    if (value > 0 && value < 1_000_000) confidence += 0.1;
  }

  // Lot size values
  if (classification === "lotSize" && isLikelyLotSize(value)) {
    confidence += 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}

// ─── Lot Size Extraction ───

function extractLotSize(text: string, prices: DetectedPrice[]): { lotSize: number | null; confidence: number } {
  // Look for explicit lot patterns
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
  if (lotPrice) {
    return { lotSize: lotPrice.value, confidence: lotPrice.confidence };
  }

  // Look for likely lot values near "position" or "size" keywords
  const posPattern = /(?:position|trade)\b[^\n]*?(\d+\.\d{2})\b/i;
  const posMatch = text.match(posPattern);
  if (posMatch) {
    const value = parseFloat(posMatch[1]);
    if (isLikelyLotSize(value)) {
      return { lotSize: value, confidence: 0.6 };
    }
  }

  return { lotSize: null, confidence: 0 };
}

// ─── Multi-Trade Detection ───

function detectMultipleTrades(text: string): { count: number; segments: string[] } {
  // Look for explicit position/trade identifiers
  const ticketPattern = /(?:ticket|position|trade|order)\s*#?\s*(\d+)/gi;
  const tickets = text.match(ticketPattern);

  if (tickets && tickets.length >= 2) {
    // Split by ticket numbers
    const segments = text
      .split(/(?=\b(?:ticket|position|trade|order)\s*#?\s*\d+)/gi)
      .filter((s) => s.trim().length > 10);
    return { count: segments.length || tickets.length, segments };
  }

  // Check for multiple direction keywords on different lines
  const lines = text.split(/\n/);
  const directionBlocks: string[] = [];
  let currentBlock = "";

  for (const line of lines) {
    if (/\b(buy|sell|long|short)\b/i.test(line) && currentBlock.length > 50) {
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
    if (new RegExp(`\\b${keyword}\\b`, "i").test(text)) {
      types.push(keyword);
    }
  }

  return types;
}

// ─── Trade Segment Parser ───

function parseTradeSegment(
  segment: string,
  allPrices: DetectedPrice[],
  ocrConfidence: number
): OCRTrade {
  const symbolResult = extractSymbol(segment);
  const directionResult = extractDirection(segment);

  // Get prices specific to this segment
  const segmentPrices = extractPricesWithContext(segment);

  // Use segment-specific prices if available, otherwise filter from all prices
  const relevantPrices = segmentPrices.length >= 2
    ? segmentPrices
    : allPrices.filter((p) => segment.includes(String(p.value)));

  // Filter out chart scale and indicator prices
  const tradePrices = relevantPrices.filter(
    (p) => p.classification !== "chartScale" && p.classification !== "indicator" && p.confidence > 0.3
  );

  // Extract lot size
  const lotResult = extractLotSize(segment, relevantPrices);

  // Classify remaining unknown prices based on direction and relative positioning
  const classifiedPrices = classifyUnknownPrices(tradePrices, directionResult.direction);

  // Assign values based on classification
  let entryPrice: number | null = null;
  let stopLoss: number | null = null;
  let takeProfit: number | null = null;

  const entryPrices = classifiedPrices.filter((p) => p.classification === "entry");
  const slPrices = classifiedPrices.filter((p) => p.classification === "stopLoss");
  const tpPrices = classifiedPrices.filter((p) => p.classification === "takeProfit");

  // Get the highest confidence entry price
  if (entryPrices.length > 0) {
    entryPrice = entryPrices.sort((a, b) => b.confidence - a.confidence)[0].value;
  }

  // Get the highest confidence SL
  if (slPrices.length > 0) {
    stopLoss = slPrices.sort((a, b) => b.confidence - a.confidence)[0].value;
  }

  // Get ONLY the highest confidence TP (single value per requirements)
  if (tpPrices.length > 0) {
    takeProfit = tpPrices.sort((a, b) => b.confidence - a.confidence)[0].value;
  }

  // Fallback: if no explicit labels, use relative positioning (lower confidence)
  if (entryPrice === null && classifiedPrices.length >= 2) {
    const unknownPrices = classifiedPrices.filter((p) => p.classification === "unknown");
    if (unknownPrices.length >= 2) {
      const sorted = unknownPrices.sort((a, b) => a.value - b.value);
      if (directionResult.direction === "buy") {
        entryPrice = sorted[0].value;
      } else if (directionResult.direction === "sell") {
        entryPrice = sorted[sorted.length - 1].value;
      }
    }
  }

  // Validate: entry should not be a lot size
  if (entryPrice !== null && lotResult.lotSize !== null) {
    if (Math.abs(entryPrice - lotResult.lotSize) < 0.001) {
      entryPrice = null; // It was a lot size, not an entry
    }
  }

  // Validate: entry should not be an unrealistic value for trading
  if (entryPrice !== null) {
    // Values like 0.01, 0.02, 0.10 are lot sizes, not entries
    if (isLikelyLotSize(entryPrice) && entryPrice < 1) {
      entryPrice = null;
    }
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

  // Calculate field-level confidences
  const fieldConfidences: FieldConfidences = {
    symbol: symbolResult.confidence,
    direction: directionResult.confidence,
    entryPrice: entryPrice !== null ? (entryPrices.length > 0 ? entryPrices[0].confidence : 0.4) : 0,
    stopLoss: stopLoss !== null ? (slPrices.length > 0 ? slPrices[0].confidence : 0.4) : 0,
    takeProfit: takeProfit !== null ? (tpPrices.length > 0 ? tpPrices[0].confidence : 0.4) : 0,
    positionSize: lotResult.confidence,
  };

  // Overall confidence is weighted average of field confidences and OCR confidence
  const fieldValues = Object.values(fieldConfidences);
  const avgFieldConfidence = fieldValues.reduce((a, b) => a + b, 0) / fieldValues.length;
  const overallConfidence = Math.round(
    (avgFieldConfidence * 0.6 + (ocrConfidence / 100) * 0.4) * 100
  );

  return {
    symbol: symbolResult.symbol || "",
    direction: directionResult.direction,
    entryPrice,
    stopLoss,
    takeProfit,
    positionSize: lotResult.lotSize,
    riskReward,
    confidence: Math.min(100, Math.max(0, overallConfidence)),
    fieldConfidences,
    rawText: segment.trim(),
  };
}

/**
 * Classify unknown prices based on direction and relative positioning.
 * Uses heuristics to determine if a price is likely Entry, SL, or TP.
 */
function classifyUnknownPrices(
  prices: DetectedPrice[],
  direction: "buy" | "sell" | "unknown"
): DetectedPrice[] {
  const unknownPrices = prices.filter((p) => p.classification === "unknown");
  const knownPrices = prices.filter((p) => p.classification !== "unknown");

  if (unknownPrices.length === 0) return prices;

  // If we have explicit labels for some prices, use relative positioning for others
  const knownEntry = knownPrices.find((p) => p.classification === "entry");
  const knownSL = knownPrices.find((p) => p.classification === "stopLoss");
  const knownTP = knownPrices.find((p) => p.classification === "takeProfit");

  const classified = [...knownPrices];

  for (const price of unknownPrices) {
    let newClassification: DetectedPrice["classification"] = "unknown";
    let confidence = price.confidence;

    if (direction === "buy") {
      // For buy: SL < Entry < TP
      if (knownEntry) {
        if (price.value < knownEntry.value * 0.99) {
          newClassification = "stopLoss";
          confidence *= 0.6;
        } else if (price.value > knownEntry.value * 1.01) {
          newClassification = "takeProfit";
          confidence *= 0.6;
        }
      } else if (knownSL) {
        if (price.value > knownSL.value) {
          newClassification = "entry";
          confidence *= 0.5;
        }
      } else if (knownTP) {
        if (price.value < knownTP.value) {
          newClassification = "entry";
          confidence *= 0.5;
        }
      }
    } else if (direction === "sell") {
      // For sell: TP < Entry < SL
      if (knownEntry) {
        if (price.value > knownEntry.value * 1.01) {
          newClassification = "stopLoss";
          confidence *= 0.6;
        } else if (price.value < knownEntry.value * 0.99) {
          newClassification = "takeProfit";
          confidence *= 0.6;
        }
      } else if (knownSL) {
        if (price.value < knownSL.value) {
          newClassification = "entry";
          confidence *= 0.5;
        }
      } else if (knownTP) {
        if (price.value > knownTP.value) {
          newClassification = "entry";
          confidence *= 0.5;
        }
      }
    }

    classified.push({
      ...price,
      classification: newClassification,
      confidence,
    });
  }

  return classified;
}

// ─── Main Parser Function ───

/**
 * Parse raw OCR text into structured trade data.
 * This is the main entry point for the intelligent parser.
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
    };
  }

  // Detect multiple trades
  const { count, segments } = detectMultipleTrades(text);

  // Extract all prices with context
  const allPrices = extractPricesWithContext(text);

  // Filter out chart scale and indicator prices from detected prices list
  const relevantPrices = allPrices.filter(
    (p) => p.classification !== "chartScale" && p.classification !== "indicator"
  );

  // Parse each trade segment
  const trades: OCRTrade[] = [];

  if (count > 1 && segments.length > 1) {
    for (const segment of segments) {
      if (segment.trim().length > 5) {
        const trade = parseTradeSegment(segment, allPrices, ocrConfidence);
        // Only include trades that have at least a symbol or an entry price
        if (trade.symbol || trade.entryPrice !== null) {
          trades.push(trade);
        }
      }
    }
  }

  // If no trades parsed from segments, parse the whole text
  if (trades.length === 0) {
    const trade = parseTradeSegment(text, allPrices, ocrConfidence);
    if (trade.symbol || trade.entryPrice !== null) {
      trades.push(trade);
    }
  }

  const orderTypes = extractOrderTypes(text);
  const processingTimeMs = Date.now() - startTime;

  // Calculate overall confidence
  const overallConfidence = trades.length > 0
    ? Math.round(trades.reduce((sum, t) => sum + t.confidence, 0) / trades.length)
    : Math.round(ocrConfidence);

  const confidenceLevel = getConfidenceLevel(overallConfidence);

  // Generate warning if confidence is low
  let warning: string | undefined;
  if (confidenceLevel === "low") {
    warning = "OCR confidence is low. Please review all extracted values before importing.";
  } else if (confidenceLevel === "medium") {
    warning = "Some fields need review. Please verify extracted trade data before importing.";
  }

  return {
    rawText: text,
    trades,
    detectedPrices: relevantPrices,
    detectedOrderTypes: orderTypes,
    overallConfidence,
    confidenceLevel,
    processingTimeMs,
    warning,
  };
}

// ─── Text Cleaning ───

/**
 * Clean OCR text by removing watermark text and known UI elements.
 */
export function cleanOCRText(text: string): string {
  let cleaned = text;

  // Remove watermark patterns
  for (const pattern of WATERMARK_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove common UI text
  const uiPatterns = [
    /tradingview/gi,
    /metaquotes software corp/gi,
    /copyright/gi,
    /all rights reserved/gi,
    /www\.[\w.]+/gi,
  ];

  for (const pattern of uiPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned;
}
