/**
 * Symbol Detector
 * Advanced symbol detection from OCR text with multi-source search.
 *
 * Searches across multiple contexts:
 * - Window title / page title
 * - Chart title
 * - Broker title
 * - Watchlist / market panel
 * - OCR text blocks
 *
 * Recognizes standard aliases:
 * XAUUSD ↔ GOLD, BTCUSD ↔ BTCUSDT, NAS100 ↔ US100, etc.
 *
 * Returns normalized standard symbols. Never returns "Undetected".
 * If confidence is low, returns empty string with a note.
 */

import { SYMBOL_ALIASES, VALID_TRADING_PAIRS } from "./types";

// ─── Symbol Alias Map (extended) ───

const EXTENDED_ALIASES: Record<string, string> = {
  ...SYMBOL_ALIASES,
  // Gold variations
  "XAU/USD": "XAUUSD",
  "XAU-USD": "XAUUSD",
  "XAU_USD": "XAUUSD",
  "SPOT GOLD": "XAUUSD",
  "GOLD SPOT": "XAUUSD",
  // Silver variations
  "XAG/USD": "XAGUSD",
  "XAG-USD": "XAGUSD",
  "XAG_USD": "XAGUSD",
  // Bitcoin variations
  "BTC/USD": "BTCUSD",
  "BTC-USD": "BTCUSD",
  "BTC_USD": "BTCUSD",
  "BTCUSDT": "BTCUSD",
  "BTC/USDT": "BTCUSD",
  "BITCOIN": "BTCUSD",
  // Ethereum variations
  "ETH/USD": "ETHUSD",
  "ETH-USD": "ETHUSD",
  "ETH_USD": "ETHUSD",
  "ETHUSDT": "ETHUSD",
  "ETH/USDT": "ETHUSD",
  "ETHEREUM": "ETHUSD",
  // Indices
  "NAS100": "US100",
  "NASDAQ": "US100",
  "NASDAQ100": "US100",
  "NASDAQ 100": "US100",
  "US100": "US100",
  "US30": "US30",
  "DJ30": "US30",
  "DOW": "US30",
  "DOWJONES": "US30",
  "DOW JONES": "US30",
  "US500": "US500",
  "SPX": "US500",
  "S&P500": "US500",
  "SP500": "US500",
  "S&P 500": "US500",
  // Germany
  "GER40": "DE40",
  "DAX": "DE40",
  "DE40": "DE40",
  // Oil
  "USOIL": "USOIL",
  "WTI": "USOIL",
  "CRUDE": "USOIL",
  "CRUDEOIL": "USOIL",
  "CRUDE OIL": "USOIL",
  "UKOIL": "UKOIL",
  "BRENT": "UKOIL",
  // UK
  "UK100": "UK100",
  "FTSE": "UK100",
  "FTSE100": "UK100",
  "FTSE 100": "UK100",
};

// ─── Detection Result ───

export interface SymbolDetectionResult {
  symbol: string;
  confidence: number;
  source: SymbolSource;
  matchedText: string;
}

export type SymbolSource =
  | "exact_pair"
  | "alias"
  | "separator_format"
  | "crypto_format"
  | "compact_format"
  | "commodity_keyword"
  | "none";

// ─── Main Detection Function ───

/**
 * Detect trading symbol from OCR text using multiple strategies.
 * Returns empty string if no symbol is found (never returns "Undetected").
 */
