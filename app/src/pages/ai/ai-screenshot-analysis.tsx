import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
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
  BarChart3,
  Target,
  Shield,
  Award,
  Crosshair,
  Zap,
  AlertTriangle,
  Sparkles,
  ImageIcon,
} from "lucide-react";

// ─── Types ───

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploadedAt: Date;
  cloudinaryUrl?: string;
  status: "uploading" | "ready" | "analyzing" | "analyzed" | "error";
  analysis?: AnalysisResult | null;
}

interface AnalysisResult {
  pair: string;
  timeframe: string;
  direction: "buy" | "sell";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  risk: number;
  reward: number;
  riskRewardRatio: number;
  chartPattern: string;
  marketStructure: string;
  support: number;
  resistance: number;
  ema: string;
  rsi: number;
  volume: string;
  confidenceScore: number;
  tradeQualityScore: number;
}

// ─── Mock Analysis Generator ───

function generateMockAnalysis(): AnalysisResult {
  const pairs = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "AUDUSD"];
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const direction = Math.random() > 0.5 ? "buy" : "sell";
  const entry = pair.includes("JPY")
    ? +(145 + Math.random() * 10).toFixed(3)
    : pair.includes("XAU")
      ? +(2000 + Math.random() * 200).toFixed(2)
      : pair.includes("BTC")
        ? +(35000 + Math.random() * 10000).toFixed(2)
        : +(1.05 + Math.random() * 0.15).toFixed(5);

  const slDistance = entry * (0.001 + Math.random() * 0.002);
  const tpDistance = slDistance * (1.5 + Math.random() * 2);

  return {
    pair,
    timeframe: ["15M", "1H", "4H", "D"][Math.floor(Math.random() * 4)],
    direction,
    entry,
    stopLoss: direction === "buy" ? +(entry - slDistance).toFixed(5) : +(entry + slDistance).toFixed(5),
    takeProfit: direction === "buy" ? +(entry + tpDistance).toFixed(5) : +(entry - tpDistance).toFixed(5),
    risk: +(0.5 + Math.random() * 1.5).toFixed(2),
    reward: +(1 + Math.random() * 3).toFixed(2),
    riskRewardRatio: +(1.5 + Math.random() * 2).toFixed(2),
    chartPattern: ["Double Top", "Head & Shoulders", "Bull Flag", "Bear Flag", "Triangle", "FVG"][Math.floor(Math.random() * 6)],
    marketStructure: ["Bullish BOS", "Bearish CHoCH", "Consolidation", "Uptrend", "Downtrend"][Math.floor(Math.random() * 5)],
    support: +(entry * 0.99).toFixed(5),
    resistance: +(entry * 1.01).toFixed(5),
    ema: `EMA${[50, 100, 200][Math.floor(Math.random() * 3)]}: ${direction === "buy" ? "Bullish alignment" : "Bearish alignment"}`,
    rsi: Math.floor(30 + Math.random() * 50),
    volume: ["Above Average", "High", "Average"][Math.floor(Math.random() * 3)],
    confidenceScore: Math.floor(65 + Math.random() * 30),
    tradeQualityScore: Math.floor(60 + Math.random() * 35),
  };
}

// ─── Feature Gate ───

