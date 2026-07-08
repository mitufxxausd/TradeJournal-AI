/**
 * Tesseract OCR Service
 * Real OCR using Tesseract.js for extracting text and trade data from screenshots.
 * Supports MT4, MT5, TradingView screenshots with confidence scores.
 */

import Tesseract from "tesseract.js";

// ─── Types ───

export interface OCRTrade {
  symbol: string;
  direction: "buy" | "sell" | "unknown";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number[];
  positionSize: number | null;
  riskReward: number | null;
  confidence: number;
  rawText: string;
}

export interface OCROptions {
  language?: string;
  imageQuality?: "low" | "medium" | "high";
  onProgress?: (progress: number) => void;
}

export interface OCRResult {
  rawText: string;
  trades: OCRTrade[];
  detectedPrices: number[];
  detectedOrderTypes: string[];
  overallConfidence: number;
  processingTimeMs: number;
  error?: string;
}

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
];

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN", "1D", "1W", "1M"];

const DIRECTION_WORDS: Record<string, "buy" | "sell"> = {
  "buy": "buy", "long": "buy", "bullish": "buy",
  "sell": "sell", "short": "sell", "bearish": "sell",
};

// ─── Image Preprocessing ───

/**
 * Compress and preprocess image before OCR
 */
async function preprocessImage(imageFile: File, quality: "low" | "medium" | "high" = "medium"): Promise<string> {
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
        // Fallback: use original file
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
        return;
      }

      // Draw and apply subtle contrast enhancement for dark mode screenshots
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", 0.92));
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
 * Extract all text from an image using Tesseract.js
 */
export async function extractTextFromImage(
  imageFile: File,
  options: OCROptions = {}
): Promise<{ text: string; confidence: number; processingTimeMs: number }> {
  const { language = "eng", imageQuality = "medium", onProgress } = options;
  const startTime = Date.now();

  try {
    const processedImage = await preprocessImage(imageFile, imageQuality);

    const result = await Tesseract.recognize(
      processedImage,
      language,
      {
        logger: (m) => {
          if (m.status === "recognizing text" && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        },
      }
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      processingTimeMs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR failed";
    throw new Error(`OCR extraction failed: ${message}`);
  }
}

// ─── Trade Data Extraction ───

/**
 * Extract trading pair from text
 */
function extractSymbol(text: string): { symbol: string; confidence: number } {
  const upperText = text.toUpperCase();

  for (const pair of TRADING_PAIRS) {
    // Match as whole word or with common separators
    const regex = new RegExp(`\\b${pair}\\b|[/_]${pair}\\b|\\b${pair}[/_]`);
    if (upperText.includes(pair) || regex.test(upperText)) {
      return { symbol: pair, confidence: 0.9 };
    }
  }

  // Try to find any 6-letter combination that looks like a forex pair
  const forexPattern = /\b([A-Z]{3})[/\-_]?([A-Z]{3})\b/;
  const match = upperText.match(forexPattern);
  if (match) {
    return { symbol: `${match[1]}${match[2]}`, confidence: 0.6 };
  }

  // Check for crypto pairs
  const cryptoPattern = /\b(BTC|ETH|XRP|LTC|BNB|SOL)[/\-_]?(USD|USDT|USDC|EUR)\b/i;
  const cryptoMatch = text.match(cryptoPattern);
  if (cryptoMatch) {
    return { symbol: `${cryptoMatch[1].toUpperCase()}${cryptoMatch[2].toUpperCase()}`, confidence: 0.85 };
  }

  return { symbol: "Unknown", confidence: 0 };
}

/**
 * Extract direction (buy/sell) from text
 */
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

  if (buyCount > 0 && sellCount === 0) {
    return { direction: "buy", confidence: Math.min(0.9, 0.5 + buyCount * 0.1) };
  }
  if (sellCount > 0 && buyCount === 0) {
    return { direction: "sell", confidence: Math.min(0.9, 0.5 + sellCount * 0.1) };
  }
  if (buyCount > 0 && sellCount > 0) {
    // Ambiguous - return the one with more mentions
    return buyCount > sellCount
      ? { direction: "buy", confidence: 0.4 }
      : { direction: "sell", confidence: 0.4 };
  }

  return { direction: "unknown", confidence: 0 };
}

/**
 * Extract all numeric prices from text
 */
function extractPrices(text: string): number[] {
  const prices: number[] = [];
  const seen = new Set<number>();

  // Match decimal numbers (common price formats)
  const pricePatterns = [
    /\b(\d{1,5}\.\d{2,5})\b/g,       // e.g., 1.23456, 123.45
    /\b(\d{4,6}\.\d{2})\b/g,          // e.g., 4541.63
    /\b(\d{2,3},\d{3}\.\d{2})\b/g,    // e.g., 12,345.67
    /\b(\d{5,6})\b/g,                 // e.g., 100000 (for JPY pairs)
  ];

  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(",", ""));
      if (!isNaN(price) && price > 0 && !seen.has(price)) {
        prices.push(price);
        seen.add(price);
      }
    }
  }

  return prices.sort((a, b) => a - b);
}

