/**
 * Lazy Loader for AI Vision Components
 * Reduces bundle size by loading heavy modules on demand.
 *
 * Modules loaded lazily:
 *  - OCR (Tesseract.js)
 *  - Vision providers
 *  - Parser
 *  - Large AI components
 */

// ─── Lazy Load Cache ───

interface LazyModuleCache {
  ocr?: typeof import("@/services/ocr");
  parser?: typeof import("@/services/ocr/parser");
  tesseract?: typeof import("@/services/ocr/tesseractOCR");
  symbolDetector?: typeof import("@/services/ocr/symbolDetector");
  mockProvider?: typeof import("./providers/MockVisionProvider");
  fusionEngine?: typeof import("@/services/ai/fusion");
  regionDetection?: typeof import("./regionDetection");
  tradeFieldExtraction?: typeof import("./tradeFieldExtraction");
  ocrProcessing?: typeof import("./ocrProcessing");
  symbolDetection?: typeof import("./symbolDetection");
}

const cache: LazyModuleCache = {};

// ─── Lazy Load Functions ───

/**
 * Lazily load the OCR module.
 */
export async function loadOCRModule(): Promise<typeof import("@/services/ocr")> {
  if (!cache.ocr) {
    cache.ocr = await import("@/services/ocr");
  }
  return cache.ocr;
}

/**
 * Lazily load the parser module.
 */
export async function loadParserModule(): Promise<typeof import("@/services/ocr/parser")> {
  if (!cache.parser) {
    cache.parser = await import("@/services/ocr/parser");
  }
  return cache.parser;
}

/**
 * Lazily load the Tesseract OCR module.
 */
export async function loadTesseractModule(): Promise<typeof import("@/services/ocr/tesseractOCR")> {
  if (!cache.tesseract) {
    cache.tesseract = await import("@/services/ocr/tesseractOCR");
  }
  return cache.tesseract;
}

/**
 * Lazily load the symbol detector module.
 */
export async function loadSymbolDetectorModule(): Promise<typeof import("@/services/ocr/symbolDetector")> {
  if (!cache.symbolDetector) {
    cache.symbolDetector = await import("@/services/ocr/symbolDetector");
  }
  return cache.symbolDetector;
}

/**
 * Lazily load the Mock Vision Provider.
 */
export async function loadMockVisionProvider(): Promise<typeof import("./providers/MockVisionProvider")> {
  if (!cache.mockProvider) {
    cache.mockProvider = await import("./providers/MockVisionProvider");
  }
  return cache.mockProvider;
}

/**
 * Lazily load the fusion engine.
 */
export async function loadFusionEngine(): Promise<typeof import("@/services/ai/fusion")> {
  if (!cache.fusionEngine) {
    cache.fusionEngine = await import("@/services/ai/fusion");
  }
  return cache.fusionEngine;
}

/**
 * Lazily load the region detection module.
 */
export async function loadRegionDetection(): Promise<typeof import("./regionDetection")> {
  if (!cache.regionDetection) {
    cache.regionDetection = await import("./regionDetection");
  }
  return cache.regionDetection;
}

/**
 * Lazily load the trade field extraction module.
 */
export async function loadTradeFieldExtraction(): Promise<typeof import("./tradeFieldExtraction")> {
  if (!cache.tradeFieldExtraction) {
    cache.tradeFieldExtraction = await import("./tradeFieldExtraction");
  }
  return cache.tradeFieldExtraction;
}

/**
 * Lazily load the OCR processing module.
 */
export async function loadOCRProcessing(): Promise<typeof import("./ocrProcessing")> {
  if (!cache.ocrProcessing) {
    cache.ocrProcessing = await import("./ocrProcessing");
  }
  return cache.ocrProcessing;
}

/**
 * Lazily load the symbol detection module.
 */
export async function loadSymbolDetection(): Promise<typeof import("./symbolDetection")> {
  if (!cache.symbolDetection) {
    cache.symbolDetection = await import("./symbolDetection");
  }
  return cache.symbolDetection;
}

// ─── Preload Functions ───

/**
 * Preload OCR module in the background.
 */
export function preloadOCR(): void {
  setTimeout(() => {
    loadOCRModule().catch(() => { /* silent preload failure */ });
  }, 100);
}

/**
 * Preload parser module in the background.
 */
export function preloadParser(): void {
  setTimeout(() => {
    loadParserModule().catch(() => { /* silent preload failure */ });
  }, 200);
}

/**
 * Preload all vision modules in the background.
 */
export function preloadVisionModules(): void {
  preloadOCR();
  preloadParser();

  setTimeout(() => {
    loadRegionDetection().catch(() => { /* silent */ });
    loadTradeFieldExtraction().catch(() => { /* silent */ });
    loadOCRProcessing().catch(() => { /* silent */ });
    loadSymbolDetection().catch(() => { /* silent */ });
  }, 500);
}

// ─── Cache Management ───

/**
 * Clear all cached modules.
 */
export function clearLazyCache(): void {
  Object.keys(cache).forEach((key) => {
    delete (cache as Record<string, unknown>)[key];
  });
}

/**
 * Get cache statistics.
 */
export function getLazyCacheStats(): { loaded: string[]; unloaded: string[] } {
  const allModules = [
    "ocr", "parser", "tesseract", "symbolDetector",
    "mockProvider", "fusionEngine",
    "regionDetection", "tradeFieldExtraction", "ocrProcessing", "symbolDetection",
  ];

  const loaded = allModules.filter((m) => (cache as Record<string, unknown>)[m] !== undefined);
  const unloaded = allModules.filter((m) => (cache as Record<string, unknown>)[m] === undefined);

  return { loaded, unloaded };
}

// ─── Async Helper Types ───

export type LazyLoadedOCR = Awaited<ReturnType<typeof loadOCRModule>>;
export type LazyLoadedParser = Awaited<ReturnType<typeof loadParserModule>>;
export type LazyLoadedTesseract = Awaited<ReturnType<typeof loadTesseractModule>>;
export type LazyLoadedMockProvider = Awaited<ReturnType<typeof loadMockVisionProvider>>;
export type LazyLoadedFusion = Awaited<ReturnType<typeof loadFusionEngine>>;
export type LazyLoadedRegionDetection = Awaited<ReturnType<typeof loadRegionDetection>>;
export type LazyLoadedTradeFieldExtraction = Awaited<ReturnType<typeof loadTradeFieldExtraction>>;
export type LazyLoadedOCRProcessing = Awaited<ReturnType<typeof loadOCRProcessing>>;
export type LazyLoadedSymbolDetection = Awaited<ReturnType<typeof loadSymbolDetection>>;
