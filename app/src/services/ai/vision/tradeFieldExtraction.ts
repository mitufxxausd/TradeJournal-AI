/**
 * Trade Field Extraction
 * Extracts individual trade fields with confidence scores.
 *
 * Only detects:
 *  - Symbol
 *  - Direction
 *  - Entry Price
 *  - Stop Loss
 *  - Take Profit
 *  - Lot Size
 *
 * Every field has its own confidence score.
 * Never guesses missing values.
 */

import type {
  ExtractedTradeFields,
  FieldExtraction,
  FieldExtractionStatus,
  FieldSource,
  PipelineContext,
  PipelineStageResult,
} from "./pipeline";
import type { OCRTrade, OCRResult } from "@/services/ocr/types";
import type { DetectedImageRegion, DetectedSymbolResult } from "./pipeline";
import { detectSymbolWithRegions } from "./symbolDetection";
import { getTradeRelevantText } from "./regionDetection";

// ─── Field Extraction Confidence Thresholds ───

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
} as const;

// ─── Field Extractors ───

interface FieldExtractor<T> {
  field: keyof ExtractedTradeFields;
  extract(
    ocrText: string,
    ocrTrade: OCRTrade | null,
    regions: DetectedImageRegion[],
    symbolResult: DetectedSymbolResult | null
  ): FieldExtraction<T>;
}

// ─── Symbol Extractor ───

const symbolExtractor: FieldExtractor<string | null> = {
  field: "symbol",
  extract(_ocrText, _ocrTrade, regions, symbolResult) {
    if (symbolResult && symbolResult.symbol) {
      const confidence = symbolResult.confidence;
      return {
        value: symbolResult.symbol,
        confidence,
        source: symbolResult.source,
        status: confidence >= CONFIDENCE_THRESHOLDS.HIGH ? "detected" : "needs_review",
        needsReview: confidence < CONFIDENCE_THRESHOLDS.HIGH,
        alternatives: [],
      };
    }

    // Fallback to region-based detection
    if (regions.length > 0) {
      const regionSymbol = detectSymbolWithRegions(regions, "");
      if (regionSymbol.symbol) {
        const confidence = regionSymbol.confidence * 0.8; // Penalty for fallback
        return {
          value: regionSymbol.symbol,
          confidence,
          source: regionSymbol.source,
          status: "needs_review",
          needsReview: true,
          alternatives: [],
        };
      }
    }

    return createMissingField<string | null>(null, "none");
  },
};

// ─── Direction Extractor ───

const directionExtractor: FieldExtractor<"buy" | "sell" | null> = {
  field: "direction",
  extract(ocrText, ocrTrade, _regions, _symbolResult) {
    // Use OCR trade result first
    if (ocrTrade && ocrTrade.direction !== "unknown") {
      const direction = ocrTrade.direction as "buy" | "sell";
      const confidence = ocrTrade.fieldConfidences.direction;
      return {
        value: direction,
        confidence,
        source: "ocr_explicit_label",
        status: confidence >= CONFIDENCE_THRESHOLDS.HIGH ? "detected" : "needs_review",
        needsReview: confidence < CONFIDENCE_THRESHOLDS.HIGH,
        alternatives: [],
      };
    }

    // Direct text extraction
    const lowerText = ocrText.toLowerCase();

    const buyPatterns = [
      /\bbuy\b/i, /\blong\b/i, /\bbuy\s*(?:limit|stop|market)?\b/i,
      /\border\s*[:\s=]*\s*buy\b/i, /\btype\s*[:\s=]*\s*buy\b/i,
    ];

    const sellPatterns = [
      /\bsell\b/i, /\bshort\b/i, /\bsell\s*(?:limit|stop|market)?\b/i,
      /\border\s*[:\s=]*\s*sell\b/i, /\btype\s*[:\s=]*\s*sell\b/i,
    ];

    for (const pattern of buyPatterns) {
      if (pattern.test(ocrText)) {
        return {
          value: "buy",
          confidence: 0.9,
          source: "ocr_explicit_label",
          status: "detected",
          needsReview: false,
          alternatives: [],
        };
      }
    }

    for (const pattern of sellPatterns) {
      if (pattern.test(ocrText)) {
        return {
          value: "sell",
          confidence: 0.9,
          source: "ocr_explicit_label",
          status: "detected",
          needsReview: false,
          alternatives: [],
        };
      }
    }

    return createMissingField<"buy" | "sell" | null>(null, "none");
  },
};

// ─── Price Extractors ───

