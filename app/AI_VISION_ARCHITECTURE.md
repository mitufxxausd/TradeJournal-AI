# AI Vision Architecture Documentation

## Overview

Phase 6C introduces a production-ready AI Vision architecture for TradeJournal AI. The current free tier continues using OCR (Tesseract.js) for text extraction. The architecture is designed so that paid AI Vision providers can be plugged in later with minimal code changes.

## Architecture Diagram

### Current Pipeline (Free Tier)
```
Screenshot
  ↓
OCR Text Extraction (Tesseract.js)
  ↓
Parser (SymbolDetector + Price Extractor)
  ↓
Trade Fusion Engine
  ↓
Review (with sections)
  ↓
Import
```

### Future Pipeline (With Vision Provider)
```
Screenshot
  ↓
┌─────────────────┬──────────────────┐
↓                 ↓                  ↓
OCR Text      AI Vision Analysis   (parallel)
Extraction    (OpenAI/Gemini/Claude)
  ↓                 ↓
Parser            Chart Understanding
  ↓                 ↓
└──────┬──────────┘
       ↓
Trade Fusion Engine (combines OCR + Vision)
  ↓
Review (with sections + Vision insights)
  ↓
Import
```

## Module Responsibilities

### 1. OCR (Optical Character Recognition)
**Location:** `src/services/ocr/`

**Responsibilities:**
- Extract visible text from screenshots
- Extract numbers, broker labels, window titles, chart titles
- Return raw text + confidence scores
- NEVER interpret charts or understand visual context

**Key Files:**
- `tesseractOCR.ts` - Tesseract.js provider implementation with lazy loading
- `parser.ts` - Text-to-trade parser with price context analysis
- `symbolDetector.ts` - Advanced symbol detection with alias support
- `types.ts` - Shared OCR type definitions

**Explicitly Ignores:**
- Price scale numbers
- Axis labels
- Indicator values (RSI, MACD, EMA, etc.)
- TradingView/MT4/MT5 toolbar text
- Windows title bar text
- Zoom values, crosshair coordinates
- Timestamps, watermarks, news widgets, ads

### 2. SymbolDetector
**Location:** `src/services/ocr/symbolDetector.ts`

**Responsibilities:**
- Search across multiple text sources (window title, chart title, broker title, watchlist, OCR blocks)
- Recognize standard aliases (XAUUSD ↔ GOLD, BTCUSD ↔ BTCUSDT, etc.)
- Return normalized standard symbols
- Return empty string with note if confidence is low (never "Undetected")

**Supported Aliases:**
- Gold: GOLD, XAU/USD, XAU-USD, SPOT GOLD → XAUUSD
- Bitcoin: BTC, BTC/USD, BTCUSDT, BITCOIN → BTCUSD
- Ethereum: ETH, ETH/USD, ETHUSDT → ETHUSD
- Indices: NAS100, NASDAQ, US30, DOW, SPX500, S&P500 → standardized
- Oil: USOIL, WTI, BRENT, CRUDE → standardized

### 3. Parser
**Location:** `src/services/ocr/parser.ts`

**Responsibilities:**
- Convert OCR text into structured trade data
- Extract prices with context (labels, position, surrounding text)
- Classify prices: entry, stopLoss, takeProfit, lotSize, chartScale, indicator
- Filter out chart scale and indicator prices
- Extract direction from explicit words only (BUY, SELL, LONG, SHORT)
- Calculate confidence scores per field
- Calculate quality metrics (OCR Quality, Parser Confidence, Trade Completeness)

**Price Classification Rules:**
- TP ONLY from explicit labels ("TP:", "Take Profit:", "Target:")
- SL ONLY from explicit labels ("SL:", "Stop Loss:")
- Entry from explicit labels or @symbol patterns
- Chart scale numbers are ALWAYS discarded
- Isolated prices in sequences (price ladder) are discarded

### 4. TradeFusionEngine
**Location:** `src/services/ai/fusion/`

**Responsibilities:**
- Combine OCR and Vision provider outputs into unified trade candidates
- Track source and confidence for each field independently
- Flag fields that need user review
- Calculate overall confidence and completeness scores
- Provide vision provider status information

**Key Features:**
- Each field has independent confidence and source tracking
- Vision results override OCR only when configured and higher confidence
- Fields with low confidence are flagged for review
- Never invents data - null if not detected

**Configuration:**
```typescript
interface FusionEngineConfig {
  enableVision: boolean;        // false by default (free tier)
  enableOCR: boolean;           // true by default
  primarySource: "ocr" | "vision" | "auto";
  minConfidenceThreshold: number;
  requireExplicitPriceLabels: boolean;
}
```

### 5. Vision Provider Architecture
**Location:** `src/services/ai/vision/`

**Interface:**
```typescript
interface VisionProvider {
  readonly name: string;
  readonly providerId: string;
  isAvailable(): boolean;
  analyzeChart(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult>;
  extractTradeData(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult>;
}
```

**Stub Providers (ready for implementation):**
- `OpenAIVisionProvider` - OpenAI GPT-4V
- `GeminiVisionProvider` - Google Gemini
- `ClaudeVisionProvider` - Anthropic Claude
- `OpenRouterVisionProvider` - OpenRouter unified API

