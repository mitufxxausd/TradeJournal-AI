/**
 * Mesh AI Provider
 * Routes all AI requests through the Mesh API gateway.
 * Uses OpenAI-compatible endpoints with structured JSON output.
 *
 * Base URL:    https://api.meshapi.ai
 * Auth:        Authorization: Bearer rsk_<KEY>
 * Endpoints:   POST /v1/chat/completions  (vision, chat, structured output)
 *              POST /v1/audio/transcriptions (speech-to-text)
 */

import type {
  AIProvider,
  AIProviderCapabilities,
  VisionAnalyzeRequest,
  ScreenshotAnalysis,
  TradeSummaryInput,
  TradeSummary,
  CoachingInput,
  AICoaching,
  CoachingItem,
  TranscriptionRequest,
  TranscriptionResult,
  ExtractedTradeData,
  SubscriptionTier,
} from "../types";

import type { AIModelInfo } from "../types/common";

// ─── Configuration ───

const MESH_BASE_URL = "https://api.meshapi.ai";
const DEFAULT_VISION_MODEL = "openai/gpt-4o";
const DEFAULT_CHAT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_TRANSCRIPTION_MODEL = "openai/whisper-1";

function getApiKey(): string | undefined {
  return import.meta.env.VITE_MESH_API_KEY;
}

function getAuthHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) {
    throw new MeshAIError("MISSING_API_KEY", "VITE_MESH_API_KEY is not set in environment");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

// ─── Error Handling ───

class MeshAIError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "MeshAIError";
    this.code = code;
  }
}

// ─── JSON Schema Helpers for Structured Output ───

const TRADE_DATA_SCHEMA = {
  type: "object",
  properties: {
    pair: { type: "string", description: "Currency pair or trading instrument" },
    direction: { type: "string", enum: ["buy", "sell", "long", "short"] },
    entryPrice: { type: "number" },
    exitPrice: { type: ["number", "null"] },
    stopLoss: { type: ["number", "null"] },
    takeProfit: { type: ["number", "null"] },
    positionSize: { type: "number" },
    confidence: { type: "number" },
    confidenceLevel: { type: "string", enum: ["low", "medium", "high"] },
    source: { type: "string" },
    method: { type: "string" },
  },
  required: ["pair", "direction", "entryPrice", "positionSize", "confidence", "confidenceLevel", "source", "method"],
} as const;

const SCREENSHOT_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    tradeData: TRADE_DATA_SCHEMA,
    detectedSetup: { type: "string", description: "Description of the detected trade setup/pattern" },
    marketContext: { type: "string", description: "Current market context and conditions" },
    keyLevels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          price: { type: "number" },
          confidence: { type: "number" },
          description: { type: "string" },
        },
        required: ["type", "price", "confidence", "description"],
      },
    },
    riskAssessment: {
      type: "object",
      properties: {
        riskRewardRatio: { type: "number" },
        riskPercent: { type: "number" },
        potentialProfit: { type: "number" },
        potentialLoss: { type: "number" },
        assessment: { type: "string" },
        recommendation: { type: "string" },
      },
      required: ["riskRewardRatio", "riskPercent", "potentialProfit", "potentialLoss", "assessment", "recommendation"],
    },
    confidence: { type: "number" },
    confidenceLevel: { type: "string", enum: ["low", "medium", "high"] },
    status: { type: "string", enum: ["completed", "failed"] },
  },
  required: ["tradeData", "detectedSetup", "marketContext", "keyLevels", "riskAssessment", "confidence", "confidenceLevel", "status"],
} as const;

