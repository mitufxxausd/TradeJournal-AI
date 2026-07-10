# AI Vision Architecture Documentation

## Overview

Phase 7A introduces a complete, production-ready AI Vision Provider architecture for TradeJournal AI. The current free tier continues using OCR (Tesseract.js) for text extraction. The architecture is designed so that paid AI Vision providers can be plugged in later with minimal code changes.

**Key Principle:** OCR is ALWAYS the primary source in the free tier. Vision providers enhance but never replace OCR unless explicitly configured.

## Architecture Diagram

### Current Pipeline (Free Tier)
```
Screenshot
  |
  v
OCR Text Extraction (Tesseract.js)
  |
  v
Parser (SymbolDetector + Price Extractor)
  |
  v
Trade Fusion Engine
  |
  v
Review (with sections)
  |
  v
Import
```

### Future Pipeline (With Vision Provider)
```
Screenshot
  |
  v
  |-------------------|-------------------|
  v                   v                   v
OCR Text        VisionProvider      (parallel)
Extraction      Analysis
  |                   |
  v                   v
Parser            Chart Understanding
  |                   |
  |---------|---------|
            |
            v
  Trade Fusion Engine (combines OCR + Vision)
            |
            v
  Review (with sections + Vision insights)
            |
            v
         Import
```

## File Structure (Phase 7A)

```
src/services/ai/vision/
├── index.ts                          # Centralized exports
├── VisionProvider.ts                 # Core VisionProvider interface
├── VisionProviderRegistry.ts         # Provider registry with priority
├── VisionAnalysisResult.ts           # Comprehensive result types
├── VisionFeatureTypes.ts             # Detailed feature detection types
├── types.ts                          # Legacy types (backward compat)
└── providers/
    ├── index.ts                      # Provider exports
    ├── MockVisionProvider.ts         # Development/testing provider
    └── StubVisionProviders.ts        # OpenAI, Gemini, Claude, OpenRouter stubs
```

## Module Responsibilities

### 1. OCR (Optical Character Recognition) - UNCHANGED
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

### 2. SymbolDetector - UNCHANGED
**Location:** `src/services/ocr/symbolDetector.ts`

**Responsibilities:**
- Search across multiple text sources (window title, chart title, broker title, watchlist, OCR blocks)
- Recognize standard aliases (XAUUSD <-> GOLD, BTCUSD <-> BTCUSDT, etc.)
- Return normalized standard symbols
- Return empty string with note if confidence is low (never "Undetected")

### 3. Parser - UNCHANGED
**Location:** `src/services/ocr/parser.ts`

**Responsibilities:**
- Convert OCR text into structured trade data
- Extract prices with context (labels, position, surrounding text)
- Classify prices: entry, stopLoss, takeProfit, lotSize, chartScale, indicator
- Filter out chart scale and indicator prices
- Extract direction from explicit words only (BUY, SELL, LONG, SHORT)
- Calculate confidence scores per field
- Calculate quality metrics (OCR Quality, Parser Confidence, Trade Completeness)

### 4. TradeFusionEngine - ENHANCED
**Location:** `src/services/ai/fusion/`

**Responsibilities:**
- Combine OCR and Vision provider outputs into unified trade candidates
- Track source and confidence for each field independently
- Flag fields that need user review
- Calculate overall confidence and completeness scores
- Provide vision provider status information
- **NEW:** Support for new VisionProvider architecture via `runFusionWithVisionProvider()`
- **NEW:** Automatic fallback to OCR when vision is unavailable
- **NEW:** Vision result conversion for backward compatibility

**Key Files:**
- `TradeFusionEngine.ts` - Engine implementation
- `types.ts` - Fusion types (enhanced with VisionAnalysisResult support)
- `index.ts` - Exports (includes new functions)

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

**NEW Functions:**
- `runFusionWithVisionProvider()` - Enhanced fusion with VisionProvider integration
- `initializeVisionRegistry()` - Initialize the vision provider registry
- `convertVisionResultToLegacy()` - Convert new results to legacy format
- `enhanceWithVisionData()` - Enhance candidates with VisionExtractedTradeData

### 5. Vision Provider Architecture - NEW (Phase 7A)

#### 5.1 VisionProvider Interface
**Location:** `src/services/ai/vision/VisionProvider.ts`