All stubs return `isAvailable() === false` and throw when called, ensuring no accidental API usage.

**Provider Registry:**
```typescript
const registry = getVisionRegistry();
registry.register(new OpenAIVisionProvider());
// Providers checked in priority order
const primary = registry.getPrimaryProvider();
```

### 6. Review UI
**Location:** `src/pages/ai/ai-screenshot-analysis.tsx`

**Features:**
- AI Vision Status panel (toggleable)
- Section-based review cards:
  - Detected Successfully (green)
  - Missing Information (amber)
  - Needs Review (amber banner)
  - Warnings (red banner)
- Editable fields for every trade property
- Quality metrics display (OCR Quality, Parser Confidence, Completeness)
- Mobile-responsive design
- Fullscreen image preview
- Raw OCR text viewer (collapsible)

## How to Add a Vision Provider

### Step 1: Implement the VisionProvider interface
```typescript
// src/services/ai/vision/providers/MyProvider.ts
import type { VisionProvider, VisionRequestOptions, VisionAnalysisResult } from "../types";

export class MyVisionProvider implements VisionProvider {
  readonly name = "My Provider";
  readonly providerId = "myprovider";

  isAvailable(): boolean {
    return !!import.meta.env.VITE_MY_PROVIDER_API_KEY;
  }

  async analyzeChart(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    // Implementation here
  }

  async extractTradeData(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    // Implementation here
  }
}
```

### Step 2: Register the provider
```typescript
// In src/services/ai/vision/types.ts
// Add to getVisionRegistry():
export function getVisionRegistry(): VisionProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new DefaultVisionRegistry();
    globalRegistry.register(new OpenAIVisionProvider());
    globalRegistry.register(new GeminiVisionProvider());
    globalRegistry.register(new ClaudeVisionProvider());
    globalRegistry.register(new OpenRouterVisionProvider());
    globalRegistry.register(new MyVisionProvider()); // <-- Add here
  }
  return globalRegistry;
}
```

### Step 3: Add configuration
```typescript
// In src/services/ai/config.ts
// Add to getDefaultProviderConfigs():
{
  name: "myprovider",
  apiKey: readEnv("VITE_MY_PROVIDER_API_KEY", ""),
  baseUrl: readEnv("VITE_MY_PROVIDER_BASE_URL", "https://api.myprovider.com"),
  model: readEnv("VITE_MY_PROVIDER_MODEL", "default"),
  enabled: readEnvBoolean("VITE_MY_PROVIDER_ENABLED", false),
  capabilities: ["vision", "ocr"],
  priority: readEnvNumber("VITE_MY_PROVIDER_PRIORITY", 5),
  timeoutMs: readEnvNumber("VITE_MY_PROVIDER_TIMEOUT", 30000),
}
```

### Step 4: Enable Vision in the Fusion Engine
```typescript
// When a real provider is configured:
updateFusionConfig({
  enableVision: true,
  primarySource: "auto",
});
```

## Confidence Metrics

All confidence metrics are measurable and derived from concrete values:

### OCR Quality (0-100)
- Based on Tesseract.js engine confidence score
- Measures text recognition quality

### Parser Confidence (0-100)
- Based on successfully parsed fields
- Average of individual field confidences
- Considers explicit labels vs inferred values

### Trade Completeness (0-100)
- Detected required fields ÷ total required fields
- Required fields: symbol, direction, entryPrice, stopLoss, takeProfit, positionSize

### Field-Level Confidence
Each field has its own confidence score:
- Explicit label found: 0.9-0.95
- Format match (e.g., EUR/USD): 0.85
- Context inference: 0.5-0.7
- Not detected: 0

## Mobile Improvements

Phase 6C includes comprehensive mobile UX improvements:
- Responsive grid layouts (stack on mobile, side-by-side on desktop)
- Touch-friendly button sizes (min 44px tap targets)
- Improved spacing and padding for small screens
- Scrollable raw OCR text with word wrapping
- Proper landscape screenshot handling
- Fullscreen modal with proper z-indexing
- Font size scaling for readability
- Flex-wrap for badges and action buttons

## File Structure

```
src/
├── services/
│   ├── ocr/
│   │   ├── index.ts              # OCR exports
│   │   ├── types.ts              # OCR types & interfaces
│   │   ├── tesseractOCR.ts       # Tesseract provider
│   │   ├── parser.ts             # Trade parser
│   │   └── symbolDetector.ts     # Symbol detection
│   ├── ai/
│   │   ├── index.ts              # AI module exports
│   │   ├── fusion/               # Trade Fusion Engine
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── TradeFusionEngine.ts
│   │   ├── vision/               # Vision provider architecture
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   └── config.ts             # Provider configuration
│   └── ...
├── hooks/
│   └── use-ocr.ts                # OCR hook with fusion integration
├── pages/
│   └── ai/
│       └── ai-screenshot-analysis.tsx  # Main analysis page
└── ...
```

## Testing

Run the following to verify the implementation:
```bash
cd app
npm install
npm run dev      # Start dev server
npm run build    # Verify TypeScript and build
```

Ensure:
- Screenshot Analysis page loads correctly
- OCR extraction works with test screenshots
- Trade review cards display sections properly
- Mobile layout is responsive
- No TypeScript errors
- No build errors