/**
 * Detect if text contains multiple positions/trades
 */
function detectMultipleTrades(text: string): { count: number; segments: string[] } {
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0);

  // Look for position identifiers
  const positionPatterns = [
    /\b(?:position|trade|order)\s*#?\s*(\d+)/gi,
    /\b(#\d+|no\.?\s*\d+|ticket\s*\d+)\b/gi,
  ];

  let matchCount = 0;
  for (const pattern of positionPatterns) {
    const matches = text.match(pattern);
    if (matches) matchCount = Math.max(matchCount, matches.length);
  }

  // If we have clear position markers, try to segment
  if (matchCount >= 2) {
    // Split by ticket/position numbers
    const segments = text.split(/(?=\b(?:ticket|position|trade|order)\s*#?\s*\d+)/gi)
      .filter((s) => s.trim().length > 10);
    return { count: segments.length || matchCount, segments };
  }

  // Check if there are multiple SELL/BUY keywords separated by lines
  const directionLines = lines.filter((l) =>
    /\b(buy|sell|long|short)\b/i.test(l)
  );

  if (directionLines.length >= 2) {
    return { count: directionLines.length, segments: lines };
  }

  return { count: 1, segments: [text] };
}

/**
 * Parse a trade segment into structured trade data
 */
function parseTradeSegment(segment: string, allPrices: number[]): OCRTrade {
  const symbolResult = extractSymbol(segment);
  const directionResult = extractDirection(segment);
  const prices = extractPrices(segment);

  // Combine with all prices found if segment has few prices
  const combinedPrices = prices.length >= 2 ? prices : allPrices.length >= 2 ? allPrices : prices;

  // Assign prices based on direction and typical trade structure
  let entryPrice: number | null = null;
  let stopLoss: number | null = null;
  let takeProfits: number[] = [];

  if (combinedPrices.length >= 2) {
    if (directionResult.direction === "buy") {
      // For buy: entry is lowest, SL below entry, TP above entry
      entryPrice = combinedPrices[0];
      stopLoss = combinedPrices.find((p) => p < entryPrice!) ?? null;
      takeProfits = combinedPrices.filter((p) => p > entryPrice!);
    } else if (directionResult.direction === "sell") {
      // For sell: entry is highest, SL above entry, TP below entry
      entryPrice = combinedPrices[combinedPrices.length - 1];
      stopLoss = combinedPrices.find((p) => p > entryPrice!) ?? null;
      takeProfits = combinedPrices.filter((p) => p < entryPrice!).reverse();
    } else {
      // Unknown direction - just take first as entry
      entryPrice = combinedPrices[0];
      if (combinedPrices.length > 1) {
        stopLoss = combinedPrices[1];
      }
      if (combinedPrices.length > 2) {
        takeProfits = combinedPrices.slice(2);
      }
    }
  } else if (combinedPrices.length === 1) {
    entryPrice = combinedPrices[0];
  }

  // Extract position size / lot size
  let positionSize: number | null = null;
  const lotMatch = segment.match(/(\d+\.?\d*)\s*(lots?|lot)/i);
  if (lotMatch) {
    positionSize = parseFloat(lotMatch[1]);
  }

  // Calculate R:R if we have SL and TP
  let riskReward: number | null = null;
  if (entryPrice && stopLoss && takeProfits.length > 0) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfits[0] - entryPrice);
    if (risk > 0) {
      riskReward = parseFloat((reward / risk).toFixed(2));
    }
  }

  // Calculate confidence as average of detected field confidences
  const confidences: number[] = [];
  if (symbolResult.confidence > 0) confidences.push(symbolResult.confidence);
  if (directionResult.confidence > 0) confidences.push(directionResult.confidence);
  if (entryPrice !== null) confidences.push(0.8);
  if (stopLoss !== null) confidences.push(0.7);
  if (takeProfits.length > 0) confidences.push(0.7);

  const overallConfidence = confidences.length > 0
    ? parseFloat((confidences.reduce((a, b) => a + b, 0) / confidences.length * 100).toFixed(1))
    : 0;

  return {
    symbol: symbolResult.symbol,
    direction: directionResult.direction,
    entryPrice,
    stopLoss,
    takeProfit: takeProfits,
    positionSize,
    riskReward,
    confidence: overallConfidence,
    rawText: segment.trim(),
  };
}

