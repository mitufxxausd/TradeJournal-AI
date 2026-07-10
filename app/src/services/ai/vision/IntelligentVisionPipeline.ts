/**
 * Intelligent Vision Pipeline Implementation
 * Executes the modular vision pipeline for screenshot analysis.
 *
 * Pipeline stages:
 *   Screenshot → OCR → Layout Detection → Chart Region Detection
 *   → Text Region Detection → Symbol Detection → Trade Field Extraction
 *   → AI Vision Provider → Trade Review → Import
 */

import type {
  PipelineInput,
  PipelineOutput,
  PipelineContext,
  PipelineStageResult,
  ExtractedTradeFields,
  DetectedImageRegion,
  DetectedSymbolResult,
  PipelineConfidenceScores,
} from "./pipeline";
import { createPipelineContext, createEmptyPipelineOutput } from "./pipeline";
import type { RegionDetectionResult } from "./regionDetection";
import { detectRegions, getTradeRelevantText } from "./regionDetection";
import { detectSymbolWithRegions } from "./symbolDetection";
import type { TradeFieldExtractionResult } from "./tradeFieldExtraction";
import { extractTradeFields } from "./tradeFieldExtraction";
import { normalizeOCRText, filterTradeRelevantText } from "./ocrProcessing";
import { getVisionProviderRegistry } from "./VisionProviderRegistry";
import type { VisionProvider } from "./VisionProvider";
import type { OCRResult } from "@/services/ocr/types";
import { parseOCRText } from "@/services/ocr/parser";

// ─── Pipeline Implementation ───

export class DefaultIntelligentVisionPipeline {
  private abortController: AbortController | null = null;

  /**
   * Execute the full intelligent vision pipeline.
   */
  async execute(input: PipelineInput): Promise<PipelineOutput> {
    this.abortController = new AbortController();
    const startTime = Date.now();

    const context = createPipelineContext(input.imageFile, input.options || {});
    context.abortSignal = input.abortSignal || this.abortController.signal;

    const output = createEmptyPipelineOutput();
    output.metadata.startTime = startTime;

    try {
      // Stage 1: OCR
      const ocrResult = await this.runOCRStage(input.imageFile, context);
      output.stageResults.set("ocr", ocrResult as PipelineStageResult<unknown>);

      if (!ocrResult.success || !ocrResult.output) {
        output.success = false;
        output.summary = "OCR failed - no text could be extracted from the image";
        return output;
      }

      const ocrData = ocrResult.output as OCRResult;
      output.ocrResult = ocrData;
      output.metadata.stagesCompleted.push("ocr");

      // Stage 2: OCR Processing (normalization + filtering)
      const processedText = this.processOCRText(ocrData.rawText);

      // Stage 3: Region Detection
      const regionResult = await this.runRegionDetectionStage(ocrData.rawText, context);
      output.stageResults.set("region_detection", regionResult as PipelineStageResult<unknown>);

      const regions = regionResult.success
        ? (regionResult.output as RegionDetectionResult).regions
        : [];
      output.detectedRegions = regions;

      if (regionResult.success) {
        output.metadata.stagesCompleted.push("region_detection");
      }

      // Stage 4: Symbol Detection
      const symbolResult = this.runSymbolDetectionStage(regions, processedText);
      output.detectedSymbol = symbolResult;

      if (symbolResult.confidence > 0) {
        output.metadata.stagesCompleted.push("symbol_detection");
      }

      // Stage 5: Trade Field Extraction
      const extractionResult = await this.runTradeFieldExtractionStage(
        ocrData,
        regions,
        symbolResult
      );
      output.stageResults.set(
        "trade_field_extraction",
        extractionResult as unknown as PipelineStageResult<unknown>
      );

      if (extractionResult.fields) {
        output.extractedTrade = extractionResult.fields;
        output.metadata.stagesCompleted.push("trade_field_extraction");
      }

      // Stage 6: AI Vision Provider (optional, only if available)
      const visionResult = await this.runVisionProviderStage(input.imageFile, context);
      if (visionResult) {
        output.visionResult = visionResult;
        output.stageResults.set(
          "ai_vision",
          { stage: "ai_vision", success: true, output: visionResult, processingTimeMs: 0 }
        );
        output.metadata.stagesCompleted.push("ai_vision");
      } else {
        output.metadata.stagesSkipped.push("ai_vision");
      }

      // Calculate confidence scores
      output.confidence = this.calculateConfidenceScores(
        ocrData,
        regions,
        symbolResult,
        extractionResult.fields || null
      );

      output.success = true;
      output.summary = this.generateSummary(output);
      output.metadata.stagesCompleted = [...output.metadata.stagesCompleted];

    } catch (error) {
      output.success = false;
      output.summary = error instanceof Error
        ? `Pipeline error: ${error.message}`
        : "Pipeline execution failed";
      output.metadata.errors.push({
        stage: "trade_field_extraction",
        error: output.summary,
        recoverable: false,
      });
    }

    const totalTime = Date.now() - startTime;
    output.metadata.performance.push({
      stage: "trade_field_extraction",
      durationMs: totalTime,
    });

    return output;
  }

  /**
   * Cancel the pipeline execution.
   */
  cancel(): void {
    this.abortController?.abort();
  }

  // ─── Private Stage Runners ───

