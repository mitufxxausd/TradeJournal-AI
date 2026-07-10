# AI Vision Architecture

## Overview

This document describes the AI Vision architecture for the TradeJournal-AI application.

## Providers

### OCR (Current)
- Tesseract.js for text extraction
- Multi-pass OCR with enhanced preprocessing (Phase 7C)

### AI Vision (Future)
- OpenAI Vision
- Google Gemini Vision
- Claude Vision
- OpenRouter Vision

## Components

### ScreenshotAnalysis
Main page for uploading and analyzing screenshots.

### OCR Pipeline
```
Image → Enhanced Preprocessing → Multi-Pass OCR → Text Merge → Parser → Trade Extraction → Validation
```

## Phase 7C: AI Trade Extraction, Workspace History & Smart Journal Integration

Phase 7C transforms the Screenshot Analysis feature into a production-ready AI Trade Extraction workflow. The AI does NOT analyze chart patterns - it focuses on extracting trading information accurately and providing advice based on extracted data and journal history.

### New Features

#### 1. Persistent AI Workspace History
- Every screenshot analysis is stored permanently in localStorage
- Survives page refreshes and browser restarts
- Stores: screenshot, OCR text, extracted trade, confidence scores, AI advice, review status, import status, journal trade ID, timestamp
- Automatic reload on page open
- Maximum 100 analyses (LRU eviction)

**Files:**
- `src/services/ai/historyStorage.ts` - CRUD operations, filtering, grouping, statistics
- `src/services/ai/types/screenshot-analysis.ts` - History types

#### 2. AI Screenshot History UI
- History panel with date grouping (Today, Yesterday, This Week, This Month, Older)
- Status indicators: Imported, Needs Review, Rejected
- Click to reopen full analysis
- Actions: Open, Duplicate, Delete, Re-analyze

**Files:**
- `src/hooks/ai/useScreenshotHistory.ts` - React hook for history management
- `src/pages/ai/ai-screenshot-analysis.tsx` - History panel integration

#### 3. Smart Screenshot Quality Analysis
Pre-OCR analysis that predicts OCR accuracy:
- **Resolution** - Width x height assessment
- **Blur** - Laplacian variance edge detection
- **Compression** - 8x8 JPEG block artifact detection
- **Brightness** - Optimal range detection
- **Contrast** - Standard deviation analysis
- **Text Visibility** - Edge density measurement
- **Expected OCR Accuracy** - Weighted prediction (0-100)
- **Explanation** - Human-readable quality explanation
- **Recommendations** - Actionable improvement tips

**Files:**
- `src/services/ai/imageQuality.ts` - Quality analysis algorithms

#### 4. Enhanced AI Trade Extraction
Per-field extraction with independent confidence scores:
- Symbol, Direction, Entry Price, Stop Loss, Take Profit, Lot Size
- Risk %, Timeframe, Broker, Date, Time, Order Type
- Never guesses missing values
- Color-coded review UI (Green=detected, Yellow=needs review, Red=missing)

**Files:**
- `src/services/ai/aiTradeAdvice.ts` - `ocrResultToExtractedTrade()` function

#### 5. OCR Improvements (Multi-Pass)
Enhanced preprocessing pipeline:
- Image upscaling (2x for small images)
- Grayscale conversion
- Contrast enhancement (factor 1.3)
- Adaptive thresholding (15px blocks)
- Noise reduction (median filter)
- Sharpening (unsharp mask)
- Multi-pass OCR (3 different configs, best result selected)
- Text merging across passes

**Files:**
- `src/services/ocr/tesseractOCR.ts` - Enhanced preprocessing, `runMultiPassOCR()`
- `src/services/ocr/index.ts` - Export `PreprocessOptions`, `runMultiPassOCR`

#### 6. AI Trade Advice (No Chart Analysis)
Advice based ONLY on extracted trade data and journal history:
- Risk:Reward calculation and assessment
- Stop loss distance analysis
- Trade structure validation
- Risk level assessment (low/medium/high)
- Journal history comparison:
  - Symbol trade count
  - Win rate for symbol
  - Most profitable session
  - Average R:R comparison
  - Behavior matching

**Files:**
- `src/services/ai/aiTradeAdvice.ts` - `generateTradeAdvice()` function

#### 7. Automatic Journal Integration
- Import Trade button creates journal entry
- Links screenshot analysis to trade
- Saves imported trade ID in analysis record
- Marks analysis as "Imported"
- Never loses relationship between screenshot and journal