export function detectSymbol(text: string): SymbolDetectionResult {
  if (!text || text.trim().length === 0) {
    return { symbol: "", confidence: 0, source: "none", matchedText: "" };
  }

  const upperText = text.toUpperCase();

  // Strategy 1: Check extended aliases (highest confidence for "Gold Spot" → XAUUSD)
  for (const [alias, standardSymbol] of Object.entries(EXTENDED_ALIASES)) {
    const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
    if (regex.test(text)) {
      return {
        symbol: standardSymbol,
        confidence: 0.95,
        source: "alias",
        matchedText: alias,
      };
    }
  }

  // Strategy 2: Direct match for known trading pairs
  for (const pair of VALID_TRADING_PAIRS) {
    const regex = new RegExp(`\\b${pair}\\b`, "i");
    if (regex.test(upperText)) {
      return {
        symbol: pair,
        confidence: 0.95,
        source: "exact_pair",
        matchedText: pair,
      };
    }
  }

  // Strategy 3: Match with separators: EUR/USD, EUR_USD, EUR-USD
  const forexPattern = /\b([A-Z]{3})[/\-_]?([A-Z]{3})\b/;
  const forexMatch = text.match(forexPattern);
  if (forexMatch) {
    const combined = `${forexMatch[1]}${forexMatch[2]}`;
    return {
      symbol: combined,
      confidence: 0.85,
      source: "separator_format",
      matchedText: `${forexMatch[1]}/${forexMatch[2]}`,
    };
  }

  // Strategy 4: Crypto pairs: BTC/USD, BTCUSDT, etc.
  const cryptoPattern = /\b(BTC|ETH|XRP|LTC|BNB|SOL|ADA|DOT|AVAX|LINK)[/\-_]?(USD|USDT|USDC|EUR|BTC|ETH)\b/i;
  const cryptoMatch = text.match(cryptoPattern);
  if (cryptoMatch) {
    const base = cryptoMatch[1].toUpperCase();
    const quote = cryptoMatch[2].toUpperCase();
    const normalizedQuote = quote === "USDT" ? "USD" : quote;
    return {
      symbol: `${base}${normalizedQuote}`,
      confidence: 0.85,
      source: "crypto_format",
      matchedText: `${base}${quote}`,
    };
  }

  // Strategy 5: Compact 6-char forex patterns (e.g., EURUSD)
  const compactPattern = /\b([A-Z]{3}(?:USD|EUR|JPY|GBP|CAD|CHF|AUD|NZD))\b/i;
  const compactMatch = text.match(compactPattern);
  if (compactMatch) {
    return {
      symbol: compactMatch[1].toUpperCase(),
      confidence: 0.7,
      source: "compact_format",
      matchedText: compactMatch[1],
    };
  }

  // Strategy 6: Commodity keywords with lower confidence
  if (/\b(gold|xau|au)\b/i.test(text)) {
    return { symbol: "XAUUSD", confidence: 0.7, source: "commodity_keyword", matchedText: "gold" };
  }
  if (/\b(silver|xag|ag)\b/i.test(text)) {
    return { symbol: "XAGUSD", confidence: 0.7, source: "commodity_keyword", matchedText: "silver" };
  }
  if (/\b(wti|brent|crude|oil)\b/i.test(text)) {
    return { symbol: "USOIL", confidence: 0.6, source: "commodity_keyword", matchedText: "oil" };
  }

  // No symbol detected
  return { symbol: "", confidence: 0, source: "none", matchedText: "" };
}

// ─── Multi-Source Symbol Detection ───

/**
 * Search for a symbol across multiple text sources (window title, chart title, OCR blocks).
 * Returns the highest-confidence match.
 */
export function detectSymbolFromSources(sources: Record<string, string | null>): SymbolDetectionResult {
  const sourcePriority = [
    "windowTitle",
    "chartTitle",
    "brokerTitle",
    "watchlist",
    "marketPanel",
    "ocrText",
  ];

  let bestResult: SymbolDetectionResult = { symbol: "", confidence: 0, source: "none", matchedText: "" };

  for (const sourceKey of sourcePriority) {
    const text = sources[sourceKey];
    if (!text || text.trim().length === 0) continue;

    const result = detectSymbol(text);
    if (result.confidence > bestResult.confidence) {
      bestResult = result;
    }

    // Early exit if we found a high-confidence exact match
    if (bestResult.confidence >= 0.95) break;
  }

  return bestResult;
}

// ─── Symbol Normalization ───

/**
 * Normalize a symbol to its standard form.
 * e.g., "Gold Spot" → "XAUUSD", "BTCUSDT" → "BTCUSD"
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return "";
  const upper = symbol.toUpperCase().trim();

  // Check aliases
  if (EXTENDED_ALIASES[upper]) {
    return EXTENDED_ALIASES[upper];
  }

  // Already a valid pair
  if (VALID_TRADING_PAIRS.includes(upper as typeof VALID_TRADING_PAIRS[number])) {
    return upper;
  }

  // Try with separators removed
  const clean = upper.replace(/[/\-_\s]/g, "");
  if (VALID_TRADING_PAIRS.includes(clean as typeof VALID_TRADING_PAIRS[number])) {
    return clean;
  }

  // Return as-is if we can't normalize
  return upper;
}

// ─── Utility ───

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