const TRADE_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    keyObservations: { type: "array", items: { type: "string" } },
    whatWentWell: { type: "array", items: { type: "string" } },
    whatToImprove: { type: "array", items: { type: "string" } },
    psychologicalFactors: { type: "array", items: { type: "string" } },
    technicalAnalysis: { type: "string" },
    riskManagementAssessment: { type: "string" },
    actionableRecommendations: { type: "array", items: { type: "string" } },
    marketContext: { type: "string" },
    confidence: { type: "number" },
  },
  required: ["title", "overview", "keyObservations", "whatWentWell", "whatToImprove", "psychologicalFactors", "technicalAnalysis", "riskManagementAssessment", "actionableRecommendations", "marketContext", "confidence"],
} as const;

const COACHING_SCHEMA = {
  type: "object",
  properties: {
    plan: {
      type: "object",
      properties: {
        focus: { type: "string" },
        summary: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              category: { type: "string", enum: ["risk-management", "discipline", "psychology", "technical-analysis", "performance"] },
              isCompleted: { type: "boolean" },
              priority: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["title", "description", "category", "isCompleted", "priority"],
          },
        },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        timeframe: { type: "string" },
        expectedOutcome: { type: "string" },
      },
      required: ["focus", "summary", "items", "priority", "timeframe", "expectedOutcome"],
    },
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          severity: { type: "string", enum: ["positive", "warning", "critical", "info"] },
        },
        required: ["title", "description", "category", "severity"],
      },
    },
    goals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          isAchieved: { type: "boolean" },
          progress: { type: "number" },
        },
        required: ["title", "description", "category", "isAchieved", "progress"],
      },
    },
    feedback: {
      type: "object",
      properties: {
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        threats: { type: "array", items: { type: "string" } },
        overallRating: { type: "number" },
        overallComment: { type: "string" },
      },
      required: ["strengths", "weaknesses", "opportunities", "threats", "overallRating", "overallComment"],
    },
    confidence: { type: "number" },
  },
  required: ["plan", "insights", "goals", "feedback", "confidence"],
} as const;

// ─── Prompt Builders ───

function buildScreenshotAnalysisPrompt(): string {
  return `You are an expert trading analyst AI. Analyze the provided trading screenshot and extract structured information.

Your task:
1. Extract all visible trade data (pair, direction, entry price, stop loss, take profit, position size)
2. Identify the chart pattern or trade setup visible
3. Assess current market context
4. Identify key support/resistance levels visible on the chart
5. Calculate risk-reward metrics and provide an assessment
6. Assign confidence scores

Respond ONLY with valid JSON matching the provided schema.`;
}

function buildTradeSummaryPrompt(input: TradeSummaryInput): string {
  return `You are an expert trading coach AI. Generate a comprehensive trade summary for the following trade:

Trade Details:
- Pair: ${input.pair}
- Direction: ${input.direction}
- Entry Price: ${input.entryPrice}
- Exit Price: ${input.exitPrice ?? "N/A"}
- Stop Loss: ${input.stopLoss ?? "N/A"}
- Take Profit: ${input.takeProfit ?? "N/A"}
- Position Size: ${input.positionSize}
- Risk %: ${input.riskPercent ?? "N/A"}
- P/L: ${input.profitLoss ?? "N/A"}
- R:R Ratio: ${input.rrRatio ?? "N/A"}
- Timeframe: ${input.timeframe ?? "N/A"}
- Strategy: ${input.strategy ?? "N/A"}
- Session: ${input.session ?? "N/A"}
${input.psychologyNotes ? `- Psychology Notes: ${input.psychologyNotes}` : ""}
${input.notes ? `- Notes: ${input.notes}` : ""}

Generate a detailed trade summary. Respond ONLY with valid JSON matching the provided schema.`;
}