```typescript
interface VisionProvider {
  readonly name: string;
  readonly providerId: string;
  readonly version: string;
  readonly supportedFeatures: VisionFeatureFlags;
  isAvailable(): boolean;
  analyze(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult>;
  analyzeBatch(imageFiles: File[], options?: VisionRequestOptions): Promise<VisionBatchResult>;
  healthCheck?(): Promise<{ healthy: boolean; latencyMs: number; message: string }>;
}
```

#### 5.2 Vision Analysis Result
**Location:** `src/services/ai/vision/VisionAnalysisResult.ts`

Comprehensive result types including:
- `VisionAnalysisResult` - Complete analysis result
- `VisionChartAnalysis` - Chart pattern detection results
- `VisionExtractedTradeData` - Trade data extraction results
- `VisionFeatureFlags` - Feature enablement flags
- `VisionBatchResult` - Batch processing results

#### 5.3 Vision Feature Types
**Location:** `src/services/ai/vision/VisionFeatureTypes.ts`

Detailed feature detection types:
- `DetectedChartPattern` - Chart patterns (triangles, H&S, flags, etc.)
- `DetectedLevel` - Support/resistance levels
- `TrendAnalysis` - Trend direction and strength
- `DetectedCandlestickPattern` - Candlestick patterns
- `DetectedIndicator` - Technical indicators
- `DetectedTradeAnnotation` - Trade annotations on chart
- `VolumeAnalysis` - Volume profile
- `TimeframeDetection` - Timeframe identification
- `PlatformDetection` - Broker/platform identification

#### 5.4 Provider Registry
**Location:** `src/services/ai/vision/VisionProviderRegistry.ts`

Priority-based provider management:
```typescript
interface VisionProviderRegistry {
  register(provider: VisionProvider, priority?: number): void;
  unregister(providerId: string): boolean;
  getPrimaryProvider(): VisionProvider | null;
  getProvider(providerId: string): VisionProvider | null;
  getAllProviders(): RegisteredVisionProvider[];
  getAvailableProviders(): VisionProvider[];
  getProvidersByFeature(feature: VisionFeatureType): VisionProvider[];
  hasAvailableProvider(): boolean;
  // ... and more
}
```

**Usage:**
```typescript
const registry = getVisionProviderRegistry();
registry.register(new MockVisionProvider(), 0);  // Highest priority
registry.register(new OpenAIVisionProvider(), 10);

const primary = registry.getPrimaryProvider();
if (primary) {
  const result = await primary.analyze(imageFile);
}
```

#### 5.5 Mock Vision Provider
**Location:** `src/services/ai/vision/providers/MockVisionProvider.ts`

- Always available (no API key needed)
- Returns realistic mock data for all vision features
- Supports all feature types
- Simulates processing delays
- Used for development and testing

#### 5.6 Stub Providers
**Location:** `src/services/ai/vision/providers/StubVisionProviders.ts`

Stub implementations for:
- `OpenAIVisionProvider` - OpenAI GPT-4V/GPT-4o
- `GeminiVisionProvider` - Google Gemini
- `ClaudeVisionProvider` - Anthropic Claude
- `OpenRouterVisionProvider` - OpenRouter unified API

All stubs:
- Return `isAvailable() === false`
- Throw descriptive errors when called
- Ready for real implementation

## How to Add a Vision Provider

### Step 1: Implement the VisionProvider interface
```typescript
// src/services/ai/vision/providers/MyProvider.ts
import type { VisionProvider, VisionProviderConfig } from "../VisionProvider";
import type { VisionAnalysisResult, VisionRequestOptions } from "../VisionAnalysisResult";
import { DEFAULT_VISION_FEATURE_FLAGS } from "../VisionAnalysisResult";

export class MyVisionProvider implements VisionProvider {
  readonly name = "My Provider";
  readonly providerId = "myprovider";
  readonly version = "1.0.0";
  readonly supportedFeatures = { ...DEFAULT_VISION_FEATURE_FLAGS };

  private config: VisionProviderConfig;

  constructor(config?: Partial<VisionProviderConfig>) {
    this.config = {
      providerId: this.providerId,
      name: this.name,
      enabled: true,
      priority: 10,
      timeoutMs: 30000,
      ...config,
    };
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  async analyze(imageFile: File, options?: VisionRequestOptions): Promise<VisionAnalysisResult> {
    // Implementation here
  }

  async analyzeBatch(imageFiles: File[], options?: VisionRequestOptions): Promise<VisionBatchResult> {
    // Implementation here
  }
}
```

