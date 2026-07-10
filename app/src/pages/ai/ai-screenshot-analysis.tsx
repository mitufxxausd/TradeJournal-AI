/**
 * AI Screenshot Analysis Page
 * Phase 7C: AI Trade Extraction, Workspace History & Smart Journal Integration
 *
 * Workflow:
 *   Upload Screenshot → Image Quality Analysis → Enhanced OCR →
 *   Trade Extraction → AI Advice → Review → Import → Journal Integration
 *
 * Features:
 * - Persistent analysis history (survives page refresh)
 * - Smart image quality analysis with OCR accuracy prediction
 * - Enhanced multi-pass OCR with preprocessing
 * - AI trade advice based on extracted data and journal history
 * - Color-coded review UI (green/yellow/red)
 * - Automatic journal integration
 * - Workspace dashboard stats
 */

import { useState, useRef, useCallback, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubscription } from "@/hooks/use-subscription";
import { useOCR } from "@/hooks/use-ocr";
import { useScreenshotHistory } from "@/hooks/ai";
import { useTrades } from "@/hooks/use-trades";
import { analyzeImageQuality, generateTradeAdvice, ocrResultToExtractedTrade } from "@/services/ai";
import type { OCRResult } from "@/services/ocr";
import type { ScreenshotAnalysis, ImageQualityMetrics, TradeAdvice, ExtractedTradeData } from "@/services/ai";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Camera, Upload, X, Maximize2, Trash2, Loader2, Lock,
  TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle,
  FileText, Eye, ChevronDown, ChevronUp, Check, Pencil,
  XCircle, Plus, ScanText, BarChart3, Info, Monitor, Brain,
  History, Gauge, Lightbulb, Copy, RotateCcw, ChevronLeft,
  ThumbsUp, ThumbsDown,
} from "lucide-react";

// ─── Types ───

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  analysisId: string | null;
  status: "ready" | "processing" | "completed" | "error";
}

// ─── Feature Gate ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Screenshot Analysis Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Pro</span> or{" "}
        <span className="font-semibold text-primary">Elite</span> to unlock OCR-powered screenshot analysis with trade extraction.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Image Quality Display ───