function buildCoachingPrompt(input: CoachingInput): string {
  return `You are an expert trading coach AI. Generate personalized coaching recommendations based on this trade:

Trade Details:
- Pair: ${input.pair}
- Direction: ${input.direction}
- Entry Price: ${input.entryPrice}
- Exit Price: ${input.exitPrice ?? "N/A"}
- Stop Loss: ${input.stopLoss ?? "N/A"}
- Take Profit: ${input.takeProfit ?? "N/A"}
- Position Size: ${input.positionSize}
- Risk %: ${input.riskPercent ?? "N/A"}
- P/L: ${input.profitLoss ?? "N/A"}
- R:R Ratio: ${input.rrRatio ?? "N/A"}
- Timeframe: ${input.timeframe ?? "N/A"}
- Strategy: ${input.strategy ?? "N/A"}
- Session: ${input.session ?? "N/A"}
- Trade Quality Score: ${input.tradeQualityScore ?? "N/A"}
${input.psychologyNotes ? `- Psychology Notes: ${input.psychologyNotes}` : ""}
${input.recentTrades && input.recentTrades.length > 0 ? `- Recent Trades: ${input.recentTrades.length} trades` : ""}

Generate a personalized coaching plan. Respond ONLY with valid JSON matching the provided schema.`;
}

// ─── Helper: Call Mesh Chat Completions ───

interface MeshChatCompletionOptions {
  model?: string;
  messages: Array<{ role: string; content: unknown }>;
  temperature?: number;
  max_tokens?: number;
  responseFormat?: { type: string; json_schema?: { name: string; schema: Record<string, unknown> } };
}

