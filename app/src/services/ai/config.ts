import type { AIProviderName, AIProviderConfig, AIProviderCapability } from "./types/common";

/**
 * AI Configuration
 * Centralized configuration for all AI providers
 * Reads from environment variables with sensible defaults
 */

// ─── Default Provider Configurations ───

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRIES = 2;

function readEnv(key: string, defaultValue: string): string {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key] ?? defaultValue;
  }
  return defaultValue;
}

function readEnvNumber(key: string, defaultValue: number): number {
  const val = readEnv(key, String(defaultValue));
  const parsed = Number.parseInt(val, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function readEnvBoolean(key: string, defaultValue: boolean): boolean {
  const val = readEnv(key, String(defaultValue));
  return val === "true" || val === "1";
}

/**
 * Get default provider configurations
 */
export function getDefaultProviderConfigs(): AIProviderConfig[] {
  const configs: AIProviderConfig[] = [
    // ─── Mock Provider (default for development) ───
    {
      name: "mock",
      enabled: readEnvBoolean("VITE_AI_MOCK_ENABLED", true),
      capabilities: [
        "chat",
        "vision",
        "ocr",
        "summary",
        "coaching",
        "transcription",
        "chart-analysis",
        "trade-analysis",
      ],
      priority: 0,
      timeoutMs: readEnvNumber("VITE_AI_MOCK_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
    // ─── OpenAI ───
    {
      name: "openai",
      apiKey: readEnv("VITE_OPENAI_API_KEY", ""),
      baseUrl: readEnv("VITE_OPENAI_BASE_URL", "https://api.openai.com/v1"),
      model: readEnv("VITE_OPENAI_MODEL", "gpt-4o"),
      enabled: readEnvBoolean("VITE_OPENAI_ENABLED", false),
      capabilities: ["chat", "vision", "summary", "coaching", "trade-analysis"],
      priority: readEnvNumber("VITE_OPENAI_PRIORITY", 1),
      timeoutMs: readEnvNumber("VITE_OPENAI_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
    // ─── Google Gemini ───
    {
      name: "gemini",
      apiKey: readEnv("VITE_GEMINI_API_KEY", ""),
      baseUrl: readEnv("VITE_GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1"),
      model: readEnv("VITE_GEMINI_MODEL", "gemini-2.0-flash"),
      enabled: readEnvBoolean("VITE_GEMINI_ENABLED", false),
      capabilities: ["chat", "vision", "ocr", "summary", "coaching", "chart-analysis", "trade-analysis"],
      priority: readEnvNumber("VITE_GEMINI_PRIORITY", 2),
      timeoutMs: readEnvNumber("VITE_GEMINI_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
    // ─── Claude (Anthropic) ───
    {
      name: "claude",
      apiKey: readEnv("VITE_CLAUDE_API_KEY", ""),
      baseUrl: readEnv("VITE_CLAUDE_BASE_URL", "https://api.anthropic.com/v1"),
      model: readEnv("VITE_CLAUDE_MODEL", "claude-sonnet-4-20250514"),
      enabled: readEnvBoolean("VITE_CLAUDE_ENABLED", false),
      capabilities: ["chat", "vision", "ocr", "summary", "coaching", "chart-analysis", "trade-analysis"],
      priority: readEnvNumber("VITE_CLAUDE_PRIORITY", 3),
      timeoutMs: readEnvNumber("VITE_CLAUDE_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
    // ─── OpenRouter ───
    {
      name: "openrouter",
      apiKey: readEnv("VITE_OPENROUTER_API_KEY", ""),
      baseUrl: readEnv("VITE_OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
      model: readEnv("VITE_OPENROUTER_MODEL", "anthropic/claude-sonnet-4"),
      enabled: readEnvBoolean("VITE_OPENROUTER_ENABLED", false),
      capabilities: ["chat", "vision", "summary", "coaching", "trade-analysis"],
      priority: readEnvNumber("VITE_OPENROUTER_PRIORITY", 4),
      timeoutMs: readEnvNumber("VITE_OPENROUTER_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
    // ─── Groq ───
    {
      name: "groq",
      apiKey: readEnv("VITE_GROQ_API_KEY", ""),
      baseUrl: readEnv("VITE_GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
      model: readEnv("VITE_GROQ_MODEL", "llama-3.3-70b-versatile"),
      enabled: readEnvBoolean("VITE_GROQ_ENABLED", false),
      capabilities: ["chat", "summary", "coaching", "trade-analysis"],
      priority: readEnvNumber("VITE_GROQ_PRIORITY", 5),
      timeoutMs: readEnvNumber("VITE_GROQ_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
    // ─── DeepSeek ───
    {
      name: "deepseek",
      apiKey: readEnv("VITE_DEEPSEEK_API_KEY", ""),
      baseUrl: readEnv("VITE_DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
      model: readEnv("VITE_DEEPSEEK_MODEL", "deepseek-chat"),
      enabled: readEnvBoolean("VITE_DEEPSEEK_ENABLED", false),
      capabilities: ["chat", "summary", "coaching", "trade-analysis"],
      priority: readEnvNumber("VITE_DEEPSEEK_PRIORITY", 6),
      timeoutMs: readEnvNumber("VITE_DEEPSEEK_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
    // ─── Azure OpenAI ───
    {
      name: "azure-openai",
      apiKey: readEnv("VITE_AZURE_OPENAI_API_KEY", ""),
      baseUrl: readEnv("VITE_AZURE_OPENAI_BASE_URL", ""),
      model: readEnv("VITE_AZURE_OPENAI_MODEL", "gpt-4o"),
      enabled: readEnvBoolean("VITE_AZURE_OPENAI_ENABLED", false),
      capabilities: ["chat", "vision", "summary", "coaching", "trade-analysis"],
      priority: readEnvNumber("VITE_AZURE_OPENAI_PRIORITY", 7),
      timeoutMs: readEnvNumber("VITE_AZURE_OPENAI_TIMEOUT", DEFAULT_TIMEOUT_MS),
    },
  ];

  return configs;
}

/**
 * Get the active (highest priority enabled) provider name
 */
export function getActiveProviderName(): AIProviderName {
  const configs = getDefaultProviderConfigs();
  const active = configs
    .filter((c) => c.enabled)
    .sort((a, b) => a.priority - b.priority)[0];

  return active?.name ?? "mock";
}

/**
 * Get configuration for a specific provider
 */
export function getProviderConfig(name: AIProviderName): AIProviderConfig | undefined {
  const configs = getDefaultProviderConfigs();
  return configs.find((c) => c.name === name);
}

/**
 * Get all enabled provider configs sorted by priority
 */
export function getEnabledProviderConfigs(): AIProviderConfig[] {
  return getDefaultProviderConfigs()
    .filter((c) => c.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get global AI settings
 */
export function getAISettings() {
  return {
    defaultTimeoutMs: readEnvNumber("VITE_AI_DEFAULT_TIMEOUT", DEFAULT_TIMEOUT_MS),
    defaultRetries: readEnvNumber("VITE_AI_DEFAULT_RETRIES", DEFAULT_RETRIES),
    enableAnalytics: readEnvBoolean("VITE_AI_ENABLE_ANALYTICS", false),
    logRequests: readEnvBoolean("VITE_AI_LOG_REQUESTS", false),
    maxConcurrentRequests: readEnvNumber("VITE_AI_MAX_CONCURRENT", 3),
  };
}

/**
 * Check if any real (non-mock) provider is configured
 */
export function hasRealProviderConfigured(): boolean {
  const configs = getDefaultProviderConfigs();
  return configs.some((c) => c.name !== "mock" && c.enabled && c.apiKey);
}
