/**
 * AI Extraction Service
 * Phase 7D-1: AI-powered trade extraction from OCR text
 *
 * Service that sends OCR text to AI providers and receives
 * structured trade data. Handles JSON validation, retries,
 * and graceful degradation.
 *
 * Pipeline:
 *   OCR Text → AI Provider → JSON Response → Validation →
 *   Normalization → AIExtractionResult
 */

import type {
  AIExtractionResult,
  AIExtractionRequest,
  AIExtractionOptions,
  AIExtractedTrade,
  AIConfidenceScores,
  AIAdviceResult,
  RawAIExtractionResponse,
  AIExtractionErrorCode,
} from "./types/ai-extraction";
import { AIExtractionError } from "./types/ai-extraction";
import {
  buildTradeExtractionPrompt,
  buildRetryPrompt,
  parseAIExtractionResponse,
  normalizeExtractionResponse,
} from "./prompts";
import { providerRegistry } from "./providers/registry";
import { isVisionProvider } from "./providers/interfaces";
import { getErrorMessage } from "./utils";

// ─── Constants ───

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 2;

// ─── Factory Functions ───

function createEmptyAdvice(): AIAdviceResult {
  return {
    risk: "",
    rr: null,
    mistakes: [],
    suggestions: [],
    quality: 0,
    items: [],
  };
}

function calculateOverallConfidence(ocrConfidence: number, aiConfidence: number): number {
  // Weighted: 40% OCR, 60% AI extraction
  return Math.round(ocrConfidence * 0.4 + aiConfidence * 0.6);
}

function buildConfidenceScores(ocrConfidence: number, aiConfidence: number): AIConfidenceScores {
  const ocr = Math.round(Math.max(0, Math.min(100, ocrConfidence)));
  const ai = Math.round(Math.max(0, Math.min(100, aiConfidence)));
  const overall = calculateOverallConfidence(ocr, ai);
  return { ocr, ai, overall };
}

function convertRawToTrade(raw: RawAIExtractionResponse): AIExtractedTrade {
  const side = raw.side ?? "";
  const normalizedSide: "" | "buy" | "sell" =
    side === "buy" || side === "sell" ? side : "";
  return {
    symbol: raw.symbol ?? "",
    side: normalizedSide,
    entry: raw.entry ?? null,
    sl: raw.sl ?? null,
    tp: raw.tp ?? null,
    positionSize: raw.positionSize ?? null,
    riskPercent: raw.riskPercent ?? null,
    broker: raw.broker ?? null,
    timeframe: raw.timeframe ?? null,
    orderType: raw.orderType ?? null,
  };
}

function convertRawToAdvice(raw: RawAIExtractionResponse): AIAdviceResult {
  if (!raw.advice) return createEmptyAdvice();

  const items: AIAdviceResult["items"] = [];

  if (raw.advice.risk) {
    items.push({ category: "risk", severity: "info", message: raw.advice.risk });
  }
  if (raw.advice.rr !== null && raw.advice.rr !== undefined) {
    const rrSeverity = raw.advice.rr >= 2 ? "success" : raw.advice.rr >= 1 ? "warning" : "error";
    items.push({
      category: "rr",
      severity: rrSeverity,
      message: `Risk:Reward ratio is 1:${raw.advice.rr.toFixed(1)}`,
    });
  }
  for (const m of raw.advice.mistakes ?? []) {
    items.push({ category: "mistake", severity: "warning", message: m });
  }
  for (const s of raw.advice.suggestions ?? []) {
    items.push({ category: "suggestion", severity: "info", message: s });
  }
  if (raw.advice.quality !== null && raw.advice.quality !== undefined) {
    const qSeverity = raw.advice.quality >= 70 ? "success" : raw.advice.quality >= 40 ? "warning" : "error";
    items.push({
      category: "quality",
      severity: qSeverity,
      message: `Trade quality score: ${raw.advice.quality}/100`,
    });
  }

  return {
    risk: raw.advice.risk ?? "",
    rr: raw.advice.rr ?? null,
    mistakes: raw.advice.mistakes ?? [],
    suggestions: raw.advice.suggestions ?? [],
    quality: raw.advice.quality ?? 0,
    items,
  };
}

