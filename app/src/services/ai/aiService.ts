/**
 * Unified AI Service
 * Provides a single entry point for all AI features.
 * Handles provider selection, feature gating, and caching.
 */

import type {
  ScreenshotAnalysis,
  TradeSummary,
  AICoaching,
  TranscriptionResult,
  SubscriptionTier,
  TradeSummaryInput,
  CoachingInput,
  VisionAnalyzeRequest,
  TranscriptionRequest,
  ExtractedTradeData,
  ProfessionalTradeAnalysis,
} from "./types";
import type { AIProvider } from "./providers/types";
import { getMockAIProvider } from "./providers/mockProvider";
import { getMeshAIProvider } from "./providers/meshProvider";

// ─── Local Types ───

export interface AIAnalysisResult {
  screenshots: ScreenshotAnalysis[];
  tradeSummary: TradeSummary | null;
  coaching: AICoaching | null;
  overallScore: number;
  hasAIData: boolean;
  provider: string;
  generatedAt: string;
  processingStatus: string;
  error?: string;
}

// ─── Provider Registry ───

let activeProvider: AIProvider | null = null;

export function setAIProvider(provider: AIProvider): void {
  activeProvider = provider;
}

export function getAIProvider(): AIProvider {
  if (!activeProvider) {
    activeProvider = getMeshAIProvider();
  }
  return activeProvider;
}

export function resetToMeshProvider(): void {
  activeProvider = getMeshAIProvider();
}

// ─── Feature Gating Helpers ───

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, elite: 2 };

export function canUseFeature(userTier: SubscriptionTier, featureTier: SubscriptionTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[featureTier];
}

// ─── Analysis Service ───

export interface AnalyzeScreenshotsOptions {
  userTier: SubscriptionTier;
  imageUrls: string[];
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Analyze trade screenshots with AI
 */
export async function analyzeScreenshots(
  options: AnalyzeScreenshotsOptions
): Promise<ScreenshotAnalysis[]> {
  const { userTier, imageUrls, onProgress } = options;
  const provider = getAIProvider();

  if (!canUseFeature(userTier, provider.requiredTier)) {
    throw new AIError("UPGRADE_REQUIRED", "AI Screenshot Analysis requires Pro or Elite tier");
  }

  if (!provider.capabilities.vision) {
    throw new AIError("NOT_SUPPORTED", "The active AI provider does not support vision analysis");
  }

  const requests: VisionAnalyzeRequest[] = imageUrls.map((url) => ({ imageUrl: url }));
  const results: ScreenshotAnalysis[] = [];

  for (let i = 0; i < requests.length; i++) {
    try {
      const result = await provider.analyzeScreenshot(requests[i]);
      if (result) results.push(result);
    } catch (err) {
      console.warn(`[AIService] Failed to analyze screenshot ${i}:`, err);
    }
    onProgress?.(i + 1, requests.length);
  }

  return results;
}

/**
 * Generate a complete AI analysis for a trade
 */
export async function generateTradeAIAnalysis(
  userTier: SubscriptionTier,
  tradeInput: TradeSummaryInput & CoachingInput,
  screenshotUrls: string[]
): Promise<AIAnalysisResult> {
  const provider = getAIProvider();
  const startTime = Date.now();

  const result: AIAnalysisResult = {
    screenshots: [],
    tradeSummary: null,
    coaching: null,
    overallScore: 0,
    hasAIData: false,
    provider: provider.name,
    generatedAt: new Date().toISOString(),
    processingStatus: "processing",
  };

  try {
    if (screenshotUrls.length > 0 && provider.capabilities.vision) {
      const screenshotAnalyses = await analyzeScreenshots({
        userTier,
        imageUrls: screenshotUrls,
      });
      result.screenshots = screenshotAnalyses;
    }

    if (provider.capabilities.tradeSummary && canUseFeature(userTier, "elite")) {
      const summary = await provider.generateTradeSummary(tradeInput);
      result.tradeSummary = summary;
    }

    if (provider.capabilities.coaching && canUseFeature(userTier, "elite")) {
      const coachingData = await provider.generateCoaching(tradeInput);
      result.coaching = coachingData;
    }

    const scores: number[] = [];
    if (result.tradeSummary?.confidence) {
      scores.push(result.tradeSummary.confidence);
    }
    if (result.coaching?.confidence) {
      scores.push(result.coaching.confidence);
    }
    if (result.screenshots.length > 0) {
      const avgScreenshotConfidence = result.screenshots.reduce(
        (sum, s) => sum + s.confidence, 0
      ) / result.screenshots.length;
      scores.push(avgScreenshotConfidence);
    }
    if (scores.length > 0) {
      result.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    result.hasAIData = true;
    result.processingStatus = "completed";
  } catch (err) {
    result.processingStatus = "error";
    result.error = err instanceof AIError ? err.message : "AI analysis failed";
    console.error("[AIService] Analysis failed:", err);
  }

  const duration = Date.now() - startTime;
  console.log(`[AIService] Analysis completed in ${duration}ms`);

  return result;
}

/**
 * Generate trade summary only
 */
export async function generateTradeSummary(
  userTier: SubscriptionTier,
  input: TradeSummaryInput
): Promise<TradeSummary | null> {
  const provider = getAIProvider();

  if (!canUseFeature(userTier, "elite")) {
    console.warn("[AIService] Trade summary requires Elite tier");
    return null;
  }

  if (!provider.capabilities.tradeSummary) {
    return null;
  }

  return provider.generateTradeSummary(input);
}

/**
 * Generate coaching only
 */
export async function generateCoaching(
  userTier: SubscriptionTier,
  input: CoachingInput
): Promise<AICoaching | null> {
  const provider = getAIProvider();

  if (!canUseFeature(userTier, "elite")) {
    console.warn("[AIService] Coaching requires Elite tier");
    return null;
  }

  if (!provider.capabilities.coaching) {
    return null;
  }

  return provider.generateCoaching(input);
}

/**
 * Analyze structured trade data with AI (Phase 7D-2)
 * Routes through aiService → getAIProvider → MeshAIProvider → Mesh API
 */
export async function analyzeTradeData(
  userTier: SubscriptionTier,
  extractedData: ExtractedTradeData
): Promise<ProfessionalTradeAnalysis | null> {
  const provider = getAIProvider();

  if (!canUseFeature(userTier, "pro")) {
    console.warn("[AIService] Trade data analysis requires Pro or Elite tier");
    return null;
  }

  console.log(`[AIService] Analyzing trade data via ${provider.name} for ${extractedData.symbol}`);

  try {
    const result = await provider.analyzeTradeData(extractedData);
    if (result) {
      console.log(`[AIService] Trade data analysis completed: score=${result.overallTradeScore}`);
    }
    return result;
  } catch (err) {
    console.error("[AIService] Trade data analysis failed:", err);
    return null;
  }
}

/**
 * Transcribe audio
 */
export async function transcribeAudio(
  userTier: SubscriptionTier,
  request: TranscriptionRequest
): Promise<TranscriptionResult | null> {
  const provider = getAIProvider();

  if (!canUseFeature(userTier, "pro")) {
    console.warn("[AIService] Transcription requires Pro tier");
    return null;
  }

  if (!provider.capabilities.transcription) {
    return null;
  }

  return provider.transcribeAudio(request);
}

// ─── Custom Error ───

export class AIError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}