**Files:**
- `src/services/ai/historyStorage.ts` - `markAsImported()`
- `src/pages/ai/ai-screenshot-analysis.tsx` - Import flow

#### 8. AI Workspace Dashboard Stats
Statistics displayed on AI Dashboard:
- Total Analyses
- Imported count
- Pending Review count
- Rejected count
- Average Confidence
- Average OCR Accuracy
- Most traded symbol
- Recent 7-day activity chart

**Files:**
- `src/services/ai/historyStorage.ts` - `getDashboardStats()`
- `src/pages/ai/ai-dashboard.tsx` - `WorkspaceStatsSection` component

### Updated Pipeline (Phase 7C)

```
Screenshot
  |
  v
Image Quality Analysis (pre-OCR prediction)
  |
  v
Enhanced Preprocessing (upscale, contrast, threshold, denoise, sharpen)
  |
  v
Multi-Pass OCR (3 configurations, best result)
  |
  v
Text Merge + Parser
  |
  v
Trade Field Extraction (per-field confidence)
  |
  v
AI Trade Advice (R:R analysis + journal history)
  |
  v
Save to Persistent History
  |
  v
Review UI (color-coded fields)
  |
  v
Import -> Journal Entry (linked)
```

### New File Structure

```
src/services/ai/
├── historyStorage.ts          # Persistent history CRUD
├── imageQuality.ts            # Image quality analysis
├── aiTradeAdvice.ts           # Trade advice generation
└── types/
    └── screenshot-analysis.ts # All Phase 7C types

src/hooks/ai/
└── useScreenshotHistory.ts    # History React hook

src/services/ocr/
├── tesseractOCR.ts            # Enhanced preprocessing + multi-pass OCR
└── index.ts                   # Export PreprocessOptions, runMultiPassOCR
```

### Key Types

```typescript
// ScreenshotAnalysis - Complete analysis record
interface ScreenshotAnalysis {
  id: string;
  screenshotDataUrl: string;
  ocrText: string;
  ocrResult: OCRResult | null;
  extractedTrade: ExtractedTradeData | null;
  imageQuality: ImageQualityMetrics | null;
  aiAdvice: TradeAdvice | null;
  status: "processing" | "needs_review" | "confirmed" | "imported" | "rejected" | "error";
  reviewStatus: "pending" | "reviewed" | "edited";
  importStatus: "not_imported" | "imported" | "failed";
  journalTradeId: string | null;
  timestamp: number;
  processingTimeMs: number;
  fileName: string;
  fileSize: number;
}

// ImageQualityMetrics - Pre-OCR quality prediction
interface ImageQualityMetrics {
  overall: number;              // 0-100
  resolution: { width, height, score, label };
  blur: { score, label };
  compression: { score, label };
  brightness: { score, label };
  contrast: { score, label };
  textVisibility: { score, label };
  expectedOCRAccuracy: number;  // Predicted OCR accuracy
  explanation: string;          // Why confidence is low/high
  recommendations: string[];    // How to improve
}

// TradeAdvice - AI-generated advice
interface TradeAdvice {
  riskReward: number | null;
  summary: string;
  points: string[];
  riskAssessment: {
    level: "low" | "medium" | "high";
    slDistance: number | null;
    rewardExceedsRisk: boolean;
    tradeStructureHealthy: boolean;
  };
  journalInsights: JournalInsight | null;
}

// ExtractedTradeData - Structured trade data
interface ExtractedTradeData {
  symbol: string;
  direction: "buy" | "sell" | "" | "unknown";
  entryPrice, stopLoss, takeProfit, lotSize, riskPercent: number | null;
  timeframe, broker, date, time, orderType: string | null;
  fieldConfidences: FieldConfidenceDetail[];
  overallConfidence: number;
}
```

### Backward Compatibility

All existing code continues to work without changes:
- OCR pipeline backward compatible
- Vision provider architecture untouched
- Existing hooks, components, and pages work as before
- New features are additive only

## Phase History

- **Phase 6C:** Initial vision architecture with basic types and stubs
- **Phase 7A:** Complete vision provider architecture
- **Phase 7B:** Improved AI Vision pipeline and provider framework
- **Phase 7C:** Production-ready AI Trade Extraction (current)
  - Persistent AI Workspace History
  - Smart Screenshot Quality Analysis
  - Enhanced multi-pass OCR with preprocessing
  - AI Trade Advice based on journal history
  - Color-coded review UI
  - Automatic journal integration
  - Workspace dashboard statistics
