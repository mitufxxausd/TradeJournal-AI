/**
 * AI Screenshot Analysis Page
 * Phase 6C: AI Vision Architecture + Intelligent Chart Understanding
 *
 * Workflow:
 *   Upload Screenshot → OCR Text Extraction → Trade Fusion Engine →
 *   Review (with sections) → User Confirmation → Import
 *
 * Architecture:
 *   Screenshot → OCR (Tesseract) → Parser → TradeFusionEngine → Review
 *                                          ↑
 *                              Future: AI Vision Provider
 *
 * Key Rules:
 * - OCR only reads text, never understands charts
 * - TP never comes from chart axis numbers
 * - Symbol uses SymbolDetector with fuzzy matching
 * - Every field is editable
 * - No fake AI analysis
 * - Quality metrics are measurable
 * - Mobile-first responsive design
 */

import { useState, useRef, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubscription } from "@/hooks/use-subscription";
import { useOCR } from "@/hooks/use-ocr";
import type { OCRResult, OCRQualityMetrics, OCRTrade } from "@/services/ocr";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Camera,
  Upload,
  X,
  Maximize2,
  Trash2,
  Loader2,
  Lock,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  XCircle,
  Plus,
  ScanText,
  BarChart3,
  Info,
  Monitor,
  Brain,
} from "lucide-react";

// ─── Types ───

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  ocrResult: OCRResult | null;
  status: "ready" | "processing" | "completed" | "error";
}

interface ReviewTrade {
  id: string;
  symbol: string;
  direction: "buy" | "sell" | "" | "unknown";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSize: number | null;
  confidence: number;
  confidenceLevel: "high" | "medium" | "low";
  qualityMetrics: OCRQualityMetrics | null;
  confirmed: boolean;
  discarded: boolean;
  editing: boolean;
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

// ─── AI Vision Status Card ───

function VisionStatusCard() {
  const visionProviders = [
    { name: "OpenAI Vision", id: "openai", status: "not_configured" as const },
    { name: "Gemini Vision", id: "gemini", status: "not_configured" as const },
    { name: "Claude Vision", id: "claude", status: "not_configured" as const },
    { name: "OpenRouter Vision", id: "openrouter", status: "not_configured" as const },
  ];

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4 text-purple-500" />
          AI Vision Status
        </CardTitle>
        <CardDescription className="text-xs">
          Current and future AI Vision providers for chart understanding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Provider */}
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <ScanText className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Current Provider</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">OCR Only (Tesseract)</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] shrink-0">
            Active
          </Badge>
        </div>