async function meshChatCompletion<T>(options: MeshChatCompletionOptions): Promise<T> {
  const url = `${MESH_BASE_URL}/v1/chat/completions`;

  const body: Record<string, unknown> = {
    model: options.model ?? DEFAULT_CHAT_MODEL,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 4096,
  };

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new MeshAIError(
      "MESH_API_ERROR",
      `Mesh API error (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new MeshAIError("EMPTY_RESPONSE", "Mesh API returned empty content");
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new MeshAIError("JSON_PARSE_ERROR", `Failed to parse Mesh API response: ${content.slice(0, 200)}`);
  }
}

// ─── Helper: Generate IDs ───

function generateMeshId(prefix: string = "mesh"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Mesh AI Provider Implementation ───

export class MeshAIProvider implements AIProvider {
  readonly name = "Mesh AI";
  readonly version = "1.0.0";
  readonly requiredTier: SubscriptionTier = "pro";
  readonly models: AIModelInfo[] = [
    { id: DEFAULT_VISION_MODEL, name: "GPT-4o (Vision)", provider: "openai" },
    { id: DEFAULT_CHAT_MODEL, name: "GPT-4o Mini (Chat)", provider: "openai" },
    { id: DEFAULT_TRANSCRIPTION_MODEL, name: "Whisper-1", provider: "openai" },
  ];

  readonly capabilities: AIProviderCapabilities = {
    vision: true,
    ocr: true,
    chartAnalysis: true,
    tradeSummary: true,
    coaching: true,
    transcription: true,
  };

  isAvailable(): boolean {
    const key = getApiKey();
    return typeof key === "string" && key.length > 0;
  }

  getModels(): AIModelInfo[] {
    return this.models;
  }

  // ─── Vision: Screenshot Analysis ───

  async analyzeScreenshot(request: VisionAnalyzeRequest): Promise<ScreenshotAnalysis | null> {
    const startTime = Date.now();
    console.log(`[MeshAI] Analyzing screenshot via Mesh API: ${request.imageUrl.slice(0, 50)}...`);

    try {
      // Build image content: prefer base64 if available, otherwise use URL
      const imageContent = request.imageBase64
        ? { type: "image_url" as const, image_url: { url: `data:${request.mimeType ?? "image/jpeg"};base64,${request.imageBase64}`, detail: "high" as const } }
        : { type: "image_url" as const, image_url: { url: request.imageUrl, detail: "high" as const } };

      const result = await meshChatCompletion<{
        tradeData: {
          pair: string;
          direction: string;
          entryPrice: number;
          exitPrice: number | null;
          stopLoss: number | null;
          takeProfit: number | null;
          positionSize: number;
          confidence: number;
          confidenceLevel: "low" | "medium" | "high";
          source: string;
          method: string;
        };
        detectedSetup: string;
        marketContext: string;
        keyLevels: Array<{ type: string; price: number; confidence: number; description: string }>;
        riskAssessment: {
          riskRewardRatio: number;
          riskPercent: number;
          potentialProfit: number;
          potentialLoss: number;
          assessment: string;
          recommendation: string;
        };
        confidence: number;
        confidenceLevel: "low" | "medium" | "high";
        status: "completed" | "failed";
      }>({
        model: DEFAULT_VISION_MODEL,
        messages: [
          { role: "system", content: "You are a trading chart analysis expert. Respond only with JSON." },
          {
            role: "user",
            content: [
              { type: "text", text: buildScreenshotAnalysisPrompt() },
              imageContent,
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "screenshot_analysis",
            schema: SCREENSHOT_ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
          },
        },
      });

      const processingTimeMs = Date.now() - startTime;

      return {
        id: generateMeshId("mesh_ss"),
        screenshotId: generateMeshId("mesh_sc"),
        tradeData: result.tradeData as ExtractedTradeData,
        detectedSetup: result.detectedSetup,
        marketContext: result.marketContext,
        keyLevels: result.keyLevels,
        riskAssessment: result.riskAssessment,
        confidence: Math.round(result.confidence),
        confidenceLevel: result.confidenceLevel,
        processingTimeMs,
        provider: this.name,
        model: DEFAULT_VISION_MODEL,
        analyzedAt: new Date().toISOString(),
        status: result.status,
      };
    } catch (err) {
      console.error("[MeshAI] Screenshot analysis failed:", err);
      return null;
    }
  }

  async analyzeScreenshotsBatch(requests: VisionAnalyzeRequest[]): Promise<ScreenshotAnalysis[]> {
    const results: ScreenshotAnalysis[] = [];
    for (const req of requests) {
      try {
        const result = await this.analyzeScreenshot(req);
        if (result) results.push(result);
      } catch (err) {
        console.warn(`[MeshAI] Batch item failed:`, err);
      }
    }
    return results;
  }

  // ─── Trade Summary ───

  async generateTradeSummary(input: TradeSummaryInput): Promise<TradeSummary | null> {
    const startTime = Date.now();
    console.log(`[MeshAI] Generating trade summary via Mesh API for ${input.pair} ${input.direction}`);

    try {
      const result = await meshChatCompletion<{
        title: string;
        overview: string;
        keyObservations: string[];
        whatWentWell: string[];
        whatToImprove: string[];
        psychologicalFactors: string[];
        technicalAnalysis: string;
        riskManagementAssessment: string;
        actionableRecommendations: string[];
        marketContext: string;
        confidence: number;
      }>({
        model: DEFAULT_CHAT_MODEL,
        messages: [
          { role: "system", content: "You are an expert trading analyst. Respond only with JSON." },
          { role: "user", content: buildTradeSummaryPrompt(input) },
        ],
        temperature: 0.4,
        max_tokens: 2048,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "trade_summary",
            schema: TRADE_SUMMARY_SCHEMA as unknown as Record<string, unknown>,
          },
        },
      });

      const processingTimeMs = Date.now() - startTime;

      return {
        id: generateMeshId("mesh_ts"),
        tradeId: generateMeshId("mesh_tr"),
        ...result,
        provider: this.name,
        model: DEFAULT_CHAT_MODEL,
        generatedAt: new Date().toISOString(),
        processingTimeMs,
      };
    } catch (err) {
      console.error("[MeshAI] Trade summary generation failed:", err);
      return null;
    }
  }

  // ─── Coaching ───

  async generateCoaching(input: CoachingInput): Promise<AICoaching | null> {
    const startTime = Date.now();
    console.log(`[MeshAI] Generating coaching via Mesh API for ${input.pair} ${input.direction}`);

    try {
      const result = await meshChatCompletion<{
        plan: {
          focus: string;
          summary: string;
          items: Array<{
            title: string;
            description: string;
            category: "risk-management" | "discipline" | "psychology" | "technical-analysis" | "performance";
            isCompleted: boolean;
            priority: "low" | "medium" | "high";
          }>;
          priority: "low" | "medium" | "high";
          timeframe: string;
          expectedOutcome: string;
        };
        insights: Array<{
          title: string;
          description: string;
          category: string;
          severity: "positive" | "warning" | "critical" | "info";
        }>;
        goals: Array<{
          title: string;
          description: string;
          category: string;
          isAchieved: boolean;
          progress: number;
        }>;
        feedback: {
          strengths: string[];
          weaknesses: string[];
          opportunities: string[];
          threats: string[];
          overallRating: number;
          overallComment: string;
        };
        confidence: number;
      }>({
        model: DEFAULT_CHAT_MODEL,
        messages: [
          { role: "system", content: "You are an expert trading coach and mentor. Respond only with JSON." },
          { role: "user", content: buildCoachingPrompt(input) },
        ],
        temperature: 0.5,
        max_tokens: 4096,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "coaching_analysis",
            schema: COACHING_SCHEMA as unknown as Record<string, unknown>,
          },
        },
      });

      const processingTimeMs = Date.now() - startTime;

      // Enrich items with IDs
      const itemsWithIds: CoachingItem[] = result.plan.items.map((item) => ({
        ...item,
        id: generateMeshId("mesh_ci"),
      }));

      const insightsWithIds = result.insights.map((insight) => ({
        ...insight,
        id: generateMeshId("mesh_in"),
      }));

      const goalsWithIds = result.goals.map((goal) => ({
        ...goal,
        id: generateMeshId("mesh_gl"),
      }));

      return {
        id: generateMeshId("mesh_co"),
        userId: generateMeshId("mesh_us"),
        tradeId: generateMeshId("mesh_tr"),
        plan: {
          ...result.plan,
          items: itemsWithIds,
        },
        insights: insightsWithIds,
        goals: goalsWithIds,
        feedback: result.feedback,
        confidence: Math.round(result.confidence),
        provider: this.name,
        model: DEFAULT_CHAT_MODEL,
        generatedAt: new Date().toISOString(),
        processingTimeMs,
      };
    } catch (err) {
      console.error("[MeshAI] Coaching generation failed:", err);
      return null;
    }
  }

  // ─── Transcription ───

  async transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResult | null> {
    console.log(`[MeshAI] Transcribing audio via Mesh API: ${request.audioUrl.slice(0, 50)}...`);

    try {
      const formData = new FormData();
      formData.append("model", DEFAULT_TRANSCRIPTION_MODEL);

      if (request.audioBase64) {
        // Convert base64 to blob
        const byteCharacters = atob(request.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: request.mimeType ?? "audio/webm" });
        formData.append("file", blob, "audio.webm");
      } else {
        // Fetch audio from URL and append
        const audioResponse = await fetch(request.audioUrl);
        const blob = await audioResponse.blob();
        const mimeType = request.mimeType ?? blob.type ?? "audio/webm";
        formData.append("file", blob, `audio.${mimeType.split("/")[1] ?? "webm"}`);
      }

      const url = `${MESH_BASE_URL}/v1/audio/transcriptions`;
      const apiKey = getApiKey();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // NOTE: Do NOT set Content-Type manually for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new MeshAIError(
          "MESH_API_ERROR",
          `Mesh transcription error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      return {
        text: data.text ?? "",
        confidence: data.confidence ?? 0.9,
        language: data.language ?? "en",
        provider: this.name,
      };
    } catch (err) {
      console.error("[MeshAI] Transcription failed:", err);
      return null;
    }
  }
}

// ─── Singleton Instance ───

let meshProviderInstance: MeshAIProvider | null = null;

export function getMeshAIProvider(): MeshAIProvider {
  if (!meshProviderInstance) {
    meshProviderInstance = new MeshAIProvider();
  }
  return meshProviderInstance;
}
