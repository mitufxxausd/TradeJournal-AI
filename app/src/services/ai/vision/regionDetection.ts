/**
 * Region Detection System
 * Detects and classifies regions in trading platform screenshots.
 *
 * Uses heuristics based on common trading platform layouts:
 * - TradingView, MetaTrader 5, cTrader, NinjaTrader
 *
 * Regions:
 * - Chart: Main charting area (center)
 * - Toolbar: Top/side toolbars
 * - Price Panel: Right-side price scale
 * - Position Panel: Trade/order panels
 * - Broker Header: Platform header
 * - Window Title: OS window title
 * - Watermark: Platform watermarks
 * - Indicator Panel: Indicator values overlay
 */

import type {
  DetectedImageRegion,
  ImageRegionType,
  PipelineContext,
  PipelineStageResult,
} from "./pipeline";

// ─── Region Detection Heuristics ───

interface RegionHeuristic {
  type: ImageRegionType;
  /** Keywords that indicate this region in OCR text */
  keywords: string[];
  /** Expected position (normalized 0-1, optional) */
  expectedPosition?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  /** Whether this region is relevant for trade extraction */
  relevantForTrade: boolean;
  /** Priority for symbol detection (lower = higher) */
  symbolPriority: number;
}

const REGION_HEURISTICS: RegionHeuristic[] = [
  {
    type: "window_title",
    keywords: ["tradingview", "metatrader", "mt5", "mt4", "ctrader", "ninjatrader"],
    expectedPosition: { x1: 0, y1: 0, x2: 1, y2: 0.05 },
    relevantForTrade: true,
    symbolPriority: 1,
  },
  {
    type: "broker_header",
    keywords: ["account", "balance", "equity", "margin", "login", "logout"],
    expectedPosition: { x1: 0, y1: 0, x2: 1, y2: 0.08 },
    relevantForTrade: true,
    symbolPriority: 3,
  },
  {
    type: "chart",
    keywords: ["candle", "line", "bar", "heikin", "renko"],
    expectedPosition: { x1: 0.05, y1: 0.1, x2: 0.85, y2: 0.9 },
    relevantForTrade: true,
    symbolPriority: 10,
  },
  {
    type: "toolbar",
    keywords: ["select", "zoom", "draw", "measure", "template", "save"],
    expectedPosition: { x1: 0, y1: 0.05, x2: 1, y2: 0.12 },
    relevantForTrade: false,
    symbolPriority: 99,
  },
  {
    type: "price_panel",
    keywords: ["sell", "buy", "bid", "ask", "spread", "1.2345", "1.2346"],
    expectedPosition: { x1: 0.85, y1: 0.1, x2: 1, y2: 0.9 },
    relevantForTrade: false,
    symbolPriority: 99,
  },
  {
    type: "position_panel",
    keywords: ["ticket", "open", "close", "profit", "loss", "swap", "commission"],
    expectedPosition: { x1: 0, y1: 0.7, x2: 1, y2: 1 },
    relevantForTrade: true,
    symbolPriority: 6,
  },
  {
    type: "watermark",
    keywords: ["tradingview", "metaquotes", "forex.com", "oanda"],
    expectedPosition: { x1: 0.3, y1: 0.3, x2: 0.7, y2: 0.5 },
    relevantForTrade: false,
    symbolPriority: 99,
  },
  {
    type: "indicator_panel",
    keywords: ["rsi", "macd", "ema", "sma", "bollinger", "atr", "adx"],
    expectedPosition: { x1: 0.05, y1: 0.7, x2: 0.85, y2: 0.95 },
    relevantForTrade: false,
    symbolPriority: 99,
  },
  {
    type: "timeframe_selector",
    keywords: ["1m", "5m", "15m", "1h", "4h", "d1", "w1", "mn"],
    expectedPosition: { x1: 0, y1: 0.05, x2: 0.5, y2: 0.1 },
    relevantForTrade: false,
    symbolPriority: 99,
  },
  {
    type: "order_panel",
    keywords: ["market", "pending", "stop loss", "take profit", "volume", "lot"],
    expectedPosition: { x1: 0.7, y1: 0.1, x2: 1, y2: 0.6 },
    relevantForTrade: true,
    symbolPriority: 5,
  },
  {
    type: "watchlist",
    keywords: ["watchlist", "market watch", "symbols", "pairs"],
    expectedPosition: { x1: 0, y1: 0.1, x2: 0.2, y2: 0.5 },
    relevantForTrade: true,
    symbolPriority: 8,
  },
  {
    type: "status_bar",
    keywords: ["connected", "disconnected", "ping", "pinging", "0ms"],
    expectedPosition: { x1: 0, y1: 0.95, x2: 1, y2: 1 },
    relevantForTrade: false,
    symbolPriority: 99,
  },
  {
    type: "menu_bar",
    keywords: ["file", "view", "insert", "charts", "tools", "window", "help"],
    expectedPosition: { x1: 0, y1: 0, x2: 1, y2: 0.05 },
    relevantForTrade: false,
    symbolPriority: 99,
  },
];

