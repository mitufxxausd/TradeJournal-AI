/**
 * AI Screenshot Analysis Page
 * Real OCR using Tesseract.js for extracting text and trade data from screenshots.
 * Supports MT4, MT5, TradingView screenshots with confidence scores.
 * Shows detected text, prices, and order types only - no market structure guessing.
 */

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import { useOCR } from "@/hooks/use-ocr";
import type { OCRResult } from "@/services/ocr";
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
  Crosshair,
  Shield,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ImageIcon,
  AlertTriangle,
  FileText,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";

// ─── Types ───

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  ocrResult: OCRResult | null;
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

// ─── Main Component ───

export default function AIScreenshotAnalysis() {
  const { hasAccess } = useSubscription();
  const ocr = useOCR();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [expandedText, setExpandedText] = useState<string | null>(null);
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
    toast.info("Image removed");
  };

  const analyzeImage = async (id: string) => {
    const image = images.find((i) => i.id === id);
    if (!image) return;

    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "processing" } : i)));

    const result = await ocr.run(image.file, { imageQuality: "high" });

    if (result) {
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "completed", ocrResult: result } : i))
      );

      if (result.trades.length > 0) {
        const tradeCount = result.trades.length;
        toast.success(
          `OCR complete: ${tradeCount} trade${tradeCount > 1 ? "s" : ""} detected (${result.overallConfidence}% confidence)`
        );
      } else if (result.rawText) {
        toast.info(`Text detected (${result.overallConfidence}% confidence). No trade data found.`);
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

  const handleAutoFill = (tradeIndex: number, image: UploadedImage) => {
    if (!image.ocrResult?.trades[tradeIndex]) return;

    const trade = image.ocrResult.trades[tradeIndex];

    // Build query params for AddTrade page
    const params = new URLSearchParams();
    if (trade.symbol !== "Unknown") params.set("pair", trade.symbol);
    if (trade.direction !== "unknown") params.set("direction", trade.direction.toUpperCase());
    if (trade.entryPrice !== null) params.set("entryPrice", String(trade.entryPrice));
    if (trade.stopLoss !== null) params.set("stopLoss", String(trade.stopLoss));
    if (trade.takeProfit.length > 0) params.set("takeProfit", String(trade.takeProfit[0]));
    if (trade.positionSize !== null) params.set("positionSize", String(trade.positionSize));
    if (trade.riskReward !== null) params.set("rrRatio", String(trade.riskReward));

    // Navigate to add trade page with params
    window.location.hash = `#/trades/new?${params.toString()}`;
    toast.success("Opening Add Trade form with extracted data");
  };

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-7 w-7 text-primary" />
            Screenshot Analysis
          </h1>
          <p className="mt-1 text-muted-foreground">Analyze trading screenshots with OCR</p>
        </div>
        <LockedFeature />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-7 w-7 text-primary" />
            Screenshot Analysis
          </h1>
          <p className="mt-1 text-muted-foreground">
            Upload trading screenshots for OCR-powered text and trade extraction
          </p>
        </div>
        {images.some((i) => i.status === "ready") && (
          <Button onClick={analyzeAll} className="gap-2" disabled={ocr.isProcessing}>
            {ocr.isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze All
          </Button>
        )}
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
        <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">OCR-Powered Analysis</h4>
          <p className="text-sm text-muted-foreground mt-1">
            This tool extracts text from your screenshots using Tesseract.js OCR.
            It detects trading pairs, prices, and order types with confidence scores.
            No market structure is guessed - only detected text is shown.
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
          "relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-300",
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
          "mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300",
          isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
        )}>
          <Upload className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-semibold">
          {isDragging ? "Drop images here" : "Drag & drop screenshots here"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse · Supports PNG, JPG, WEBP · MT4, MT5, TradingView
        </p>
      </div>

      {/* Image Gallery + OCR Results */}
      {images.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
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
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="grid md:grid-cols-[300px_1fr]">
                  {/* Image Preview */}
                  <div className="relative group bg-muted">
                    <img
                      src={image.preview}
                      alt="Screenshot"
                      className="h-52 md:h-full w-full object-cover cursor-pointer"
                      onClick={() => setFullscreenImage(image.preview)}
                    />
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setFullscreenImage(image.preview)}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => removeImage(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Status badge */}
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
                  <CardContent className="p-5">
                    {!image.ocrResult && image.status !== "processing" && (
                      <div className="flex flex-col items-center justify-center h-full py-10 gap-4">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        <div className="text-center">
                          <p className="font-medium">Ready for OCR analysis</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Click analyze to extract text and trade data
                          </p>
                        </div>
                        <Button onClick={() => analyzeImage(image.id)} className="gap-2" disabled={ocr.isProcessing}>
                          <Sparkles className="h-4 w-4" />
                          Analyze Screenshot
                        </Button>
                      </div>
                    )}

                    {image.status === "processing" && (
                      <div className="flex flex-col items-center justify-center h-full py-10 gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-primary/20" />
                          <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium">OCR in Progress</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Extracting text from screenshot... {ocr.progress}%
                          </p>
                        </div>
                      </div>
                    )}

                    {image.ocrResult && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Overall Confidence */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              OCR Confidence: {image.ocrResult.overallConfidence}%
                            </Badge>
                            {image.ocrResult.trades.length > 0 && (
                              <Badge className="bg-primary text-white">
                                {image.ocrResult.trades.length} Trade{image.ocrResult.trades.length > 1 ? "s" : ""} Detected
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {image.ocrResult.processingTimeMs}ms
                          </span>
                        </div>

                        {/* Detected Prices */}
                        {image.ocrResult.detectedPrices.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              Detected Prices ({image.ocrResult.detectedPrices.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {image.ocrResult.detectedPrices.map((price, i) => (
                                <Badge key={i} variant="secondary" className="font-mono">
                                  {price.toFixed(price < 100 ? 5 : 2)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detected Order Types */}
                        {image.ocrResult.detectedOrderTypes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Detected Order Types
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {image.ocrResult.detectedOrderTypes.map((type, i) => (
                                <Badge key={i} variant="outline" className="capitalize">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Extracted Trades */}
                        {image.ocrResult.trades.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Extracted Trades
                            </h4>
                            {image.ocrResult.trades.map((trade, index) => (
                              <Card key={index} className="border-l-4 border-l-primary">
                                <CardContent className="p-4 space-y-3">
                                  {/* Trade Header */}
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-base px-3 py-1 font-bold font-mono">
                                        {trade.symbol}
                                      </Badge>
                                      {trade.direction !== "unknown" ? (
                                        <Badge className={cn(
                                          "gap-1",
                                          trade.direction === "buy"
                                            ? "bg-green-500 text-white"
                                            : "bg-red-500 text-white"
                                        )}>
                                          {trade.direction === "buy" ? (
                                            <TrendingUp className="h-3 w-3" />
                                          ) : (
                                            <TrendingDown className="h-3 w-3" />
                                          )}
                                          {trade.direction.toUpperCase()}
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary">
                                          <Minus className="h-3 w-3 mr-1" />
                                          Unknown
                                        </Badge>
                                      )}
                                      <Badge variant="outline">{trade.confidence}% confidence</Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => handleAutoFill(index, image)}
                                      disabled={trade.symbol === "Unknown" && trade.entryPrice === null}
                                    >
                                      <Plus className="h-3 w-3" />
                                      Auto Fill Trade
                                    </Button>
                                  </div>

                                  {/* Trade Details Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Crosshair className="h-3 w-3" /> Entry
                                      </p>
                                      <p className="font-mono text-sm font-semibold">
                                        {trade.entryPrice !== null
                                          ? trade.entryPrice.toFixed(trade.entryPrice < 100 ? 5 : 2)
                                          : "Unknown"}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Shield className="h-3 w-3" /> Stop Loss
                                      </p>
                                      <p className="font-mono text-sm font-semibold text-red-500">
                                        {trade.stopLoss !== null
                                          ? trade.stopLoss.toFixed(trade.stopLoss < 100 ? 5 : 2)
                                          : "Unknown"}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Target className="h-3 w-3" /> Take Profit
                                      </p>
                                      <p className="font-mono text-sm font-semibold text-green-500">
                                        {trade.takeProfit.length > 0
                                          ? trade.takeProfit.map((tp) => tp.toFixed(tp < 100 ? 5 : 2)).join(", ")
                                          : "Unknown"}
                                      </p>
                                    </div>
                                    {trade.positionSize !== null && (
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Position Size</p>
                                        <p className="font-mono text-sm font-semibold">{trade.positionSize}</p>
                                      </div>
                                    )}
                                    {trade.riskReward !== null && (
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">R:R Ratio</p>
                                        <p className="font-mono text-sm font-semibold text-primary">
                                          {trade.riskReward}:1
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}

                        {/* Raw Text (collapsible) */}
                        {image.ocrResult.rawText && (
                          <div className="space-y-2">
                            <button
                              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setExpandedText(expandedText === image.id ? null : image.id)}
                            >
                              <FileText className="h-3 w-3" />
                              Detected Raw Text
                              {expandedText === image.id ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            {expandedText === image.id && (
                              <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono">
                                {image.ocrResult.rawText}
                              </pre>
                            )}
                          </div>
                        )}

                        {/* No trades detected message */}
                        {image.ocrResult.rawText && image.ocrResult.trades.length === 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span>
                              Text was detected but no trade data could be extracted.
                              Try a clearer screenshot with visible price levels.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            ))}
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
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={fullscreenImage}
            alt="Fullscreen preview"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
