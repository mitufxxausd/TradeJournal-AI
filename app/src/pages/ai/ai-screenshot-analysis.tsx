/**
 * AI Screenshot Analysis Page
 * Real OCR using Tesseract.js for extracting trade data from screenshots.
 * Extracts only: Symbol, Direction, Entry, SL, TP, Lot Size, Profit, Timeframe.
 * Groups OCR into separate trades with Confirm/Edit/Discard flow.
 * Ignores: Price scale, Indicator values, Candle prices, Watermark text.
 */

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Eye,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  XCircle,
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

interface ConfirmedTrade {
  id: string;
  symbol: string;
  direction: "buy" | "sell" | "unknown";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number[];
  positionSize: number | null;
  confidence: number;
  confirmed: boolean;
  discarded: boolean;
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

// ─── Trade Editor ───

function TradeEditor({
  trade,
  onUpdate,
}: {
  trade: ConfirmedTrade;
  onUpdate: (trade: ConfirmedTrade) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Symbol</Label>
          <Input
            value={trade.symbol}
            onChange={(e) => onUpdate({ ...trade, symbol: e.target.value.toUpperCase() })}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Direction</Label>
          <select
            value={trade.direction}
            onChange={(e) => onUpdate({ ...trade, direction: e.target.value as "buy" | "sell" | "unknown" })}
            className="h-8 text-sm w-full rounded-md border border-input bg-background px-3"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Entry Price</Label>
          <Input
            type="number"
            step="0.00001"
            value={trade.entryPrice ?? ""}
            onChange={(e) => onUpdate({ ...trade, entryPrice: e.target.value ? parseFloat(e.target.value) : null })}
            className="h-8 text-sm font-mono"
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
            className="h-8 text-sm font-mono"
            placeholder="0.00000"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Take Profit (comma-separated)</Label>
          <Input
            value={trade.takeProfit.join(", ")}
            onChange={(e) =>
              onUpdate({
                ...trade,
                takeProfit: e.target.value.split(",").map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v)),
              })
            }
            className="h-8 text-sm font-mono"
            placeholder="1.23456, 1.24500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Position Size (Lots)</Label>
          <Input
            type="number"
            step="0.01"
            value={trade.positionSize ?? ""}
            onChange={(e) => onUpdate({ ...trade, positionSize: e.target.value ? parseFloat(e.target.value) : null })}
            className="h-8 text-sm font-mono"
            placeholder="0.10"
          />
        </div>
      </div>
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
  const [confirmedTrades, setConfirmedTrades] = useState<Record<string, ConfirmedTrade[]>>({});
  const [editingTrade, setEditingTrade] = useState<string | null>(null);
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
    setConfirmedTrades((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
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

      // Initialize confirmed trades from OCR result
      if (result.trades.length > 0) {
        const initialTrades: ConfirmedTrade[] = result.trades.map((trade, idx) => ({
          id: `${id}_trade_${idx}`,
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          positionSize: trade.positionSize,
          confidence: trade.confidence,
          confirmed: false,
          discarded: false,
        }));
        setConfirmedTrades((prev) => ({ ...prev, [id]: initialTrades }));

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

  const handleConfirmTrade = (imageId: string, tradeId: string) => {
    setConfirmedTrades((prev) => ({
      ...prev,
      [imageId]: prev[imageId]?.map((t) => (t.id === tradeId ? { ...t, confirmed: true, discarded: false } : t)) || [],
    }));
    toast.success("Trade confirmed");
  };

  const handleDiscardTrade = (imageId: string, tradeId: string) => {
    setConfirmedTrades((prev) => ({
      ...prev,
      [imageId]: prev[imageId]?.map((t) => (t.id === tradeId ? { ...t, discarded: true, confirmed: false } : t)) || [],
    }));
    toast.info("Trade discarded");
  };

  const handleEditTrade = (tradeId: string) => {
    setEditingTrade((prev) => (prev === tradeId ? null : tradeId));
  };

  const handleUpdateTrade = (imageId: string, updatedTrade: ConfirmedTrade) => {
    setConfirmedTrades((prev) => ({
      ...prev,
      [imageId]: prev[imageId]?.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)) || [],
    }));
  };

  const handleAutoFill = (imageId: string, tradeId: string) => {
    const trade = confirmedTrades[imageId]?.find((t) => t.id === tradeId);
    if (!trade || trade.symbol === "Unknown" && trade.entryPrice === null) {
      toast.warning("No valid trade data to fill");
      return;
    }

    const params = new URLSearchParams();
    if (trade.symbol !== "Unknown") params.set("pair", trade.symbol);
    if (trade.direction !== "unknown") params.set("direction", trade.direction.toUpperCase());
    if (trade.entryPrice !== null) params.set("entryPrice", String(trade.entryPrice));
    if (trade.stopLoss !== null) params.set("stopLoss", String(trade.stopLoss));
    if (trade.takeProfit.length > 0) params.set("takeProfit", String(trade.takeProfit[0]));
    if (trade.positionSize !== null) params.set("positionSize", String(trade.positionSize));

    window.location.hash = `#/trades/new?${params.toString()}`;
    toast.success("Opening Add Trade form with extracted data");
  };

  const handleAutoFillAllConfirmed = (imageId: string) => {
    const trades = confirmedTrades[imageId]?.filter((t) => t.confirmed && !t.discarded) || [];
    if (trades.length === 0) {
      toast.warning("No confirmed trades to fill");
      return;
    }
    // For now, fill the first confirmed trade
    handleAutoFill(imageId, trades[0].id);
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
            Upload trading screenshots for OCR-powered trade extraction
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
            It detects symbol, direction, entry, stop loss, take profit, and lot size.
            Price scales, indicator values, and watermarks are ignored.
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
            {images.map((image) => {
              const trades = confirmedTrades[image.id] || [];
              const confirmedCount = trades.filter((t) => t.confirmed && !t.discarded).length;

              return (
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
                              Click analyze to extract trade data
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
                          {/* OCR Confidence */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-sm">
                                OCR Confidence: {image.ocrResult.overallConfidence}%
                              </Badge>
                              {trades.length > 0 && (
                                <Badge className="bg-primary text-white">
                                  {trades.length} Trade{trades.length > 1 ? "s" : ""} Detected
                                </Badge>
                              )}
                              {confirmedCount > 0 && (
                                <Badge className="bg-green-500 text-white gap-1">
                                  <Check className="h-3 w-3" />
                                  {confirmedCount} Confirmed
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {image.ocrResult.processingTimeMs}ms
                            </span>
                          </div>

                          {/* Extracted Trades */}
                          {trades.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Detected Trades
                              </h4>
                              {trades.map((trade) => {
                                const isEditing = editingTrade === trade.id;
                                const isConfirmed = trade.confirmed;
                                const isDiscarded = trade.discarded;

                                return (
                                  <Card
                                    key={trade.id}
                                    className={cn(
                                      "border-l-4 transition-all",
                                      isConfirmed ? "border-l-green-500" : isDiscarded ? "border-l-red-500 opacity-60" : "border-l-primary"
                                    )}
                                  >
                                    <CardContent className="p-4 space-y-3">
                                      {/* Trade Header */}
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
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
                                              className="h-8 gap-1"
                                              onClick={() => handleEditTrade(trade.id)}
                                            >
                                              <Pencil className="h-3 w-3" />
                                              {isEditing ? "Done" : "Edit"}
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="h-8 gap-1 bg-green-500 hover:bg-green-600 text-white"
                                              onClick={() => handleConfirmTrade(image.id, trade.id)}
                                            >
                                              <Check className="h-3 w-3" />
                                              Confirm
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                              onClick={() => handleDiscardTrade(image.id, trade.id)}
                                            >
                                              <X className="h-3 w-3" />
                                              Discard
                                            </Button>
                                          </div>
                                        )}

                                        {isConfirmed && (
                                          <Button
                                            size="sm"
                                            className="h-8 gap-1"
                                            onClick={() => handleAutoFill(image.id, trade.id)}
                                          >
                                            <Plus className="h-3 w-3" />
                                            Auto Fill Trade
                                          </Button>
                                        )}
                                      </div>

                                      {/* Trade Editor */}
                                      {isEditing && !isConfirmed && !isDiscarded && (
                                        <TradeEditor
                                          trade={trade}
                                          onUpdate={(updated) => handleUpdateTrade(image.id, updated)}
                                        />
                                      )}

                                      {/* Trade Details (read-only) */}
                                      {(!isEditing || isConfirmed) && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Crosshair className="h-3 w-3" /> Entry
                                            </p>
                                            <p className="font-mono text-sm font-semibold">
                                              {trade.entryPrice !== null
                                                ? trade.entryPrice.toFixed(trade.entryPrice < 100 ? 5 : 2)
                                                : "Not detected"}
                                            </p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Shield className="h-3 w-3" /> Stop Loss
                                            </p>
                                            <p className="font-mono text-sm font-semibold text-red-500">
                                              {trade.stopLoss !== null
                                                ? trade.stopLoss.toFixed(trade.stopLoss < 100 ? 5 : 2)
                                                : "Not detected"}
                                            </p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Target className="h-3 w-3" /> Take Profit
                                            </p>
                                            <p className="font-mono text-sm font-semibold text-green-500">
                                              {trade.takeProfit.length > 0
                                                ? trade.takeProfit.map((tp) => tp.toFixed(tp < 100 ? 5 : 2)).join(", ")
                                                : "Not detected"}
                                            </p>
                                          </div>
                                          {trade.positionSize !== null && (
                                            <div className="space-y-1">
                                              <p className="text-xs text-muted-foreground">Position Size</p>
                                              <p className="font-mono text-sm font-semibold">{trade.positionSize} lots</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}

                              {/* Auto Fill All Button */}
                              {confirmedCount > 0 && (
                                <Button
                                  onClick={() => handleAutoFillAllConfirmed(image.id)}
                                  className="w-full gap-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Auto Fill First Confirmed Trade
                                </Button>
                              )}
                            </div>
                          ) : (
                            /* No trades detected */
                            image.ocrResult.rawText && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span>
                                  Text was detected but no trade data could be extracted.
                                  Try a clearer screenshot with visible price levels.
                                </span>
                              </div>
                            )
                          )}

                          {/* Raw Text (collapsible) */}
                          {image.ocrResult.rawText && (
                            <div className="space-y-2">
                              <button
                                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setExpandedText(expandedText === image.id ? null : image.id)}
                              >
                                <FileText className="h-3 w-3" />
                                Show Raw OCR Text
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