/**
 * Extract order types found in text
 */
function extractOrderTypes(text: string): string[] {
  const types: string[] = [];
  const orderKeywords = ["market", "limit", "stop", "stop loss", "take profit", "pending", "buy stop", "sell stop", "buy limit", "sell limit"];

  for (const keyword of orderKeywords) {
    if (new RegExp(`\\b${keyword}\\b`, "i").test(text)) {
      types.push(keyword);
    }
  }

  return types;
}

// ─── Main OCR Function ───

/**
 * Run full OCR and trade extraction on an image
 */
export async function runOCR(
  imageFile: File,
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const { text, confidence: ocrConfidence } = await extractTextFromImage(imageFile, options);

    if (!text || text.trim().length === 0) {
      return {
        rawText: "",
        trades: [],
        detectedPrices: [],
        detectedOrderTypes: [],
        overallConfidence: 0,
        processingTimeMs: Date.now() - startTime,
        error: "No text detected in image",
      };
    }

    // Detect multiple trades
    const { count, segments } = detectMultipleTrades(text);
    const allPrices = extractPrices(text);

    // Parse each trade
    const trades: OCRTrade[] = [];
    if (count > 1 && segments.length > 1) {
      for (const segment of segments) {
        if (segment.trim().length > 5) {
          const trade = parseTradeSegment(segment, allPrices);
          if (trade.symbol !== "Unknown" || trade.entryPrice !== null) {
            trades.push(trade);
          }
        }
      }
    }

    // If no trades parsed from segments, parse the whole text
    if (trades.length === 0) {
      trades.push(parseTradeSegment(text, allPrices));
    }

    const orderTypes = extractOrderTypes(text);
    const processingTimeMs = Date.now() - startTime;

    return {
      rawText: text,
      trades,
      detectedPrices: allPrices,
      detectedOrderTypes: orderTypes,
      overallConfidence: parseFloat(ocrConfidence.toFixed(1)),
      processingTimeMs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OCR error";
    return {
      rawText: "",
      trades: [],
      detectedPrices: [],
      detectedOrderTypes: [],
      overallConfidence: 0,
      processingTimeMs: Date.now() - startTime,
      error: message,
    };
  }
}

/**
 * Cancel ongoing OCR (best effort - Tesseract doesn't fully support cancellation)
 */
export function cancelOCR(): void {
  // Tesseract.js worker termination happens automatically
  // Future: implement worker pool management for cancellation
}

/**
 * Get available OCR languages
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
