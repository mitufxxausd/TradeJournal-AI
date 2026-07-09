/**
 * OCR Service Types
 * Shared type definitions for OCR providers and parsers.
 * All OCR implementations must conform to these types.
 */

// ─── Trade Detection Result ───

export interface OCRTrade {
  symbol: string;
  direction: "buy" | "sell" | "unknown";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number | null;
  riskReward: number | null;
  confidence: number;
  fieldConfidences: FieldConfidences;
  rawText: string;
}

export interface FieldConfidences {
  symbol: number;
  direction: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
}

// ─── OCR Options ───

export interface OCROptions {
  language?: string;
  imageQuality?: "low" | "medium" | "high";
  onProgress?: (progress: number) => void;
}

// ─── New Confidence Metrics ───

export interface OCRQualityMetrics {
  /** Tesseract OCR engine confidence (0-100) */
  ocrQuality: number;
  /** Parser confidence based on successful parsing (0-100) */
  parserConfidence: number;
  /** Trade completeness based on extracted fields (0-100) */
  tradeCompleteness: number;
  /** Number of fields successfully extracted out of 6 */
  fieldsDetected: number;
  /** Total fields available */
  totalFields: number;
  /** Which fields were detected */
  detectedFields: ExtractedFieldStatus[];
}

export interface ExtractedFieldStatus {
  field: TradeField;
  detected: boolean;
  confidence: number;
  source: "explicit_label" | "context_inference" | "positional" | "none";
}

export type TradeField = "symbol" | "direction" | "entryPrice" | "stopLoss" | "takeProfit" | "positionSize";

// ─── OCR Result ───

export interface OCRResult {
  rawText: string;
  trades: OCRTrade[];
  detectedPrices: DetectedPrice[];
  detectedOrderTypes: string[];
  overallConfidence: number;
  confidenceLevel: "high" | "medium" | "low";
  processingTimeMs: number;
  error?: string;
  warning?: string;
  /** New: Detailed quality metrics */
  qualityMetrics?: OCRQualityMetrics;
}

// ─── Detected Price with Context ───

export interface DetectedPrice {
  value: number;
  context: string;
  classification: "entry" | "stopLoss" | "takeProfit" | "lotSize" | "chartScale" | "indicator" | "unknown";
  confidence: number;
}

// ─── OCR Provider Interface ───

export interface OCRProvider {
  readonly name: string;
  extractText(imageFile: File, options?: OCROptions): Promise<{
    text: string;
    confidence: number;
    processingTimeMs: number;
  }>;
  cancel(): void;
}

// ─── Parser Interface ───

export interface OCRParser {
  readonly name: string;
  parse(text: string, ocrConfidence: number): OCRResult;
}

// ─── Vision Provider Interface (Future-proofing) ───

export interface VisionProvider {
  readonly name: string;
  readonly provider: string;
  analyzeChart(imageFile: File, options?: OCROptions): Promise<OCRResult>;
  isAvailable(): boolean;
}

// ─── Confidence Thresholds ───

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 70,
  LOW: 50,
} as const;

export function getConfidenceLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "high";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export function getConfidenceColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high": return "green";
    case "medium": return "amber";
    case "low": return "red";
  }
}

// ─── Symbol Mapping Constants ───

export const SYMBOL_ALIASES: Record<string, string> = {
  // Gold
  "GOLD": "XAUUSD",
  "GOLD SPOT": "XAUUSD",
  "SPOT GOLD": "XAUUSD",
  "XAU/USD": "XAUUSD",
  "XAU-USD": "XAUUSD",
  "XAU_USD": "XAUUSD",
  // Silver
  "SILVER": "XAGUSD",
  "XAG/USD": "XAGUSD",
  "XAG-USD": "XAGUSD",
  // Bitcoin
  "BTC": "BTCUSD",
  "BITCOIN": "BTCUSD",
  "BTC/USD": "BTCUSD",
  "BTC-USD": "BTCUSD",
  "BTCUSDT": "BTCUSD",
  "BTC_USD": "BTCUSD",
  // Ethereum
  "ETH": "ETHUSD",
  "ETHEREUM": "ETHUSD",
  "ETH/USD": "ETHUSD",
  "ETH-USD": "ETHUSD",
  "ETHUSDT": "ETHUSD",
  // Indices
  "NAS100": "US100",
  "NASDAQ": "US100",
  "NASDAQ100": "US100",
  "US30": "US30",
  "DJ30": "US30",
  "DOW": "US30",
  "DOWJONES": "US30",
  "US500": "US500",
  "SPX": "US500",
  "S&P500": "US500",
  "SP500": "US500",
  // Oil
  "USOIL": "USOIL",
  "WTI": "USOIL",
  "CRUDE": "USOIL",
  "CRUDEOIL": "USOIL",
  "UKOIL": "UKOIL",
  "BRENT": "UKOIL",
  // UK Index
  "UK100": "UK100",
  "FTSE": "UK100",
  "FTSE100": "UK100",
} as const;

export const VALID_TRADING_PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
  "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "EURAUD",
  "EURCAD", "EURCHF", "GBPAUD", "GBPCAD", "GBPCHF", "AUDCAD", "AUDCHF",
  "AUDNZD", "CADCHF", "EURNZD", "GBPNZD", "NZDCAD", "NZDCHF", "NZDJPY",
  "XAUUSD", "XAGUSD", "US30", "US100", "DE40", "UK100", "JP225",
  "BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "BNBUSD", "SOLUSD",
  "USOIL", "UKOIL", "GER40", "NAS100", "US500",
] as const;
