/**
 * AI Prompt System
 * Phase 7D-1: Reusable prompts for AI trade extraction
 *
 * Prompts request JSON-only responses with structured trade data.
 * Includes validation and recovery for imperfect AI responses.
 */

import type { RawAIExtractionResponse } from "./types/ai-extraction";

/**
 * Build the trade extraction prompt from OCR text
 */
export function buildTradeExtractionPrompt(ocrText: string, context?: string): string {
  const contextSection = context ? `\nAdditional Context: ${context}\n` : "";

  return `You are an expert trading data extraction AI. Analyze the following OCR text extracted from a trading screenshot and extract all trade parameters.

OCR TEXT:
"""
${ocrText}
"""
${contextSection}
Instructions:
- Extract trade parameters intelligently even if OCR text is imperfect
- Infer missing values when possible from context
- Normalize symbols (e.g., "GOLD" → "XAUUSD", "BTC" → "BTCUSD")
- Direction should be "buy", "sell", or "" if unclear
- Prices should be numeric values only (no commas, units)
- Position size should be in lots (e.g., 0.01, 0.1, 1.0)
- Risk percent should be a number (e.g., 1.0, 2.0)
- Timeframe examples: "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"
- Order type examples: "market", "limit", "stop", "stop limit"
- Return ONLY valid JSON, no markdown, no explanation

Required JSON format:
{
  "symbol": "string or empty",
  "side": "buy|sell|empty string",
  "entry": number or null,
  "sl": number or null,
  "tp": number or null,
  "positionSize": number or null,
  "riskPercent": number or null,
  "broker": "string or null",
  "timeframe": "string or null",
  "orderType": "string or null",
  "confidence": 0-100,
  "advice": {
    "risk": "risk assessment summary",
    "rr": number or null,
    "mistakes": ["mistake 1", "mistake 2"],
    "suggestions": ["suggestion 1", "suggestion 2"],
    "quality": 0-100
  }
}

Confidence scoring guide:
- 90-100: All fields clearly identified with explicit labels
- 70-89: Most fields identified, some inferred from context
- 50-69: Several fields missing or inferred with uncertainty
- 0-49: Very few fields detected, high uncertainty

Respond with ONLY the JSON object. Do not wrap in markdown code blocks.`;
}

/**
 * Build a prompt for re-extraction with error feedback
 * Used when the first attempt returned invalid JSON
 */
export function buildRetryPrompt(ocrText: string, previousError: string): string {
  return `You are an expert trading data extraction AI. Your previous response had an error: "${previousError}".

Analyze this OCR text and return ONLY valid JSON:

OCR TEXT:
"""
${ocrText}
"""

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{"symbol":"","side":"","entry":null,"sl":null,"tp":null,"positionSize":null,"riskPercent":null,"broker":null,"timeframe":null,"orderType":null,"confidence":0,"advice":{"risk":"","rr":null,"mistakes":[],"suggestions":[],"quality":0}}`;
}

/**
 * Build a vision-enhanced prompt that references the image
 */
export function buildVisionExtractionPrompt(ocrText: string, imageUrl: string): string {
  return `You are an expert trading data extraction AI. Analyze the trading screenshot and OCR text to extract all trade parameters.

Image URL: ${imageUrl}

OCR TEXT:
"""
${ocrText}
"""

Look at the image and the OCR text together. Use the image for visual context and the OCR for precise values.

Instructions:
- Extract trade parameters intelligently
- Infer missing values when possible
- Normalize symbols (e.g., "GOLD" → "XAUUSD")
- Return ONLY valid JSON, no markdown, no explanation

Required JSON format:
{
  "symbol": "string or empty",
  "side": "buy|sell|empty string",
  "entry": number or null,
  "sl": number or null,
  "tp": number or null,
  "positionSize": number or null,
  "riskPercent": number or null,
  "broker": "string or null",
  "timeframe": "string or null",
  "orderType": "string or null",
  "confidence": 0-100,
  "advice": {
    "risk": "risk assessment summary",
    "rr": number or null,
    "mistakes": ["mistake 1"],
    "suggestions": ["suggestion 1"],
    "quality": 0-100
  }
}

Respond with ONLY the JSON object.`;
}

/**
 * Parse and validate AI JSON response
 * Returns the extracted data or null if parsing fails
 */
export function parseAIExtractionResponse(rawText: string): RawAIExtractionResponse | null {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = rawText.trim();

    // Remove markdown code block wrappers
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Remove any text before the first {
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);

    const parsed = JSON.parse(jsonText) as RawAIExtractionResponse;

    // Validate required structure
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Normalize the raw AI response into a clean extraction result
 */
export function normalizeExtractionResponse(raw: RawAIExtractionResponse): RawAIExtractionResponse {
  const normalizeSide = (s: string | undefined): "buy" | "sell" | "" => {
    if (!s) return "";
    const lower = String(s).toLowerCase().trim();
    if (lower === "buy" || lower === "long") return "buy";
    if (lower === "sell" || lower === "short") return "sell";
    return "";
  };

  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return isNaN(v) ? null : v;
    const parsed = parseFloat(String(v));
    return isNaN(parsed) ? null : parsed;
  };

  const toStr = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s.length > 0 ? s : null;
  };

  const toStrArray = (v: unknown): string[] => {
    if (!Array.isArray(v)) return [];
    return v.filter((item): item is string => typeof item === "string");
  };

  return {
    symbol: toStr(raw.symbol) ?? "",
    side: normalizeSide(raw.side),
    entry: toNum(raw.entry),
    sl: toNum(raw.sl),
    tp: toNum(raw.tp),
    positionSize: toNum(raw.positionSize),
    riskPercent: toNum(raw.riskPercent),
    broker: toStr(raw.broker),
    timeframe: toStr(raw.timeframe),
    orderType: toStr(raw.orderType),
    confidence: toNum(raw.confidence),
    advice: raw.advice
      ? {
          risk: toStr(raw.advice.risk) ?? "",
          rr: toNum(raw.advice.rr),
          mistakes: toStrArray(raw.advice.mistakes),
          suggestions: toStrArray(raw.advice.suggestions),
          quality: toNum(raw.advice.quality) ?? 0,
        }
      : null,
  };
}