function LockedFeature({ tier }: { tier: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Screenshot Analysis Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Pro</span> or{" "}
        <span className="font-semibold text-primary">Elite</span> to unlock AI-powered screenshot analysis with pattern detection and trade extraction.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Main Component ───

export default function AIScreenshotAnalysis() {
  const { hasAccess, tier } = useSubscription();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
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
      uploadedAt: new Date(),
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
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "analyzing" as const } : i)));

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

    const analysis = generateMockAnalysis();

    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "analyzed" as const, analysis } : i))
    );

    toast.success(`${analysis.pair} analysis complete - ${analysis.confidenceScore}% confidence`);
  };

  const analyzeAll = async () => {
    const readyImages = images.filter((i) => i.status === "ready");
    for (const img of readyImages) {
      await analyzeImage(img.id);
    }
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === "buy") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === "sell") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-7 w-7 text-primary" />
            Screenshot Analysis
          </h1>
          <p className="mt-1 text-muted-foreground">Analyze trading screenshots with AI</p>
        </div>
        <LockedFeature tier={tier} />
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
            Upload trading screenshots for AI-powered analysis
          </p>
        </div>
        {images.some((i) => i.status === "ready") && (
          <Button onClick={analyzeAll} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Analyze All
          </Button>
        )}
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
          or click to browse · Supports PNG, JPG, WEBP
        </p>
      </div>

      {/* Image Gallery + Analysis */}
      {images.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Images ({images.length})
            </h2>
            {images.some((i) => i.status === "analyzing") && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </div>
            )}
          </div>

          <div className="space-y-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden transition-all hover:shadow-md">
                <div className="grid md:grid-cols-[280px_1fr]">
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
                      {image.status === "analyzing" && (
                        <Badge variant="secondary" className="gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analyzing
                        </Badge>
                      )}
                      {image.status === "analyzed" && (
                        <Badge className="bg-green-500 text-white gap-1">
                          <Sparkles className="h-3 w-3" />
                          Analyzed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Analysis Panel */}
                  <CardContent className="p-5">
                    {!image.analysis && image.status !== "analyzing" && (
                      <div className="flex flex-col items-center justify-center h-full py-10 gap-4">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        <div className="text-center">
                          <p className="font-medium">Ready for analysis</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Click analyze to get AI-powered trade insights
                          </p>
                        </div>
                        <Button onClick={() => analyzeImage(image.id)} className="gap-2">
                          <Sparkles className="h-4 w-4" />
                          Analyze Screenshot
                        </Button>
                      </div>
                    )}

                    {image.status === "analyzing" && (
                      <div className="flex flex-col items-center justify-center h-full py-10 gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-primary/20" />
                          <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium">AI Analysis in Progress</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Detecting patterns, levels, and trade setups...
                          </p>
                        </div>
                      </div>
                    )}

                    {image.analysis && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Top row: Pair, direction, scores */}
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline" className="text-base px-3 py-1 font-bold">
                            {image.analysis.pair}
                          </Badge>
                          <Badge className={cn(
                            "gap-1",
                            image.analysis.direction === "buy"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          )}>
                            {getDirectionIcon(image.analysis.direction)}
                            {image.analysis.direction.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{image.analysis.timeframe}</Badge>
                          <div className="ml-auto flex items-center gap-3">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Confidence</p>
                              <p className={cn(
                                "text-sm font-bold",
                                image.analysis.confidenceScore >= 80 ? "text-green-500" : "text-amber-500"
                              )}>
                                {image.analysis.confidenceScore}%
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Quality</p>
                              <p className={cn(
                                "text-sm font-bold",
                                image.analysis.tradeQualityScore >= 80 ? "text-green-500" : "text-amber-500"
                              )}>
                                {image.analysis.tradeQualityScore}%
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Trade Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Crosshair className="h-3 w-3" /> Entry
                            </p>
                            <p className="font-mono text-sm font-semibold">{image.analysis.entry}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Shield className="h-3 w-3" /> Stop Loss
                            </p>
                            <p className="font-mono text-sm font-semibold text-red-500">{image.analysis.stopLoss}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Target className="h-3 w-3" /> Take Profit
                            </p>
                            <p className="font-mono text-sm font-semibold text-green-500">{image.analysis.takeProfit}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Risk
                            </p>
                            <p className="font-mono text-sm font-semibold">{image.analysis.risk}%</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Award className="h-3 w-3" /> Reward
                            </p>
                            <p className="font-mono text-sm font-semibold">{image.analysis.reward}%</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" /> R:R Ratio
                            </p>
                            <p className="font-mono text-sm font-semibold text-primary">{image.analysis.riskRewardRatio}:1</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Technical Analysis */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Technical Analysis
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Chart Pattern</span>
                                <span className="font-medium">{image.analysis.chartPattern}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Market Structure</span>
                                <span className="font-medium">{image.analysis.marketStructure}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Volume</span>
                                <span className="font-medium">{image.analysis.volume}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">RSI</span>
                                <span className="font-medium">{image.analysis.rsi}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Key Levels
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Support</span>
                                <span className="font-mono font-medium text-green-600">{image.analysis.support}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Resistance</span>
                                <span className="font-mono font-medium text-red-600">{image.analysis.resistance}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">EMA Signal</span>
                                <span className="font-medium text-xs">{image.analysis.ema}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Confidence Score
                            </span>
                            <span className="font-bold">{image.analysis.confidenceScore}%</span>
                          </div>
                          <Progress value={image.analysis.confidenceScore} className="h-2" />
                          <div className="flex-icons-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Award className="h-3 w-3" /> Trade Quality Score
                            </span>
                            <span className="font-bold">{image.analysis.tradeQualityScore}%</span>
                          </div>
                          <Progress value={image.analysis.tradeQualityScore} className="h-2" />
                        </div>
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