// ─── Region Detection Result ───

export interface RegionDetectionResult {
  regions: DetectedImageRegion[];
  confidence: number;
  platform: "tradingview" | "mt5" | "mt4" | "ctrader" | "ninjatrader" | "unknown";
  processingTimeMs: number;
}

// ─── Platform Detection ───

function detectPlatform(text: string): RegionDetectionResult["platform"] {
  const lower = text.toLowerCase();
  if (lower.includes("tradingview")) return "tradingview";
  if (lower.includes("metatrader 5") || lower.includes("mt5")) return "mt5";
  if (lower.includes("metatrader 4") || lower.includes("mt4")) return "mt4";
  if (lower.includes("ctrader")) return "ctrader";
  if (lower.includes("ninjatrader")) return "ninjatrader";
  return "unknown";
}

// ─── Main Detection Function ───

/**
 * Detect regions in a screenshot using OCR text and heuristics.
 * This is a lightweight heuristic-based approach that works without
 * actual image processing. For pixel-accurate detection, a VisionProvider
 * would be needed.
 */
export function detectRegions(
  ocrText: string,
  imageWidth?: number,
  imageHeight?: number
): RegionDetectionResult {
  const startTime = Date.now();
  const regions: DetectedImageRegion[] = [];
  const platform = detectPlatform(ocrText);

  // Analyze text line by line with position estimates
  const lines = ocrText.split("\n").filter((line) => line.trim().length > 0);
  const totalLines = lines.length;

  for (const heuristic of REGION_HEURISTICS) {
    const matchedLines: { line: string; lineIndex: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Check if any keyword matches
      const hasKeyword = heuristic.keywords.some((kw) => lowerLine.includes(kw.toLowerCase()));

      if (hasKeyword) {
        matchedLines.push({ line, lineIndex: i });
      }
    }

    // Calculate region position based on matched lines
    if (matchedLines.length > 0) {
      const positions = matchedLines.map((m) => m.lineIndex / totalLines);
      const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;

      // Estimate region bounds
      const estimatedY1 = Math.max(0, avgPosition - 0.05);
      const estimatedY2 = Math.min(1, avgPosition + 0.1);
      const estimatedX1 = heuristic.expectedPosition?.x1 ?? 0;
      const estimatedX2 = heuristic.expectedPosition?.x2 ?? 1;

      const areaPercent = Math.round((estimatedX2 - estimatedX1) * (estimatedY2 - estimatedY1) * 1000) / 10;

      // Confidence based on number of keyword matches
      const confidence = Math.min(0.3 + matchedLines.length * 0.15, 0.9);

      regions.push({
        id: `region-${heuristic.type}-${regions.length}`,
        type: heuristic.type,
        x1: estimatedX1,
        y1: estimatedY1,
        x2: estimatedX2,
        y2: estimatedY2,
        areaPercent,
        confidence,
        extractedText: matchedLines.map((m) => m.line).join(" "),
        includeInAnalysis: heuristic.relevantForTrade,
        symbolDetectionPriority: heuristic.symbolPriority,
      });
    } else if (heuristic.expectedPosition && platform !== "unknown") {
      // For known platforms, add expected regions even without keyword matches
      // (with lower confidence)
      regions.push({
        id: `region-${heuristic.type}-expected`,
        type: heuristic.type,
        ...heuristic.expectedPosition,
        areaPercent: Math.round(
          (heuristic.expectedPosition.x2 - heuristic.expectedPosition.x1) *
          (heuristic.expectedPosition.y2 - heuristic.expectedPosition.y1) *
          1000
        ) / 10,
        confidence: 0.3, // Low confidence for expected-but-not-detected
        includeInAnalysis: heuristic.relevantForTrade,
        symbolDetectionPriority: heuristic.symbolPriority,
      });
    }
  }

  // Remove overlapping regions (keep higher confidence)
  const filteredRegions = removeOverlappingRegions(regions);

  // Calculate overall confidence
  const confidence = filteredRegions.length > 0
    ? filteredRegions.reduce((sum, r) => sum + r.confidence, 0) / filteredRegions.length
    : 0;

  const processingTimeMs = Date.now() - startTime;

  return {
    regions: filteredRegions,
    confidence,
    platform,
    processingTimeMs,
  };
}