function createPriceExtractor(
  field: "entryPrice" | "stopLoss" | "takeProfit",
  explicitPatterns: RegExp[],
  contextPatterns: RegExp[]
): FieldExtractor<number | null> {
  return {
    field,
    extract(ocrText, ocrTrade, _regions, _symbolResult) {
      // Use OCR trade result first
      if (ocrTrade) {
        const value = ocrTrade[field];
        if (value !== null && value !== undefined) {
          const confidence = ocrTrade.fieldConfidences[field];
          return {
            value,
            confidence,
            source: "ocr_explicit_label",
            status: confidence >= CONFIDENCE_THRESHOLDS.HIGH ? "detected" : "needs_review",
            needsReview: confidence < CONFIDENCE_THRESHOLDS.HIGH,
            alternatives: [],
          };
        }
      }

      // Direct pattern matching from OCR text
      const lines = ocrText.split("\n");

      for (const line of lines) {
        for (const pattern of explicitPatterns) {
          const match = line.match(pattern);
          if (match) {
            const value = parseFloat(match[1].replace(/,/g, ""));
            if (!isNaN(value) && value > 0) {
              return {
                value,
                confidence: 0.9,
                source: "ocr_explicit_label",
                status: "detected",
                needsReview: false,
                alternatives: [],
              };
            }
          }
        }
      }

      // Context-based matching (lower confidence)
      for (const line of lines) {
        for (const pattern of contextPatterns) {
          if (pattern.test(line)) {
            const numberMatch = line.match(/(\d+(?:[.,]\d+)*)/);
            if (numberMatch) {
              const value = parseFloat(numberMatch[1].replace(/,/g, ""));
              if (!isNaN(value) && value > 0) {
                return {
                  value,
                  confidence: 0.5,
                  source: "ocr_context",
                  status: "needs_review",
                  needsReview: true,
                  alternatives: [],
                };
              }
            }
          }
        }
      }

      return createMissingField<number | null>(null, "none");
    },
  };
}

const entryPriceExtractor = createPriceExtractor(
  "entryPrice",
  [
    /(?:entry|open|price)\s*[\s:=]+\s*(\d+(?:[.,]\d+)*)/i,
    /(?:entry|open)\s*(?:price)?\s*[@\s]*\s*(\d+(?:[.,]\d+)*)/i,
    /@\s*(\d+(?:[.,]\d+)*)/,
  ],
  [
    /(?:entry|open|buy|sell|long|short)/i,
  ]
);

const stopLossExtractor = createPriceExtractor(
  "stopLoss",
  [
    /(?:sl|stop\s*loss)\s*[\s:=]+\s*(\d+(?:[.,]\d+)*)/i,
    /(?:sl|stop)\s*(?:loss)?\s*[@\s]*\s*(\d+(?:[.,]\d+)*)/i,
    /(?:sl)\s*[:\s]*\s*(\d+(?:[.,]\d+)*)/i,
  ],
  [
    /(?:sl|stop\s*loss)/i,
  ]
);

const takeProfitExtractor = createPriceExtractor(
  "takeProfit",
  [
    /(?:tp|take\s*profit|target)\s*[\s:=]+\s*(\d+(?:[.,]\d+)*)/i,
    /(?:tp|take\s*profit)\s*(?:price)?\s*[@\s]*\s*(\d+(?:[.,]\d+)*)/i,
    /(?:tp)\s*[:\s]*\s*(\d+(?:[.,]\d+)*)/i,
  ],
  [
    /(?:tp|take\s*profit|target)/i,
  ]
);

// ─── Position Size Extractor ───

const positionSizeExtractor: FieldExtractor<number | null> = {
  field: "positionSize",
  extract(ocrText, ocrTrade, _regions, _symbolResult) {
    // Use OCR trade result first
    if (ocrTrade && ocrTrade.positionSize !== null) {
      const confidence = ocrTrade.fieldConfidences.positionSize;
      return {
        value: ocrTrade.positionSize,
        confidence,
        source: "ocr_explicit_label",
        status: confidence >= CONFIDENCE_THRESHOLDS.HIGH ? "detected" : "needs_review",
        needsReview: confidence < CONFIDENCE_THRESHOLDS.HIGH,
        alternatives: [],
      };
    }

    // Direct pattern matching
    const patterns = [
      /(?:lot|volume|qty|quantity|size)\s*[\s:=]+\s*(\d+\.?\d*)/i,
      /(?:pos\s*size|position\s*size)\s*[\s:=]+\s*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*(?:lot|lots)\b/i,
    ];

    for (const pattern of patterns) {
      const match = ocrText.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value > 0 && value < 1000) {
          return {
            value,
            confidence: 0.9,
            source: "ocr_explicit_label",
            status: "detected",
            needsReview: false,
            alternatives: [],
          };
        }
      }
    }

    return createMissingField<number | null>(null, "none");
  },
};

