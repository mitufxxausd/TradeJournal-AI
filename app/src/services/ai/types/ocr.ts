/**
 * OCR (Optical Character Recognition) Types
 */

export type OCRFieldType =
  | "symbol"
  | "entry-price"
  | "exit-price"
  | "stop-loss"
  | "take-profit"
  | "position-size"
  | "profit-loss"
  | "date"
  | "time"
  | "broker"
  | "account"
  | "rr-ratio"
  | "spread"
  | "commission"
  | "swap"
  | "order-type"
  | "direction"
  | "timeframe"
  | "balance"
  | "margin"
  | "leverage"
  | "custom";

export interface OCRField {
  id: string;
  type: OCRFieldType;
  label: string;
  value: string;
  confidence: number;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRTradeData {
  symbol?: string;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  profitLoss?: number;
  date?: string;
  time?: string;
  broker?: string;
  account?: string;
  rrRatio?: number;
  spread?: number;
  commission?: number;
  swap?: number;
  orderType?: string;
  direction?: "buy" | "sell";
  timeframe?: string;
  balance?: number;
  margin?: number;
  leverage?: number;
  rawFields: OCRField[];
}

export interface OCRResult {
  text: string;
  tradeData: OCRTradeData;
  fields: OCRField[];
  confidence: number;
  processingTimeMs: number;
  metadata: {
    engine: string;
    imageSize?: { width: number; height: number };
    processedAt: string;
  };
}

export interface OCROptions {
  extractTradeData?: boolean;
  supportedFields?: OCRFieldType[];
  confidenceThreshold?: number;
  language?: string;
}