function ImageQualityDisplay({ quality }: { quality: ImageQualityMetrics }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Gauge className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Overall Quality</p>
          <div className="flex items-center gap-2">
            <Progress value={quality.overall} className="h-2 flex-1" />
            <span className={cn("text-sm font-bold shrink-0", quality.overall >= 80 ? "text-green-500" : quality.overall >= 60 ? "text-amber-500" : "text-red-500")}>
              {quality.overall}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <QualityMetricItem label="Resolution" value={quality.resolution.score} sublabel={`${quality.resolution.label} (${quality.resolution.width}x${quality.resolution.height})`} />
        <QualityMetricItem label="Blur" value={quality.blur.score} sublabel={quality.blur.label} />
        <QualityMetricItem label="Compression" value={quality.compression.score} sublabel={quality.compression.label} />
        <QualityMetricItem label="Brightness" value={quality.brightness.score} sublabel={quality.brightness.label} />
        <QualityMetricItem label="Contrast" value={quality.contrast.score} sublabel={quality.contrast.label} />
        <QualityMetricItem label="Text Visibility" value={quality.textVisibility.score} sublabel={quality.textVisibility.label} />
      </div>

      <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Expected OCR Accuracy</span>
          <span className={cn("text-sm font-bold", quality.expectedOCRAccuracy >= 80 ? "text-green-600" : quality.expectedOCRAccuracy >= 60 ? "text-amber-600" : "text-red-600")}>
            {quality.expectedOCRAccuracy}%
          </span>
        </div>
      </div>

      {quality.explanation && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>{quality.explanation}</p>
        </div>
      )}

      {quality.recommendations.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Recommendations</p>
          {quality.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
              <p>{rec}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QualityMetricItem({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  return (
    <div className="p-2 rounded bg-muted/30">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <div className={cn("w-2 h-2 rounded-full shrink-0", value >= 80 ? "bg-green-500" : value >= 60 ? "bg-amber-500" : "bg-red-500")} />
        <span className="text-xs font-medium">{sublabel}</span>
      </div>
    </div>
  );
}

// ─── AI Trade Advice Display ───

function TradeAdviceDisplay({ advice, symbol }: { advice: TradeAdvice; symbol?: string }) {
  return (
    <div className="space-y-3">
      {advice.riskReward !== null && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <BarChart3 className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Risk : Reward</p>
            <p className="text-lg font-bold font-mono">1 : {advice.riskReward.toFixed(1)}</p>
          </div>
          <Badge className={cn("ml-auto shrink-0", advice.riskReward >= 2 ? "bg-green-500" : advice.riskReward >= 1.5 ? "bg-blue-500" : advice.riskReward >= 1 ? "bg-amber-500" : "bg-red-500")}>
            {advice.riskReward >= 2 ? "Excellent" : advice.riskReward >= 1.5 ? "Good" : advice.riskReward >= 1 ? "Fair" : "Poor"}
          </Badge>
        </div>
      )}

      <div className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">AI Advice</p>
            <p className="text-sm text-purple-800 dark:text-purple-200 mt-0.5">{advice.summary}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {advice.points.map((point, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <ThumbsUp className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{point}</span>
          </div>
        ))}
      </div>

      <div className={cn("p-2.5 rounded-lg border",
        advice.riskAssessment.level === "low" ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20" :
        advice.riskAssessment.level === "medium" ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20" :
        "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
      )}>
        <p className="text-xs font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Risk Level: <span className="capitalize">{advice.riskAssessment.level}</span>
        </p>
        {advice.riskAssessment.slDistance !== null && (
          <p className="text-xs text-muted-foreground mt-1">SL Distance: ~{advice.riskAssessment.slDistance} pips</p>
        )}
      </div>

      {advice.journalInsights && (
        <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1 mb-1">
            <History className="h-3 w-3" />
            Journal Insight
          </p>
          <p className="text-sm text-indigo-800 dark:text-indigo-200">{advice.journalInsights.message}</p>
          {advice.journalInsights.symbolWinRate !== null && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">Win Rate: {advice.journalInsights.symbolWinRate}%</Badge>
              {advice.journalInsights.averageRR !== null && (
                <Badge variant="outline" className="text-xs">Avg R:R: {advice.journalInsights.averageRR.toFixed(1)}</Badge>
              )}
              {advice.journalInsights.mostProfitableSession && (
                <Badge variant="outline" className="text-xs">Best: {advice.journalInsights.mostProfitableSession}</Badge>
              )}
            </div>
          )}
          {advice.journalInsights.matchesSuccessfulBehavior && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <Check className="h-3 w-3" />
              This matches your successful trading behavior
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── History Panel ───

function HistoryPanel({ onSelectAnalysis, selectedId }: { onSelectAnalysis: (analysis: ScreenshotAnalysis) => void; selectedId: string | null }) {
  const history = useScreenshotHistory();

  if (history.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.groupedAnalyses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No analysis history yet</p>
        <p className="text-xs mt-1">Upload a screenshot to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold">{history.stats.totalAnalyses}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <p className="text-lg font-bold text-green-600">{history.stats.importedCount}</p>
          <p className="text-[10px] text-muted-foreground">Imported</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-amber-500/10">
          <p className="text-lg font-bold text-amber-600">{history.stats.pendingReviewCount}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {history.groupedAnalyses.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 px-1">{group.label}</p>
            <div className="space-y-1">
              {group.analyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => onSelectAnalysis(analysis)}
                  className={cn("w-full text-left p-2 rounded-lg transition-all text-xs",
                    selectedId === analysis.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {analysis.status === "imported" && <Check className="h-3 w-3 text-green-500 shrink-0" />}
                    {analysis.status === "needs_review" && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                    {analysis.status === "rejected" && <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
                    {analysis.status === "processing" && <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />}
                    <span className="font-medium truncate">{analysis.extractedTrade?.symbol || analysis.fileName}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{new Date(analysis.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {analysis.extractedTrade?.direction && (
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1", analysis.extractedTrade.direction === "buy" ? "text-green-600" : "text-red-600")}>
                        {analysis.extractedTrade.direction.toUpperCase()}
                      </Badge>
                    )}
                    {analysis.importStatus === "imported" && <Badge className="text-[10px] h-4 px-1 bg-green-500 text-white">Imported</Badge>}
                    {analysis.importStatus === "not_imported" && analysis.status === "confirmed" && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-600">Needs Review</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Field Status (Color-coded) ───

function FieldStatus({ field }: { field: { field: string; value: unknown; confidence: number; status: string; source: string } }) {
  const isDetected = field.status === "detected";
  const isMissing = field.status === "missing";
  const displayValue = field.value !== null && field.value !== "" && field.value !== undefined
    ? typeof field.value === "number" ? field.value.toFixed(field.value < 100 ? 5 : 2) : String(field.value)
    : null;

  return (
    <div className={cn("flex items-center gap-2 text-sm p-2 rounded-lg border",
      isDetected && "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20",
      isMissing && "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 opacity-60",
      !isDetected && !isMissing && "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
    )}>
      {isDetected ? <Check className="h-4 w-4 text-green-500 shrink-0" /> :
       isMissing ? <XCircle className="h-4 w-4 text-red-400 shrink-0" /> :
       <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
      <span className={cn("truncate", isDetected ? "text-foreground" : "text-muted-foreground")}>{field.field}</span>
      {displayValue && <Badge variant="outline" className="text-xs ml-auto font-mono shrink-0">{displayValue}</Badge>}
      {!displayValue && isMissing && <Badge variant="outline" className="text-xs ml-auto shrink-0 text-red-400">Missing</Badge>}
    </div>
  );
}

// ─── Main Component ───

export default function AIScreenshotAnalysis() {
  const { hasAccess } = useSubscription();
  const ocr = useOCR();
  const history = useScreenshotHistory();
  const trades = useTrades();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ScreenshotAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAccess = hasAccess("aiScreenshotAnalysis");

  // ─── Drag & Drop ───

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => addImage(file));
  }, []);

  const addImage = async (file: File) => {
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const preview = URL.createObjectURL(file);
    const newImage: UploadedImage = { id, file, preview, analysisId: null, status: "ready" };
    setImages((prev) => [newImage, ...prev]);
    toast.success(`${file.name} uploaded`);
    setTimeout(() => analyzeImage(id, file, preview), 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => addImage(file));
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
    if (selectedAnalysis?.screenshotDataUrl === images.find((i) => i.id === id)?.preview) setSelectedAnalysis(null);
    toast.info("Image removed");
  };

  // ─── Analysis Pipeline ───

  const analyzeImage = async (id: string, file: File, preview: string) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "processing" } : i)));
    const startTime = Date.now();

    try {
      let quality: ImageQualityMetrics | null = null;
      try { quality = await analyzeImageQuality(file); } catch { /* non-critical */ }

      const result = await ocr.run(file, { imageQuality: "high" });
      if (!result) throw new Error("OCR processing failed");

      const processingTimeMs = Date.now() - startTime;
      const extractedTrade = result.trades.length > 0 ? ocrResultToExtractedTrade(result) : null;

      let aiAdvice: TradeAdvice | null = null;
      if (extractedTrade) {
        try { aiAdvice = generateTradeAdvice(extractedTrade, trades.trades); } catch { /* non-critical */ }
      }

      const status: ScreenshotAnalysis["status"] = result.trades.length > 0 ? "needs_review" : "error";

      const saved = history.addAnalysis({
        screenshotDataUrl: preview, ocrText: result.rawText || "", ocrResult: result,
        extractedTrade, imageQuality: quality, aiAdvice,
        status, reviewStatus: "pending", importStatus: "not_imported",
        journalTradeId: null, processingTimeMs, fileName: file.name, fileSize: file.size,
        error: result.error || undefined,
      });

      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "completed", analysisId: saved.id } : i)));

      if (result.trades.length > 0) {
        const confLevel = result.confidenceLevel;
        if (confLevel === "low") toast.warning(`${result.trades.length} trade(s) detected. Please review before importing.`);
        else if (confLevel === "medium") toast.info(`${result.trades.length} trade(s) detected. Review recommended.`);
        else toast.success(`${result.trades.length} trade(s) detected with high confidence.`);
      } else if (result.rawText) {
        toast.info("Text detected but no trade data found. Try a clearer screenshot.");
      } else {
        toast.warning("No text detected in image.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "error" } : i)));
      history.addAnalysis({
        screenshotDataUrl: preview, ocrText: "", ocrResult: null, extractedTrade: null,
        imageQuality: null, aiAdvice: null, status: "error", reviewStatus: "pending",
        importStatus: "not_imported", journalTradeId: null, processingTimeMs: Date.now() - startTime,
        fileName: file.name, fileSize: file.size, error: message,
      });
      toast.error(message);
    }
  };

  const handleSelectAnalysis = useCallback((analysis: ScreenshotAnalysis) => {
    setSelectedAnalysis(analysis);
  }, []);

  const handleImportTrade = (analysis: ScreenshotAnalysis) => {
    if (!analysis.extractedTrade) { toast.error("No trade data to import"); return; }
    const trade = analysis.extractedTrade;
    const params = new URLSearchParams();
    if (trade.symbol) params.set("pair", trade.symbol);
    if (trade.direction && trade.direction !== "unknown") params.set("direction", trade.direction.toUpperCase());
    if (trade.entryPrice !== null) params.set("entryPrice", String(trade.entryPrice));
    if (trade.stopLoss !== null) params.set("stopLoss", String(trade.stopLoss));
    if (trade.takeProfit !== null) params.set("takeProfit", String(trade.takeProfit));
    if (trade.lotSize !== null) params.set("positionSize", String(trade.lotSize));
    if (analysis.id) params.set("analysisId", analysis.id);

    history.updateAnalysis(analysis.id, { status: "imported", importStatus: "imported" });
    window.location.hash = `#/trades/new?${params.toString()}`;
    toast.success("Opening Add Trade form with extracted data");
  };

  const handleDeleteAnalysis = (analysisId: string) => {
    history.deleteAnalysis(analysisId);
    if (selectedAnalysis?.id === analysisId) setSelectedAnalysis(null);
    toast.info("Analysis deleted");
  };

  const handleDuplicateAnalysis = (analysisId: string) => {
    const duplicated = history.duplicateAnalysis(analysisId);
    if (duplicated) toast.success("Analysis duplicated");
  };

  // ─── Render ───

  if (!canAccess) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-in fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Camera className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Screenshot Analysis
            </h1>
            <p className="mt-1 text-muted-foreground">Analyze trading screenshots with OCR</p>
          </div>
          <LockedFeature />
        </div>
      </AppLayout>
    );
  }

  const displayAnalysis = selectedAnalysis;

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Camera className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Screenshot Analysis
            </h1>
            <p className="mt-1 text-muted-foreground text-sm sm:text-base">
              Upload trading screenshots for AI-powered trade extraction
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-3.5 w-3.5" />
              {showHistory ? "Hide" : "History"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6">
            {/* Info Banner */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">Enhanced AI Trade Extraction</h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Upload a screenshot and our AI will extract trade details, analyze image quality,
                  provide trading advice, and save everything to your history.
                </p>
              </div>
            </div>

            {/* Drop Zone */}
            {!displayAnalysis && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn("relative cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-10 text-center transition-all duration-300",
                  isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                <div className={cn("mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all duration-300",
                  isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
                )}>
                  <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base">{isDragging ? "Drop images here" : "Drag & drop screenshots here"}</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">or click to browse · PNG, JPG, WEBP · MT4, MT5, TradingView</p>
              </div>
            )}

            {/* Selected Analysis View */}
            {displayAnalysis && (
              <div className="space-y-4">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setSelectedAnalysis(null)}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to Upload
                </Button>

                <Card className="overflow-hidden">
                  <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,400px)_1fr]">
                    {/* Image */}
                    <div className="relative group bg-muted">
                      <img src={displayAnalysis.screenshotDataUrl} alt="Screenshot" className="h-56 lg:h-full w-full object-cover cursor-pointer" onClick={() => setFullscreenImage(displayAnalysis.screenshotDataUrl)} />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => setFullscreenImage(displayAnalysis.screenshotDataUrl)}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Results */}
                    <CardContent className="p-4 space-y-4 min-w-0">
                      {/* Status Bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        {displayAnalysis.extractedTrade?.symbol && (
                          <Badge variant="outline" className="text-sm font-bold font-mono px-2 py-1">{displayAnalysis.extractedTrade.symbol}</Badge>
                        )}
                        {displayAnalysis.extractedTrade?.direction && (
                          <Badge className={cn("gap-1", displayAnalysis.extractedTrade.direction === "buy" ? "bg-green-500 text-white" : displayAnalysis.extractedTrade.direction === "sell" ? "bg-red-500 text-white" : "bg-gray-500")}>
                            {displayAnalysis.extractedTrade.direction === "buy" ? <TrendingUp className="h-3 w-3" /> : displayAnalysis.extractedTrade.direction === "sell" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            {displayAnalysis.extractedTrade.direction.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn(
                          displayAnalysis.status === "imported" && "border-green-500 text-green-700 bg-green-50",
                          displayAnalysis.status === "needs_review" && "border-amber-500 text-amber-700 bg-amber-50",
                          displayAnalysis.status === "error" && "border-red-500 text-red-700 bg-red-50",
                        )}>
                          {displayAnalysis.status === "imported" ? "Imported" : displayAnalysis.status === "needs_review" ? "Needs Review" : displayAnalysis.status === "error" ? "Error" : displayAnalysis.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{displayAnalysis.processingTimeMs}ms</span>
                      </div>

                      {/* Image Quality */}
                      {displayAnalysis.imageQuality && (
                        <div>
                          <button
                            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
                            onClick={() => setExpandedText(expandedText === "quality" ? null : "quality")}
                          >
                            <Gauge className="h-3 w-3" />
                            Image Quality
                            {expandedText === "quality" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                          {expandedText === "quality" && <ImageQualityDisplay quality={displayAnalysis.imageQuality} />}
                        </div>
                      )}

                      {/* Extracted Fields */}
                      {displayAnalysis.extractedTrade?.fieldConfidences && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                            <ScanText className="h-3 w-3" />
                            Extracted Fields
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {displayAnalysis.extractedTrade.fieldConfidences.map((field) => (
                              <FieldStatus key={field.field} field={field} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Trade Advice */}
                      {displayAnalysis.aiAdvice && (
                        <div>
                          <button
                            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
                            onClick={() => setExpandedText(expandedText === "advice" ? null : "advice")}
                          >
                            <Brain className="h-3 w-3" />
                            AI Trade Advice
                            {expandedText === "advice" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                          {expandedText === "advice" && (
                            <TradeAdviceDisplay advice={displayAnalysis.aiAdvice} symbol={displayAnalysis.extractedTrade?.symbol} />
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {displayAnalysis.status !== "imported" && displayAnalysis.extractedTrade && (
                          <Button size="sm" className="gap-1" onClick={() => handleImportTrade(displayAnalysis)}>
                            <Plus className="h-4 w-4" />
                            Import Trade
                          </Button>
                        )}
                        {displayAnalysis.status === "imported" && (
                          <Badge className="bg-green-500 text-white gap-1"><Check className="h-3 w-3" /> Imported</Badge>
                        )}
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDuplicateAnalysis(displayAnalysis.id)}>
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDeleteAnalysis(displayAnalysis.id)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>

                      {/* Raw OCR Text */}
                      {displayAnalysis.ocrText && (
                        <div>
                          <button
                            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setExpandedText(expandedText === "raw" ? null : "raw")}
                          >
                            <FileText className="h-3 w-3" />
                            Raw OCR Text
                            {expandedText === "raw" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                          {expandedText === "raw" && (
                            <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono break-words mt-2">
                              {displayAnalysis.ocrText}
                            </pre>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              </div>
            )}

            {/* Uploading Images */}
            {images.filter((i) => i.status === "processing").length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Processing</h2>
                {images.filter((i) => i.status === "processing").map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative h-16 w-16 rounded bg-muted overflow-hidden shrink-0">
                        <img src={image.preview} alt="" className="h-full w-full object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{image.file.name}</p>
                        <p className="text-xs text-muted-foreground">Analyzing image quality and running OCR...</p>
                        <Progress value={ocr.progress} className="h-1.5 mt-2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Error Images */}
            {images.filter((i) => i.status === "error").length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Errors</h2>
                {images.filter((i) => i.status === "error").map((image) => (
                  <Card key={image.id} className="overflow-hidden border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative h-16 w-16 rounded bg-muted overflow-hidden shrink-0">
                        <img src={image.preview} alt="" className="h-full w-full object-cover opacity-50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{image.file.name}</p>
                        <p className="text-xs text-red-500">Analysis failed. Try a clearer screenshot.</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeImage(image.id)}><X className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!displayAnalysis && images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <ScanText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Screenshots Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Upload a trading screenshot to extract trade data using our enhanced OCR pipeline.
                  Supports MT4, MT5, TradingView, and other platforms.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar: History */}
          {showHistory && (
            <div className="lg:border-l lg:pl-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <History className="h-4 w-4 text-primary" />
                    Analysis History
                  </CardTitle>
                  <CardDescription className="text-xs">Click an item to view full analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <HistoryPanel onSelectAnalysis={handleSelectAnalysis} selectedId={selectedAnalysis?.id || null} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Fullscreen Preview Modal */}
        {fullscreenImage && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setFullscreenImage(null)}>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-10" onClick={() => setFullscreenImage(null)}>
              <X className="h-6 w-6" />
            </Button>
            <img src={fullscreenImage} alt="Fullscreen preview" className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