// ─── Broker Extractor ───

const brokerExtractor: FieldExtractor<string | null> = {
  field: "broker",
  extract(ocrText, _ocrTrade, _regions, _symbolResult) {
    const brokerPatterns: Array<{ name: string; patterns: RegExp[] }> = [
      { name: "TradingView", patterns: [/\bTradingView\b/i] },
      { name: "MetaTrader 5", patterns: [/\bMetaTrader\s*5\b/i, /\bMT5\b/] },
      { name: "MetaTrader 4", patterns: [/\bMetaTrader\s*4\b/i, /\bMT4\b/] },
      { name: "cTrader", patterns: [/\bcTrader\b/i] },
      { name: "NinjaTrader", patterns: [/\bNinjaTrader\b/i] },
      { name: "OANDA", patterns: [/\bOANDA\b/i] },
      { name: "Forex.com", patterns: [/\bForex\.com\b/i] },
      { name: "IG", patterns: [/\bIG\s+(?:Trading|Markets)\b/i] },
      { name: "XM", patterns: [/\bXM\s+(?:Global|Trading)\b/i] },
      { name: "Pepperstone", patterns: [/\bPepperstone\b/i] },
    ];

    for (const broker of brokerPatterns) {
      for (const pattern of broker.patterns) {
        if (pattern.test(ocrText)) {
          return {
            value: broker.name,
            confidence: 0.95,
            source: "broker_title",
            status: "detected",
            needsReview: false,
            alternatives: brokerPatterns.map((b) => b.name),
          };
        }
      }
    }

    return createMissingField<string | null>(null, "none");
  },
};

// ─── Helper Functions ───

function createMissingField<T>(
  value: T,
  source: FieldSource
): FieldExtraction<T> {
  return {
    value,
    confidence: 0,
    source,
    status: "missing",
    needsReview: true,
    alternatives: [],
  };
}

// ─── Main Extraction Function ───

export interface TradeFieldExtractionInput {
  ocrResult: OCRResult | null;
  regions: DetectedImageRegion[];
  symbolResult?: DetectedSymbolResult | null;
}

export interface TradeFieldExtractionResult {
  fields: ExtractedTradeFields;
  confidence: number;
  status: FieldExtractionStatus;
  needsReview: boolean;
  detectedCount: number;
  totalCount: number;
  processingTimeMs: number;
}

/**
 * Extract trade fields from OCR result and detected regions.
 */
export function extractTradeFields(
  input: TradeFieldExtractionInput
): TradeFieldExtractionResult {
  const startTime = Date.now();
  const { ocrResult, regions, symbolResult } = input;

  const ocrText = ocrResult?.rawText || "";
  const ocrTrade = ocrResult?.trades?.[0] || null;

  // Run all extractors
  const symbol = symbolExtractor.extract(ocrText, ocrTrade, regions, symbolResult || null);
  const direction = directionExtractor.extract(ocrText, ocrTrade, regions, symbolResult || null);
  const entryPrice = entryPriceExtractor.extract(ocrText, ocrTrade, regions, symbolResult || null);
  const stopLoss = stopLossExtractor.extract(ocrText, ocrTrade, regions, symbolResult || null);
  const takeProfit = takeProfitExtractor.extract(ocrText, ocrTrade, regions, symbolResult || null);
  const positionSize = positionSizeExtractor.extract(ocrText, ocrTrade, regions, symbolResult || null);
  const broker = brokerExtractor.extract(ocrText, ocrTrade, regions, symbolResult || null);

  const fields: ExtractedTradeFields = {
    symbol,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    positionSize,
    broker,
    overallConfidence: 0,
  };

  // Calculate overall confidence
  const fieldValues = [symbol, direction, entryPrice, stopLoss, takeProfit, positionSize];
  const detectedCount = fieldValues.filter((f) => f.status === "detected").length;
  const totalCount = 6; // core fields (excluding broker)

  const avgConfidence = fieldValues.reduce((sum, f) => sum + f.confidence, 0) / fieldValues.length;
  fields.overallConfidence = Math.round(avgConfidence * 100) / 100;

  const hasMissingCritical = !symbol.value || !direction.value || entryPrice.value === null;
  const status: FieldExtractionStatus = hasMissingCritical
    ? "needs_review"
    : fields.overallConfidence >= CONFIDENCE_THRESHOLDS.HIGH
    ? "detected"
    : fields.overallConfidence >= CONFIDENCE_THRESHOLDS.MEDIUM
    ? "needs_review"
    : "missing";

  const processingTimeMs = Date.now() - startTime;

  return {
    fields,
    confidence: fields.overallConfidence,
    status,
    needsReview: status !== "detected",
    detectedCount,
    totalCount,
    processingTimeMs,
  };
}