        {/* Future Providers */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Future Providers (Not Configured)
          </p>
          {visionProviders.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground"
            >
              <Monitor className="h-3 w-3 shrink-0" />
              <span className="truncate">{provider.name}</span>
              <Badge variant="outline" className="ml-auto text-[10px] shrink-0 opacity-50">
                Future
              </Badge>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            <strong>OCR reads text only</strong> — it cannot understand charts, trends, patterns, or visuals.
            <strong> AI Vision</strong> will understand charts, support/resistance, patterns, and visual context.
            Configure a Vision provider above to enable advanced chart analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quality Metrics Display ───

function QualityMetricsDisplay({ metrics }: { metrics: OCRQualityMetrics }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">OCR Quality</p>
        <p className={cn(
          "text-lg sm:text-2xl font-bold",
          metrics.ocrQuality >= 80 ? "text-green-500" :
          metrics.ocrQuality >= 60 ? "text-amber-500" : "text-red-500"
        )}>
          {metrics.ocrQuality}%
        </p>
      </div>
      <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Parser Confidence</p>
        <p className={cn(
          "text-lg sm:text-2xl font-bold",
          metrics.parserConfidence >= 80 ? "text-green-500" :
          metrics.parserConfidence >= 60 ? "text-amber-500" : "text-red-500"
        )}>
          {metrics.parserConfidence}%
        </p>
      </div>
      <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Completeness</p>
        <p className={cn(
          "text-lg sm:text-2xl font-bold",
          metrics.tradeCompleteness >= 80 ? "text-green-500" :
          metrics.tradeCompleteness >= 60 ? "text-amber-500" : "text-red-500"
        )}>
          {metrics.tradeCompleteness}%
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
          {metrics.fieldsDetected}/{metrics.totalFields} fields
        </p>
      </div>
    </div>
  );
}

// ─── Field Detection Status ───

function FieldStatus({ detected, label, value }: { detected: boolean; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center gap-2 text-sm min-w-0">
      {detected ? (
        <Check className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      )}
      <span className={cn(detected ? "text-foreground" : "text-muted-foreground", "truncate")}>
        {label}
      </span>
      {detected && value !== undefined && value !== null && value !== "" && (
        <Badge variant="outline" className="text-xs ml-auto font-mono shrink-0">
          {typeof value === "number" ? value.toFixed(value < 100 ? 5 : 2) : value}
        </Badge>
      )}
    </div>
  );
}

// ─── Trade Review Card (Enhanced with Sections) ───

function TradeReviewCard({
  trade,
  onUpdate,
  onConfirm,
  onDiscard,
  onToggleEdit,
  onImport,
}: {
  trade: ReviewTrade;
  onUpdate: (updated: ReviewTrade) => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onToggleEdit: () => void;
  onImport: () => void;
}) {
  const isConfirmed = trade.confirmed;
  const isDiscarded = trade.discarded;
  const isEditing = trade.editing;

  const detectedFields = [
    { key: "symbol" as const, label: "Symbol", detected: trade.symbol !== "" && trade.symbol !== "Symbol not detected", value: trade.symbol },
    { key: "direction" as const, label: "Direction", detected: trade.direction !== "" && trade.direction !== "unknown", value: trade.direction },
    { key: "entryPrice" as const, label: "Entry Price", detected: trade.entryPrice !== null, value: trade.entryPrice },
    { key: "stopLoss" as const, label: "Stop Loss", detected: trade.stopLoss !== null, value: trade.stopLoss },
    { key: "takeProfit" as const, label: "Take Profit", detected: trade.takeProfit !== null, value: trade.takeProfit },
    { key: "positionSize" as const, label: "Position Size", detected: trade.positionSize !== null, value: trade.positionSize },
  ];

  const successfulFields = detectedFields.filter((f) => f.detected);
  const missingFields = detectedFields.filter((f) => !f.detected);

  return (
    <Card className={cn(
      "border-l-4 transition-all",
      isConfirmed ? "border-l-green-500" : isDiscarded ? "border-l-red-500 opacity-60" : "border-l-primary"
    )}>
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Trade Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-sm px-2 py-1 font-bold font-mono">
              {trade.symbol || "Symbol not detected"}
            </Badge>
            {trade.direction && trade.direction !== "unknown" ? (
              <Badge className={cn(
                "gap-1",
                trade.direction === "buy" ? "bg-green-500 text-white" : "bg-red-500 text-white"
              )}>
                {trade.direction === "buy" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trade.direction.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Minus className="h-3 w-3 mr-1" />
                Direction not detected
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                trade.confidenceLevel === "high" && "border-green-500 text-green-700 bg-green-50 dark:bg-green-950/30",
                trade.confidenceLevel === "medium" && "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30",
                trade.confidenceLevel === "low" && "border-red-500 text-red-700 bg-red-50 dark:bg-red-950/30",
              )}
            >
              {trade.confidence}% confidence
            </Badge>
            {isConfirmed && (
              <Badge className="bg-green-500 text-white gap-1">
                <Check className="h-3 w-3" />
                Confirmed
              </Badge>
            )}
            {isDiscarded && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Discarded
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          {!isConfirmed && !isDiscarded && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={onToggleEdit}
              >
                <Pencil className="h-3 w-3" />
                {isEditing ? "Done" : "Edit"}
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1 bg-green-500 hover:bg-green-600 text-white text-xs"
                onClick={onConfirm}
              >
                <Check className="h-3 w-3" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs"
                onClick={onDiscard}
              >
                <X className="h-3 w-3" />
                Discard
              </Button>
            </div>
          )}

          {isConfirmed && (
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={onImport}
            >
              <Plus className="h-3 w-3" />
              Import Trade
            </Button>
          )}
        </div>

        {/* Quality Metrics */}
        {trade.qualityMetrics && !isDiscarded && (
          <QualityMetricsDisplay metrics={trade.qualityMetrics} />
        )}

        {/* Sections: Detected Successfully */}
        {!isEditing && !isDiscarded && successfulFields.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Detected Successfully ({successfulFields.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {successfulFields.map((field) => (
                <FieldStatus
                  key={field.key}
                  detected={true}
                  label={field.label}
                  value={field.value}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sections: Missing Information */}
        {!isEditing && !isDiscarded && missingFields.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Missing Information ({missingFields.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {missingFields.map((field) => (
                <FieldStatus
                  key={field.key}
                  detected={false}
                  label={field.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sections: Needs Review */}
        {!isEditing && !isDiscarded && trade.confidenceLevel !== "high" && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1 mb-1">
              <Eye className="h-3 w-3" />
              Needs Review
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {trade.confidenceLevel === "low"
                ? "Low confidence detection. Please verify all fields before importing. Consider taking a clearer screenshot with visible trade labels."
                : "Medium confidence. Some fields were detected but may need verification. Please review before importing."}
            </p>
          </div>
        )}

        {/* Sections: Warnings */}
        {!isEditing && !isDiscarded && !trade.symbol && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-red-700 dark:text-red-300 flex items-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3" />
              Warnings
            </p>
            <p className="text-xs text-red-800 dark:text-red-200">
              Symbol not detected. Please enter the trading pair manually in the edit form.
            </p>
          </div>
        )}

        {/* Trade Editor */}
        {isEditing && !isConfirmed && !isDiscarded && (
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg animate-in fade-in">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Pencil className="h-3 w-3" />
              Edit Trade Fields
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Symbol</Label>
                <Input
                  value={trade.symbol === "Symbol not detected" ? "" : trade.symbol}
                  onChange={(e) => onUpdate({ ...trade, symbol: e.target.value.toUpperCase() })}
                  className="h-9 text-sm font-mono"
                  placeholder="e.g. XAUUSD"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Direction</Label>
                <select
                  value={trade.direction}
                  onChange={(e) => onUpdate({ ...trade, direction: e.target.value as "buy" | "sell" | "" | "unknown" })}
                  className="h-9 text-sm w-full rounded-md border border-input bg-background px-3"
                >
                  <option value="">Not detected</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Entry Price</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={trade.entryPrice ?? ""}
                  onChange={(e) => onUpdate({ ...trade, entryPrice: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-9 text-sm font-mono"
                  placeholder="0.00000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stop Loss</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={trade.stopLoss ?? ""}
                  onChange={(e) => onUpdate({ ...trade, stopLoss: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-9 text-sm font-mono"
                  placeholder="0.00000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Take Profit</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={trade.takeProfit ?? ""}
                  onChange={(e) => onUpdate({ ...trade, takeProfit: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-9 text-sm font-mono"
                  placeholder="0.00000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Position Size (Lots)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={trade.positionSize ?? ""}
                  onChange={(e) => onUpdate({ ...trade, positionSize: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-9 text-sm font-mono"
                  placeholder="0.10"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Empty States ───

function EmptyUploadState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <ScanText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No Screenshot Uploaded</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Upload a trading screenshot to extract trade data using OCR.
        Supports MT4, MT5, TradingView, and other platforms.
      </p>
    </div>
  );
}

function EmptyAnalysisState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
        <BarChart3 className="h-6 w-6 text-primary" />
      </div>
      <h4 className="font-medium">Ready for OCR Analysis</h4>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Click Analyze to extract text and detect trade information from this screenshot.
      </p>
      <Button onClick={onAnalyze} className="mt-4 gap-2">
        <Sparkles className="h-4 w-4" />
        Analyze Screenshot
      </Button>
    </div>
  );
}

function NoTradesDetectedState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <h4 className="font-medium">No Trade Data Detected</h4>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Text was detected but no trade information could be extracted.
        Try a clearer screenshot with visible order details.
      </p>
    </div>
  );
}

// ─── Main Component ───

export default function AIScreenshotAnalysis() {
  const { hasAccess } = useSubscription();
  const ocr = useOCR();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const [reviewTrades, setReviewTrades] = useState<Record<string, ReviewTrade[]>>({});
  const [showVisionStatus, setShowVisionStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAccess = hasAccess("aiScreenshotAnalysis");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => addImage(file));
  }, []);

  const addImage = (file: File) => {
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const preview = URL.createObjectURL(file);

    const newImage: UploadedImage = {
      id,
      file,
      preview,
      ocrResult: null,
      status: "ready",
    };

    setImages((prev) => [newImage, ...prev]);
    toast.success(`${file.name} uploaded`);
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
    setReviewTrades((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.info("Image removed");
  };

  const convertOCRTradeToReview = (trade: OCRTrade, index: number, imageId: string, ocrResult: OCRResult): ReviewTrade => ({
    id: `${imageId}_trade_${index}`,
    symbol: trade.symbol || "",
    direction: trade.direction === "unknown" ? "" : trade.direction,
    entryPrice: trade.entryPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    positionSize: trade.positionSize,
    confidence: trade.confidence,
    confidenceLevel: ocrResult.confidenceLevel,
    qualityMetrics: ocrResult.qualityMetrics || null,
    confirmed: false,
    discarded: false,
    editing: false,
  });

  const analyzeImage = async (id: string) => {
    const image = images.find((i) => i.id === id);
    if (!image) return;

    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "processing" } : i)));

    const result = await ocr.run(image.file, { imageQuality: "high" });

    if (result) {
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "completed", ocrResult: result } : i))
      );

      // Initialize review trades from OCR result
      if (result.trades.length > 0) {
        const initialTrades: ReviewTrade[] = result.trades.map((trade, idx) =>
          convertOCRTradeToReview(trade, idx, image.id, result)
        );
        setReviewTrades((prev) => ({ ...prev, [image.id]: initialTrades }));

        const tradeCount = result.trades.length;
        const confLevel = result.confidenceLevel;

        if (confLevel === "low") {
          toast.warning(`${tradeCount} trade(s) detected. Please review before importing.`);
        } else if (confLevel === "medium") {
          toast.info(`${tradeCount} trade(s) detected. Review recommended before importing.`);
        } else {
          toast.success(`${tradeCount} trade(s) detected. Review and confirm to import.`);
        }
      } else if (result.rawText) {
        toast.info("Text detected but no trade data found. Try a clearer screenshot.");
      } else {
        toast.warning("No text detected in image");
      }
    } else {
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "error" } : i)));
      toast.error("OCR processing failed");
    }
  };

  const analyzeAll = async () => {
    const readyImages = images.filter((i) => i.status === "ready");
    for (const img of readyImages) {
      await analyzeImage(img.id);
    }
  };

  const handleConfirmTrade = (imageId: string, tradeId: string) => {
    setReviewTrades((prev) => ({
      ...prev,
      [imageId]: prev[imageId]?.map((t) =>
        t.id === tradeId ? { ...t, confirmed: true, discarded: false, editing: false } : t
      ) || [],
    }));
    toast.success("Trade confirmed. Ready to import.");
  };

  const handleDiscardTrade = (imageId: string, tradeId: string) => {
    setReviewTrades((prev) => ({
      ...prev,
      [imageId]: prev[imageId]?.map((t) =>
        t.id === tradeId ? { ...t, discarded: true, confirmed: false, editing: false } : t
      ) || [],
    }));
    toast.info("Trade discarded");
  };

  const handleToggleEdit = (imageId: string, tradeId: string) => {
    setReviewTrades((prev) => ({
      ...prev,
      [imageId]: prev[imageId]?.map((t) =>
        t.id === tradeId ? { ...t, editing: !t.editing } : t
      ) || [],
    }));
  };

  const handleUpdateTrade = (imageId: string, updatedTrade: ReviewTrade) => {
    setReviewTrades((prev) => ({
      ...prev,
      [imageId]: prev[imageId]?.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)) || [],
    }));
  };

  const handleImportTrade = (imageId: string, tradeId: string) => {
    const trade = reviewTrades[imageId]?.find((t) => t.id === tradeId);
    if (!trade) {
      toast.error("Trade not found");
      return;
    }

    // Build import params
    const params = new URLSearchParams();
    if (trade.symbol) params.set("pair", trade.symbol);
    if (trade.direction && trade.direction !== "unknown") params.set("direction", trade.direction.toUpperCase());
    if (trade.entryPrice !== null) params.set("entryPrice", String(trade.entryPrice));
    if (trade.stopLoss !== null) params.set("stopLoss", String(trade.stopLoss));
    if (trade.takeProfit !== null) params.set("takeProfit", String(trade.takeProfit));
    if (trade.positionSize !== null) params.set("positionSize", String(trade.positionSize));

    window.location.hash = `#/trades/new?${params.toString()}`;
    toast.success("Opening Add Trade form with confirmed data");
  };

  const handleImportAllConfirmed = (imageId: string) => {
    const trades = reviewTrades[imageId]?.filter((t) => t.confirmed && !t.discarded) || [];
    if (trades.length === 0) {
      toast.warning("No confirmed trades to import");
      return;
    }
    // Import the first confirmed trade
    handleImportTrade(imageId, trades[0].id);
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
              Upload trading screenshots for OCR-powered trade extraction
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setShowVisionStatus(!showVisionStatus)}
            >
              <Brain className="h-3.5 w-3.5" />
              {showVisionStatus ? "Hide" : "AI Vision"}
            </Button>
            {images.some((i) => i.status === "ready") && (
              <Button
                onClick={analyzeAll}
                className="gap-2"
                size="sm"
                disabled={ocr.isProcessing}
              >
                {ocr.isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze All
              </Button>
            )}
          </div>
        </div>

        {/* AI Vision Status Panel */}
        {showVisionStatus && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <VisionStatusCard />
          </div>
        )}

        {/* Info Banner */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4 flex items-start gap-3">
          <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">OCR-Powered Analysis</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Extracts text from screenshots using Tesseract.js. Detects symbol, direction, entry,
              stop loss, take profit, and lot size. Price scales, indicator values, and watermarks are ignored.
              All extracted values must be reviewed before importing.
            </p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-10 text-center transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className={cn(
            "mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all duration-300",
            isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
          )}>
            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h3 className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base">
            {isDragging ? "Drop images here" : "Drag & drop screenshots here"}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            or click to browse · PNG, JPG, WEBP · MT4, MT5, TradingView
          </p>
        </div>

        {/* Empty State when no images */}
        {images.length === 0 && <EmptyUploadState />}

        {/* Image Gallery + OCR Results */}
        {images.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-semibold">
                Images ({images.length})
              </h2>
              {ocr.isProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  OCR Processing... {ocr.progress}%
                </div>
              )}
            </div>

            {ocr.isProcessing && (
              <Progress value={ocr.progress} className="h-2" />
            )}

            <div className="space-y-4">
              {images.map((image) => {
                const trades = reviewTrades[image.id] || [];
                const confirmedCount = trades.filter((t) => t.confirmed && !t.discarded).length;

                return (
                  <Card key={image.id} className="overflow-hidden transition-all hover:shadow-md">
                    {/* Mobile: stacked layout, Desktop: side by side */}
                    <div className="flex flex-col md:grid md:grid-cols-[minmax(0,280px)_1fr]">
                      {/* Image Preview */}
                      <div className="relative group bg-muted">
                        <img
                          src={image.preview}
                          alt="Screenshot"
                          className="h-48 sm:h-52 md:h-full w-full object-cover cursor-pointer"
                          onClick={() => setFullscreenImage(image.preview)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9"
                            onClick={(e) => { e.stopPropagation(); setFullscreenImage(image.preview); }}
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-9 w-9"
                            onClick={(e) => { e.stopPropagation(); removeImage(image.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 left-2">
                          {image.status === "processing" && (
                            <Badge variant="secondary" className="gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              OCR Processing
                            </Badge>
                          )}
                          {image.status === "completed" && (
                            <Badge className="bg-green-500 text-white gap-1">
                              <Sparkles className="h-3 w-3" />
                              Analyzed
                            </Badge>
                          )}
                          {image.status === "error" && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Error
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* OCR Results Panel */}
                      <CardContent className="p-3 sm:p-5 min-w-0">
                        {/* Ready for analysis state */}
                        {!image.ocrResult && image.status !== "processing" && (
                          <EmptyAnalysisState onAnalyze={() => analyzeImage(image.id)} />
                        )}

                        {/* Processing state */}
                        {image.status === "processing" && (
                          <div className="flex flex-col items-center justify-center h-full py-10 gap-4">
                            <div className="relative">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-4 border-primary/20" />
                              <Loader2 className="absolute inset-0 h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-sm sm:text-base">OCR in Progress</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Extracting text from screenshot... {ocr.progress}%
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Analysis Results */}
                        {image.ocrResult && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 min-w-0">
                            {/* Warning Banner */}
                            {image.ocrResult.warning && (
                              <div className={cn(
                                "rounded-lg border p-3 text-sm flex items-start gap-2",
                                image.ocrResult.confidenceLevel === "low"
                                  ? "border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
                                  : "border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                              )}>
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span className="break-words">{image.ocrResult.warning}</span>
                              </div>
                            )}

                            {/* Summary Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={cn(
                                "text-xs sm:text-sm",
                                image.ocrResult.confidenceLevel === "high" && "border-green-500 text-green-700 bg-green-50 dark:bg-green-950/30",
                                image.ocrResult.confidenceLevel === "medium" && "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30",
                                image.ocrResult.confidenceLevel === "low" && "border-red-500 text-red-700 bg-red-50 dark:bg-red-950/30",
                              )}>
                                OCR: {image.ocrResult.overallConfidence}%
                              </Badge>
                              {trades.length > 0 && (
                                <Badge className="bg-primary text-white text-xs sm:text-sm">
                                  {trades.length} Trade{trades.length > 1 ? "s" : ""} Detected
                                </Badge>
                              )}
                              {confirmedCount > 0 && (
                                <Badge className="bg-green-500 text-white gap-1 text-xs sm:text-sm">
                                  <Check className="h-3 w-3" />
                                  {confirmedCount} Confirmed
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {image.ocrResult.processingTimeMs}ms
                              </span>
                            </div>

                            {/* Trade Review Cards */}
                            {trades.length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                  <ScanText className="h-3 w-3" />
                                  Review Extracted Trades
                                </h4>
                                {trades.map((trade) => (
                                  <TradeReviewCard
                                    key={trade.id}
                                    trade={trade}
                                    onUpdate={(updated) => handleUpdateTrade(image.id, updated)}
                                    onConfirm={() => handleConfirmTrade(image.id, trade.id)}
                                    onDiscard={() => handleDiscardTrade(image.id, trade.id)}
                                    onToggleEdit={() => handleToggleEdit(image.id, trade.id)}
                                    onImport={() => handleImportTrade(image.id, trade.id)}
                                  />
                                ))}

                                {/* Import All Button */}
                                {confirmedCount > 0 && (
                                  <Button
                                    onClick={() => handleImportAllConfirmed(image.id)}
                                    className="w-full gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Import First Confirmed Trade
                                  </Button>
                                )}
                              </div>
                            ) : (
                              /* No trades detected */
                              image.ocrResult.rawText ? (
                                <NoTradesDetectedState />
                              ) : null
                            )}

                            {/* Raw Text (collapsible) */}
                            {image.ocrResult.rawText && (
                              <div className="space-y-2">
                                <button
                                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() => setExpandedText(expandedText === image.id ? null : image.id)}
                                >
                                  <FileText className="h-3 w-3" />
                                  Raw OCR Text
                                  {expandedText === image.id ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                                {expandedText === image.id && (
                                  <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono break-words">
                                    {image.ocrResult.rawText}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Fullscreen Preview Modal */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setFullscreenImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={fullscreenImage}
              alt="Fullscreen preview"
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