// ─── AI Provider Call ───

type ProviderName = import("./types/common").AIProviderName;

/**
 * Get the best chat-capable provider name
 */
function getChatCapableProvider(): ProviderName {
  // Check mock first (for development)
  if (providerRegistry.has("mock")) return "mock";

  // Then check real providers by priority
  const chatProviders: ProviderName[] = ["openai", "gemini", "claude", "openrouter", "groq", "deepseek"];
  for (const name of chatProviders) {
    if (providerRegistry.has(name)) return name;
  }

  return "mock";
}

/**
 * Get a provider with vision capabilities
 */
function getVisionCapableProvider(): ProviderName {
  const visionProviders: ProviderName[] = ["openai", "gemini", "claude", "openrouter"];
  for (const name of visionProviders) {
    const provider = providerRegistry.get(name);
    if (provider && isVisionProvider(provider)) return name;
  }

  return getChatCapableProvider();
}

/**
 * Check if an error is a timeout error
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === "TimeoutError" ||
      error.message.toLowerCase().includes("timeout") ||
      error.message.toLowerCase().includes("timed out")
    );
  }
  return false;
}

/**
 * Call the AI provider to extract trade data from OCR text
 */
async function callAIProvider(
  request: AIExtractionRequest,
  options: AIExtractionOptions = {}
): Promise<{ raw: RawAIExtractionResponse; provider: string; model: string }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;

  // Get primary provider for chat/capable providers
  // We prefer providers with vision if imageUrl is provided
  const providerName = options.useVision && request.imageUrl
    ? getVisionCapableProvider()
    : getChatCapableProvider();

  const provider = providerRegistry.get(providerName);

  if (!provider) {
    throw new AIExtractionError("NO_PROVIDER", "No AI provider available for extraction");
  }

  const model = (provider as { models?: Array<{ id: string }> }).models?.[0]?.id ?? "unknown";

  // Check if provider has vision capability and we want to use it
  const hasVision = isVisionProvider(provider);
  const useVision = options.useVision && request.imageUrl && hasVision;

  let prompt: string;
  if (useVision) {
    // For vision providers, we'd use analyzeImage - but for now we use text-based
    // since most providers support text+image. We'll build a text prompt with image URL.
    prompt = buildTradeExtractionPrompt(request.ocrText, request.context);
  } else {
    prompt = buildTradeExtractionPrompt(request.ocrText, request.context);
  }

  // Try with retry logic
  let lastError: string | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const responseText = await sendToProvider(provider, prompt, timeoutMs, options.abortSignal);

      const parsed = parseAIExtractionResponse(responseText);

      if (parsed) {
        const normalized = normalizeExtractionResponse(parsed);
        return { raw: normalized, provider: providerName, model };
      }

      lastError = "Invalid JSON response from AI";

      // If we have retries left, try with a simpler prompt
      if (attempt < retries) {
        prompt = buildRetryPrompt(request.ocrText, lastError);
      }
    } catch (error) {
      lastError = getErrorMessage(error);

      if (error instanceof Error && error.name === "AbortError") {
        throw new AIExtractionError("ABORTED", "AI extraction was aborted", error);
      }

      if (isTimeoutError(error)) {
        if (attempt >= retries) {
          throw new AIExtractionError("TIMEOUT", `AI extraction timed out after ${timeoutMs}ms`, error);
        }
      }
    }

    attempt++;
  }

  // All retries exhausted - return empty result instead of throwing
  // This allows graceful degradation
  return {
    raw: {
      symbol: "",
      side: "",
      entry: null,
      sl: null,
      tp: null,
      positionSize: null,
      riskPercent: null,
      broker: null,
      timeframe: null,
      orderType: null,
      confidence: 0,
      advice: null,
    },
    provider: providerName,
    model,
  };
}

/**
 * Send prompt to provider
 */