// ─── Region Filtering ───

/**
 * Remove overlapping regions, keeping the one with higher confidence.
 */
function removeOverlappingRegions(regions: DetectedImageRegion[]): DetectedImageRegion[] {
  const sorted = [...regions].sort((a, b) => b.confidence - a.confidence);
  const result: DetectedImageRegion[] = [];

  for (const region of sorted) {
    // Check if this region significantly overlaps with any already-kept region
    const overlaps = result.some((kept) => calculateOverlap(region, kept) > 0.5);
    if (!overlaps) {
      result.push(region);
    }
  }

  // Sort by position (top to bottom, left to right)
  return result.sort((a, b) => {
    if (Math.abs(a.y1 - b.y1) < 0.1) {
      return a.x1 - b.x1;
    }
    return a.y1 - b.y1;
  });
}

/**
 * Calculate overlap ratio between two regions (0-1).
 */
function calculateOverlap(a: DetectedImageRegion, b: DetectedImageRegion): number {
  const xOverlap = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const yOverlap = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const overlapArea = xOverlap * yOverlap;

  const aArea = (a.x2 - a.x1) * (a.y2 - a.y1);
  const bArea = (b.x2 - b.x1) * (b.y2 - b.y1);
  const minArea = Math.min(aArea, bArea);

  return minArea > 0 ? overlapArea / minArea : 0;
}

// ─── Utility Functions ───

/**
 * Get regions sorted by symbol detection priority.
 */
export function getRegionsBySymbolPriority(
  regions: DetectedImageRegion[]
): DetectedImageRegion[] {
  return [...regions]
    .filter((r) => r.includeInAnalysis)
    .sort((a, b) => a.symbolDetectionPriority - b.symbolDetectionPriority);
}

/**
 * Get text from regions relevant for trade extraction.
 */
export function getTradeRelevantText(regions: DetectedImageRegion[]): string {
  return regions
    .filter((r) => r.includeInAnalysis && r.extractedText)
    .sort((a, b) => a.symbolDetectionPriority - b.symbolDetectionPriority)
    .map((r) => r.extractedText)
    .filter((t): t is string => !!t)
    .join("\n");
}

/**
 * Get regions by type.
 */
export function getRegionsByType(
  regions: DetectedImageRegion[],
  type: ImageRegionType
): DetectedImageRegion[] {
  return regions.filter((r) => r.type === type);
}

/**
 * Get the text from a specific region type.
 */
export function getTextFromRegionType(
  regions: DetectedImageRegion[],
  type: ImageRegionType
): string {
  return getRegionsByType(regions, type)
    .map((r) => r.extractedText)
    .filter((t): t is string => !!t)
    .join("\n");
}

// ─── Pipeline Integration ───

/**
 * Run region detection as a pipeline stage.
 */
export async function runRegionDetectionStage(
  ocrText: string,
  context: PipelineContext
): Promise<PipelineStageResult<RegionDetectionResult>> {
  const startTime = Date.now();

  try {
    const result = detectRegions(ocrText);

    return {
      stage: "region_detection",
      success: true,
      output: result,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      stage: "region_detection",
      success: false,
      output: {
        regions: [],
        confidence: 0,
        platform: "unknown",
        processingTimeMs: Date.now() - startTime,
      },
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Region detection failed",
    };
  }
}
