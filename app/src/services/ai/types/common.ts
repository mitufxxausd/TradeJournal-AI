/**
 * Common types shared across all AI providers
 */

export type AIProviderName =
  | "mock"
  | "openai"
  | "gemini"
  | "claude"
  | "openrouter"
  | "groq"
  | "deepseek"
  | "azure-openai";

export type AIProviderCapability =
  | "chat"
  | "vision"
  | "ocr"
  | "summary"
  | "coaching"
  | "transcription"
  | "chart-analysis"
  | "trade-analysis";

export interface AIProviderConfig {
  name: AIProviderName;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  enabled: boolean;
  capabilities: AIProviderCapability[];
  priority: number;
}

export interface AIRequestOptions {
  timeoutMs?: number;
  retries?: number;
  abortSignal?: AbortSignal;
}

export interface AIResponse<T> {
  data: T;
  provider: AIProviderName;
  model: string;
  processingTimeMs: number;
  timestamp: string;
}

export interface AIProcessingStatus {
  status: "idle" | "loading" | "success" | "error";
  progress?: number;
  message?: string;
  error?: string;
}

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProviderName;
  capabilities: AIProviderCapability[];
  contextWindow: number;
  maxOutputTokens: number;
}