// ─── Pipeline Integration ───

export async function runTradeFieldExtractionStage(
  input: TradeFieldExtractionInput,
  _context: PipelineContext
): Promise<PipelineStageResult<TradeFieldExtractionResult>> {
  const startTime = Date.now();

  try {
    const result = extractTradeFields(input);

    return {
      stage: "trade_field_extraction",
      success: true,
      output: result,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      stage: "trade_field_extraction",
      success: false,
      output: {
        fields: {
          symbol: { value: null, confidence: 0, source: "none", status: "missing", needsReview: true, alternatives: [] },
          direction: { value: null, confidence: 0, source: "none", status: "missing", needsReview: true, alternatives: [] },
          entryPrice: { value: null, confidence: 0, source: "none", status: "missing", needsReview: true, alternatives: [] },
          stopLoss: { value: null, confidence: 0, source: "none", status: "missing", needsReview: true, alternatives: [] },
          takeProfit: { value: null, confidence: 0, source: "none", status: "missing", needsReview: true, alternatives: [] },
          positionSize: { value: null, confidence: 0, source: "none", status: "missing", needsReview: true, alternatives: [] },
          broker: { value: null, confidence: 0, source: "none", status: "missing", needsReview: true, alternatives: [] },
          overallConfidence: 0,
        },
        confidence: 0,
        status: "missing",
        needsReview: true,
        detectedCount: 0,
        totalCount: 6,
        processingTimeMs: Date.now() - startTime,
      },
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Trade field extraction failed",
    };
  }
}

// ─── Utility Functions ───

/**
 * Get fields that need user review.
 */
export function getFieldsNeedingReview(
  fields: ExtractedTradeFields
): Array<{ field: string; extraction: FieldExtraction<unknown> }> {
  const result: Array<{ field: string; extraction: FieldExtraction<unknown> }> = [];

  for (const [key, value] of Object.entries(fields)) {
    if (key === "overallConfidence") continue;
    const extraction = value as FieldExtraction<unknown>;
    if (extraction.needsReview) {
      result.push({ field: key, extraction });
    }
  }

  return result;
}

/**
 * Check if all critical fields are detected.
 */
export function areCriticalFieldsDetected(fields: ExtractedTradeFields): boolean {
  return (
    fields.symbol.status === "detected" &&
    fields.direction.status === "detected" &&
    fields.entryPrice.status === "detected" &&
    fields.stopLoss.status === "detected" &&
    fields.takeProfit.status === "detected"
  );
}

/**
 * Convert extracted fields to OCRTrade format (backward compatibility).
 */
export function extractedFieldsToOCRTrade(fields: ExtractedTradeFields): OCRTrade {
  return {
    symbol: fields.symbol.value || "",
    direction: fields.direction.value || "unknown",
    entryPrice: fields.entryPrice.value,
    stopLoss: fields.stopLoss.value,
    takeProfit: fields.takeProfit.value,
    positionSize: fields.positionSize.value,
    riskReward: calculateRiskReward(fields),
    confidence: Math.round(fields.overallConfidence * 100),
    fieldConfidences: {
      symbol: Math.round(fields.symbol.confidence * 100),
      direction: Math.round(fields.direction.confidence * 100),
      entryPrice: Math.round(fields.entryPrice.confidence * 100),
      stopLoss: Math.round(fields.stopLoss.confidence * 100),
      takeProfit: Math.round(fields.takeProfit.confidence * 100),
      positionSize: Math.round(fields.positionSize.confidence * 100),
    },
    rawText: "",
  };
}

function calculateRiskReward(fields: ExtractedTradeFields): number | null {
  const entry = fields.entryPrice.value;
  const sl = fields.stopLoss.value;
  const tp = fields.takeProfit.value;

  if (entry === null || sl === null || tp === null) return null;

  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);

  if (risk === 0) return null;

  return Math.round((reward / risk) * 100) / 100;
}