### Step 2: Register the provider
```typescript
// In your app initialization:
import { getVisionProviderRegistry } from "@/services/ai/vision";
import { MyVisionProvider } from "@/services/ai/vision/providers/MyProvider";

const registry = getVisionProviderRegistry();
registry.register(new MyVisionProvider({
  apiKey: import.meta.env.VITE_MY_PROVIDER_API_KEY,
  enabled: true,
  priority: 1,
}), 1);
```

### Step 3: Enable Vision in the Fusion Engine
```typescript
import { updateFusionConfig } from "@/services/ai/fusion";

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
- Detected required fields / total required fields
- Required fields: symbol, direction, entryPrice, stopLoss, takeProfit, positionSize

### Field-Level Confidence
Each field has its own confidence score:
- Explicit label found: 0.9-0.95
- Format match (e.g., EUR/USD): 0.85
- Context inference: 0.5-0.7
- Not detected: 0

## Exports

### From `src/services/ai/vision`

**Interfaces:**
- `VisionProvider` - Main provider interface
- `VisionProviderConfig` - Provider configuration
- `VisionProviderCapabilities` - Provider capabilities
- `VisionProviderRegistry` - Registry interface
- `RegisteredVisionProvider` - Registry entry type

**Result Types:**
- `VisionAnalysisResult` - Complete analysis result
- `VisionExtractedTradeData` - Extracted trade data
- `VisionChartAnalysis` - Chart analysis result
- `VisionFieldConfidence` - Field confidence scores
- `VisionRequestOptions` - Analysis request options
- `VisionBatchResult` - Batch result
- `VisionProviderInfo` - Provider information

**Feature Types:**
- `DetectedChartPattern`, `ChartPatternType`
- `DetectedLevel`, `LevelType`, `LevelStrength`
- `TrendAnalysis`, `TrendDirection`, `TrendStrength`
- `DetectedCandlestickPattern`, `CandlestickPatternType`
- `DetectedIndicator`, `IndicatorType`, `IndicatorSignal`
- `DetectedTradeAnnotation`, `AnnotationType`
- `VolumeAnalysis`, `TimeframeDetection`, `PlatformDetection`
- `VisionFeatureConfidence`, `DetectedRegion`

**Providers:**
- `MockVisionProvider`, `getMockVisionProvider`, `resetMockVisionProvider`
- `OpenAIVisionProvider`, `GeminiVisionProvider`, `ClaudeVisionProvider`, `OpenRouterVisionProvider`
- `createStubVisionProvider`, `createAllStubVisionProviders`

**Registry Functions:**
- `getVisionProviderRegistry` - Get singleton registry
- `resetVisionProviderRegistry` - Reset registry
- `createVisionProviderRegistry` - Create fresh registry

**Constants:**
- `DEFAULT_VISION_FEATURE_FLAGS` - Default feature flags

### From `src/services/ai/fusion`

**NEW Functions:**
- `runFusionWithVisionProvider()` - Enhanced fusion with vision
- `initializeVisionRegistry()` - Initialize default registry

**Existing Functions (preserved):**
- `runFusion()` - Original fusion (backward compatible)
- `getFusionConfig()`, `updateFusionConfig()`, `resetFusionConfig()`
- `getFusionProgress()`, `getVisionProviderStatus()`

## Backward Compatibility

All existing code continues to work without changes:
- `runFusion()` function signature unchanged
- Legacy vision types still exported from `src/services/ai/vision/types.ts`
- Old `VisionProvider` interface from `types.ts` still available
- OCR pipeline completely untouched
- All existing hooks, components, and pages work as before

## Testing

Run the following to verify the implementation:
```bash
cd app
npm install
npm run build    # Verify TypeScript and build
```

Ensure:
- No TypeScript errors
- No build errors
- All existing tests pass
- Screenshot Analysis page loads correctly
- OCR extraction still works

## Phase History

- **Phase 6C:** Initial vision architecture with basic types and stubs
- **Phase 7A:** Complete vision provider architecture (current)
  - New VisionProvider interface with feature flags
  - Comprehensive feature detection types
  - Provider registry with priority-based selection
  - Mock provider with realistic data
  - Stub providers for OpenAI, Gemini, Claude, OpenRouter
  - Enhanced TradeFusionEngine with vision integration
  - Full backward compatibility with existing OCR pipeline