  private async runOCRStage(
    imageFile: File,
    context: PipelineContext
  ): Promise<{ success: boolean; output: OCRResult | null; processingTimeMs: number }> {
    const startTime = Date.now();

    try {
      // Lazy load OCR module
      const { runOCR } = await import("@/services/ocr");
      const result = await runOCR(imageFile, {
        onProgress: (progress: number) => {
          // Progress callback could be used for UI updates
        },
      });

      // Parse the OCR text
      const parsedResult = parseOCRText(result.text);

      // Enhance with original OCR confidence
      const enhancedResult: OCRResult = {
        ...parsedResult,
        rawText: result.text, // Keep original text too
      };

      return {
        success: true,
        output: enhancedResult,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  private processOCRText(rawText: string): string {
    const normalized = normalizeOCRText(rawText);
    const filtered = filterTradeRelevantText(normalized);
    return filtered || normalized;
  }

  private async runRegionDetectionStage(
    ocrText: string,
    context: PipelineContext
  ): Promise<{ success: boolean; output: RegionDetectionResult | null; processingTimeMs: number }> {
    const startTime = Date.now();

    try {
      const result = detectRegions(ocrText);
      return {
        success: true,
        output: result,
        processingTimeMs: Date.now() - startTime,
      };
    } catch {
      return {
        success: false,
        output: null,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  private runSymbolDetectionStage(
    regions: DetectedImageRegion[],
    processedText: string
  ): DetectedSymbolResult {
    return detectSymbolWithRegions(regions, processedText);
  }

  private async runTradeFieldExtractionStage(
    ocrResult: OCRResult,
    regions: DetectedImageRegion[],
    symbolResult: DetectedSymbolResult
  ): Promise<TradeFieldExtractionResult> {
    const { extractTradeFields } = await import("./tradeFieldExtraction");
    return extractTradeFields({
      ocrResult,
      regions,
      symbolResult,
    });
  }

  private async runVisionProviderStage(
    imageFile: File,
    context: PipelineContext
  ): Promise<import("./VisionAnalysisResult").VisionAnalysisResult | null> {
    try {
      const registry = getVisionProviderRegistry();
      const primary = registry.getPrimaryProvider();

      if (!primary || !primary.isAvailable()) {
        return null;
      }

      const result = await primary.analyze(imageFile, context.options);
      return result;
    } catch {
      return null;
    }
  }

  // ─── Confidence Calculation ───

  private calculateConfidenceScores(
    ocrResult: OCRResult,
    regions: DetectedImageRegion[],
    symbolResult: DetectedSymbolResult,
    extractedFields: ExtractedTradeFields | null
  ): PipelineConfidenceScores {
    const ocrQuality = ocrResult.confidence || ocrResult.overallConfidence || 0;

    const regionConfidence = regions.length > 0
      ? regions.reduce((sum, r) => sum + r.confidence, 0) / regions.length
      : 0;

    const symbolConfidence = symbolResult.confidence;

    const tradeFieldConfidence = extractedFields
      ? extractedFields.overallConfidence
      : 0;

    const visionConfidence = 0; // No vision provider used

    // Layout detection is derived from region detection
    const layoutConfidence = regionConfidence;

    // Overall is weighted average
    const overall = Math.round(
      (ocrQuality * 0.25 +
        layoutConfidence * 0.15 +
        regionConfidence * 0.15 +
        symbolConfidence * 0.2 +
        tradeFieldConfidence * 0.25) *
      100
    ) / 100;

    return {
      ocrQuality,
      layoutDetection: layoutConfidence,
      regionDetection: regionConfidence,
      symbolDetection: symbolConfidence,
      tradeFieldExtraction: tradeFieldConfidence,
      visionProvider: visionConfidence,
      overall,
    };
  }

  // ─── Summary Generation ───

  private generateSummary(output: PipelineOutput): string {
    const parts: string[] = [];

    if (output.detectedSymbol?.symbol) {
      parts.push(`Symbol: ${output.detectedSymbol.symbol}`);
    }

    if (output.extractedTrade) {
      const t = output.extractedTrade;
      if (t.direction.value) parts.push(`Direction: ${t.direction.value}`);
      if (t.entryPrice.value) parts.push(`Entry: ${t.entryPrice.value}`);
      if (t.stopLoss.value) parts.push(`SL: ${t.stopLoss.value}`);
      if (t.takeProfit.value) parts.push(`TP: ${t.takeProfit.value}`);
    }

    parts.push(`Overall confidence: ${Math.round(output.confidence.overall * 100)}%`);

    const stagesCompleted = output.metadata.stagesCompleted.length;
    const stagesTotal = output.metadata.stagesCompleted.length + output.metadata.stagesSkipped.length;
    parts.push(`Stages: ${stagesCompleted}/${stagesTotal} completed`);

    return parts.join(" | ");
  }
}

// ─── Singleton ───

let pipelineInstance: DefaultIntelligentVisionPipeline | null = null;

export function getIntelligentVisionPipeline(): DefaultIntelligentVisionPipeline {
  if (!pipelineInstance) {
    pipelineInstance = new DefaultIntelligentVisionPipeline();
  }
  return pipelineInstance;
}

export function resetIntelligentVisionPipeline(): void {
  pipelineInstance = null;
}

// ─── Convenience Function ───

/**
 * Run the intelligent vision pipeline on a screenshot.
 */
export async function analyzeScreenshot(
  imageFile: File,
  options?: PipelineInput["options"]
): Promise<PipelineOutput> {
  const pipeline = getIntelligentVisionPipeline();
  return pipeline.execute({ imageFile, options });
}