async function sendToProvider(
  provider: unknown,
  prompt: string,
  timeoutMs: number,
  abortSignal?: AbortSignal
): Promise<string> {
  // Try to use chat method if available (mock provider pattern)
  const chatProvider = provider as {
    chat?: (message: string, sessionId?: string, options?: { abortSignal?: AbortSignal }) => Promise<{
      data: string;
    }>;
    sendMessage?: (message: string, options?: { abortSignal?: AbortSignal }) => Promise<string>;
    generateText?: (prompt: string, options?: { abortSignal?: AbortSignal }) => Promise<string>;
    analyzeImage?: (imageUrl: string, prompt: string, options?: { abortSignal?: AbortSignal }) => Promise<{
      data: string;
    }>;
  };

  // Create abort signal with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external abort signal
  if (abortSignal) {
    abortSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    if (chatProvider.chat) {
      const response = await chatProvider.chat(prompt, undefined, {
        abortSignal: controller.signal,
      });
      return response.data;
    }

    if (chatProvider.sendMessage) {
      return await chatProvider.sendMessage(prompt, {
        abortSignal: controller.signal,
      });
    }

    if (chatProvider.generateText) {
      return await chatProvider.generateText(prompt, {
        abortSignal: controller.signal,
      });
    }

    // Fallback: try vision analyze if it's a vision provider
    if (chatProvider.analyzeImage) {
      // Extract image URL from prompt if present
      const urlMatch = prompt.match(/Image URL: ([^\n]+)/);
      const imageUrl = urlMatch ? urlMatch[1] : "";
      const cleanPrompt = prompt.replace(/Image URL: [^\n]+\n*/, "").trim();
      const response = await chatProvider.analyzeImage(imageUrl, cleanPrompt, {
        abortSignal: controller.signal,
      });
      return response.data;
    }

    throw new AIExtractionError("NO_PROVIDER", "Provider does not support text generation");
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Main Extraction Function ───

/**
 * Extract trade data from OCR text using AI
 *
 * This is the primary entry point for AI-powered trade extraction.
 * It sends OCR text to an AI provider and returns structured trade data.
 *
 * @param request - The extraction request containing OCR text
 * @param ocrConfidence - The confidence score from OCR (0-100)
 * @param options - Extraction options
 * @returns AIExtractionResult with trade data, confidence, and advice
 */
export async function extractTradeWithAI(
  request: AIExtractionRequest,
  ocrConfidence: number = 0,
  options: AIExtractionOptions = {}
): Promise<AIExtractionResult> {
  const startTime = Date.now();

  try {
    const { raw, provider, model } = await callAIProvider(request, options);

    const processingTimeMs = Date.now() - startTime;

    const trade = convertRawToTrade(raw);
    const advice = options.includeAdvice !== false ? convertRawToAdvice(raw) : createEmptyAdvice();
    const aiConfidence = raw.confidence ?? 50;
    const confidence = buildConfidenceScores(ocrConfidence, aiConfidence);

    return {
      imageUrl: request.imageUrl ?? null,
      ocrText: request.ocrText,
      trade,
      confidence,
      advice,
      analysisTime: new Date().toISOString(),
      processingTimeMs,
      provider,
      model,
    };
  } catch (error) {
    if (error instanceof AIExtractionError) throw error;

    // Wrap unknown errors
    throw new AIExtractionError(
      "NETWORK_ERROR",
      `AI extraction failed: ${getErrorMessage(error)}`,
      error
    );
  }
}

/**
 * Quick extraction with minimal options
 */
export async function quickExtract(
  ocrText: string,
  ocrConfidence: number = 0,
  imageUrl?: string
): Promise<AIExtractionResult> {
  return extractTradeWithAI(
    { ocrText, imageUrl },
    ocrConfidence,
    { includeAdvice: true }
  );
}

// ─── Re-export types ───

export type {
  AIExtractionResult,
  AIExtractionRequest,
  AIExtractionOptions,
  AIExtractedTrade,
  AIConfidenceScores,
  AIAdviceResult,
  RawAIExtractionResponse,
  AIExtractionErrorCode,
};
export { AIExtractionError };
