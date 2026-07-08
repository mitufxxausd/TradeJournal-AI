/**
 * AI Screenshot Upload
 * Enhanced screenshot upload with AI analysis integration.
 * Allows users to upload screenshots, then AI analyzes them
 * and suggests auto-filled trade data.
 */

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { analyzeScreenshots } from "@/services/ai/aiService";
import type { ExtractedTradeData, ScreenshotAnalysis } from "@/services/ai/types";
import type { TradeScreenshot } from "@/types/trade";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Lock,
  ExternalLink,
  Wand2,
} from "lucide-react";

interface AIScreenshotUploadProps {
  screenshots: TradeScreenshot[];
  uploadProgress: Record<string, number>;
  onUploadFiles: (files: File[]) => void;
  onDeleteScreenshot: (screenshot: TradeScreenshot) => void;
  onFileDrop: (e: React.DragEvent) => void;
  onAutoFill?: (data: ExtractedTradeData) => void;
  disabled?: boolean;
}

export default function AIScreenshotUpload({
  screenshots,
  uploadProgress,
  onUploadFiles,
  onDeleteScreenshot,
  onFileDrop,
  onAutoFill,
  disabled,
}: AIScreenshotUploadProps) {
  const { hasAccess, upgradeMessage } = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiAnalyses, setAiAnalyses] = useState<Record<string, ScreenshotAnalysis>>({});
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const canUseAI = hasAccess("aiScreenshotAnalysis");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    onUploadFiles(files);
  };

  const handleAnalyzeScreenshot = useCallback(
    async (screenshot: TradeScreenshot) => {
      if (!canUseAI) {
        toast.info(upgradeMessage("aiScreenshotAnalysis"));
        return;
      }

      setAnalyzingIds((prev) => new Set(prev).add(screenshot.id));

      try {
        const results = await analyzeScreenshots({
          userTier: "pro",
          imageUrls: [screenshot.url],
        });

        if (results.length > 0) {
          setAiAnalyses((prev) => ({ ...prev, [screenshot.id]: results[0] }));
          toast.success("Screenshot analyzed");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        toast.error(message);
      } finally {
        setAnalyzingIds((prev) => {
          const next = new Set(prev);
          next.delete(screenshot.id);
          return next;
        });
      }
    },
    [canUseAI, upgradeMessage]
  );

  const handleAutoFill = useCallback(
    (screenshotId: string) => {
      const analysis = aiAnalyses[screenshotId];
      if (analysis?.extractedData) {
        onAutoFill?.(analysis.extractedData);
        toast.success("Form auto-filled from screenshot data");
      }
    },
    [aiAnalyses, onAutoFill]
  );

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Trade Screenshots
          </CardTitle>
          <CardDescription>
            Upload chart screenshots for this trade
            {canUseAI && " — AI will analyze them for patterns and trade data"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={onFileDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Click or drag & drop to upload</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Upload progress */}
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="flex-1">
                <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className="text-xs">{Math.round(progress)}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Upgrade Banner */}
      {!canUseAI && screenshots.length > 0 && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex items-center gap-3 py-4">
            <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">AI Screenshot Analysis</p>
              <p className="text-xs text-muted-foreground">
                {upgradeMessage("aiScreenshotAnalysis")} Auto-detect trade data from your screenshots.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshots Grid with AI */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {screenshots.map((screenshot) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              analysis={aiAnalyses[screenshot.id]}
              isAnalyzing={analyzingIds.has(screenshot.id)}
              canUseAI={canUseAI}
              onAnalyze={() => handleAnalyzeScreenshot(screenshot)}
              onAutoFill={() => handleAutoFill(screenshot.id)}
              onDelete={() => onDeleteScreenshot(screenshot)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Screenshot Card with AI ───

function ScreenshotCard({
  screenshot,
  analysis,
  isAnalyzing,
  canUseAI,
  onAnalyze,
  onAutoFill,
  onDelete,
}: {
  screenshot: TradeScreenshot;
  analysis?: ScreenshotAnalysis;
  isAnalyzing: boolean;
  canUseAI: boolean;
  onAnalyze: () => void;
  onAutoFill: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative sm:w-48 h-32 sm:h-auto shrink-0 bg-muted">
          <img
            src={screenshot.url}
            alt={screenshot.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={() => window.open(screenshot.url, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{screenshot.name}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* AI Actions */}
          {canUseAI && (
            <div className="flex items-center gap-2">
              {!analysis && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={onAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 h-3 w-3" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              )}

              {analysis?.extractedData && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={onAutoFill}
                >
                  <Wand2 className="mr-1 h-3 w-3" />
                  Auto-fill Form
                </Button>
              )}

              {analysis && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Analyzed
                </Badge>
              )}
            </div>
          )}

          {/* AI Results */}
          {isAnalyzing && !analysis && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {analysis?.extractedData && (
            <div className="rounded-md bg-muted/50 p-2 text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-1">Detected Data:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {analysis.extractedData.pair && (
                  <span>Pair: <span className="font-medium">{analysis.extractedData.pair}</span></span>
                )}
                {analysis.extractedData.timeframe && (
                  <span>TF: <span className="font-medium">{analysis.extractedData.timeframe}</span></span>
                )}
                {analysis.extractedData.entryPrice && (
                  <span>Entry: <span className="font-medium">{analysis.extractedData.entryPrice}</span></span>
                )}
                {analysis.extractedData.stopLoss && (
                  <span>SL: <span className="font-medium">{analysis.extractedData.stopLoss}</span></span>
                )}
                {analysis.extractedData.takeProfit && (
                  <span>TP: <span className="font-medium">{analysis.extractedData.takeProfit}</span></span>
                )}
                {analysis.extractedData.rrRatio && (
                  <span>R:R: <span className="font-medium">{analysis.extractedData.rrRatio}</span></span>
                )}
              </div>
            </div>
          )}

          {analysis?.chartAnalysis && (
            <div className="flex flex-wrap gap-1">
              {analysis.chartAnalysis.patterns.slice(0, 4).map((p, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {p.label}
                </Badge>
              ))}
              {analysis.chartAnalysis.overallBias && (
                <Badge
                  variant={
                    analysis.chartAnalysis.overallBias === "bullish"
                      ? "default"
                      : analysis.chartAnalysis.overallBias === "bearish"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs"
                >
                  {analysis.chartAnalysis.overallBias}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
