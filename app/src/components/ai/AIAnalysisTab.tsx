/**
 * AI Analysis Tab
 * Displays complete AI analysis for a trade including:
 * - Screenshot Analysis
 * - Detected Setup
 * - Trade Quality Score
 * - Risk Assessment
 * - Mistakes & Strengths
 * - AI Coaching
 * - Trade Summary
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { generateTradeAIAnalysis } from "@/services/ai/aiService";
import type { AIAnalysisResult, TradeSummaryInput, CoachingInput } from "@/services/ai/types";
import type { Trade } from "@/types/trade";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  Brain,
  FileText,
  Target,
  Zap,
  Lock,
} from "lucide-react";

interface AIAnalysisTabProps {
  trade: Trade;
}

export default function AIAnalysisTab({ trade }: AIAnalysisTabProps) {
  const { hasAccess, upgradeMessage, isElite } = useSubscription();
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const canAccessAICoaching = hasAccess("aiCoaching");
  const canAccessAISummary = hasAccess("aiTradeScore");
  const canAccessVision = hasAccess("aiScreenshotAnalysis");

  const generateAnalysis = useCallback(async () => {
    if (!canAccessVision && !canAccessAISummary && !canAccessAICoaching) {
      toast("AI features require an upgrade", { description: upgradeMessage("aiScreenshotAnalysis") });
      return;
    }

    setLoading(true);
    try {
      const tier = isElite ? "elite" : "pro";
      const tradeInput: TradeSummaryInput & CoachingInput = {
        pair: trade.pair,
        direction: trade.direction.toLowerCase(),
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        positionSize: trade.positionSize,
        riskPercent: trade.riskPercent,
        profitLoss: trade.profitLoss,
        rrRatio: trade.rrRatio,
        timeframe: trade.timeframe,
        strategy: trade.strategy,
        session: trade.session,
        notes: trade.notes,
        psychologyNotes: trade.psychology
          ? `${trade.psychology.before.emotion} -> ${trade.psychology.after.emotion}`
          : undefined,
        checklistItems: trade.checklist.map((c) => ({ label: c.label, checked: c.checked })),
      };

      const screenshotUrls = trade.screenshots.map((s) => s.url);
      const result = await generateTradeAIAnalysis(tier, tradeInput, screenshotUrls);
      setAnalysis(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI analysis failed";
      toast(message);
    } finally {
      setLoading(false);
    }
  }, [trade, canAccessVision, canAccessAISummary, canAccessAICoaching, isElite, toast, upgradeMessage]);

  // Auto-generate on mount if elite
  useEffect(() => {
    if (isElite && !analysis && !loading) {
      generateAnalysis();
    }
  }, [isElite]);

  // ─── Upgrade Prompt ───

  if (!canAccessVision && !canAccessAISummary) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
          <p className="text-muted-foreground max-w-sm mb-4">
            {upgradeMessage("aiScreenshotAnalysis")}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Screenshot OCR & Pattern Detection
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" /> AI Coaching & Trade Scoring
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" /> Automated Trade Summaries
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading State ───

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">AI is analyzing your trade...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  // ─── No Analysis Yet ───

  if (!analysis || !analysis.hasAIData) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Analysis Ready</h3>
          <p className="text-muted-foreground max-w-sm mb-4">
            Let AI analyze your screenshots, generate insights, and provide coaching feedback.
          </p>
          <Button onClick={generateAnalysis}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ─── Full Analysis Display ───

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        {/* Overall Score */}
        {analysis.overallScore > 0 && (
          <ScoreCard score={analysis.overallScore} analysis={analysis} onRefresh={generateAnalysis} />
        )}

        {/* Screenshot Analysis */}
        {analysis.screenshots.length > 0 && (
          <ScreenshotAnalysisCard screenshots={analysis.screenshots} />
        )}

        {/* Trade Summary */}
        {analysis.tradeSummary && (
          <TradeSummaryCard summary={analysis.tradeSummary} />
        )}

        {/* AI Coaching */}
        {analysis.coaching && canAccessAICoaching && (
          <CoachingCard coaching={analysis.coaching} />
        )}

        {/* Locked coaching for non-elite */}
        {(!analysis.coaching || !canAccessAICoaching) && canAccessVision && !canAccessAICoaching && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Lock className="h-8 w-8 text-muted-foreground mb-3" />
              <h4 className="font-medium mb-1">AI Coaching</h4>
              <p className="text-sm text-muted-foreground">{upgradeMessage("aiCoaching")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Score Card ───

function ScoreCard({
  score,
  analysis,
  onRefresh,
}: {
  score: number;
  analysis: AIAnalysisResult;
  onRefresh: () => void;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return "bg-green-50 dark:bg-green-950/20 border-green-200";
    if (s >= 60) return "bg-amber-50 dark:bg-amber-950/20 border-amber-200";
    return "bg-red-50 dark:bg-red-950/20 border-red-200";
  };

  return (
    <Card className={getScoreBg(score)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</div>
            <div>
              <p className="font-medium">AI Trade Score</p>
              <p className="text-sm text-muted-foreground">
                {score >= 80 ? "Excellent trade execution" : score >= 60 ? "Good with room for improvement" : "Several issues detected"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {analysis.provider}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Screenshot Analysis Card ───

function ScreenshotAnalysisCard({
  screenshots,
}: {
  screenshots: AIAnalysisResult["screenshots"];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Screenshot Analysis ({screenshots.length})
        </CardTitle>
        <CardDescription>AI-detected patterns, levels, and extracted data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {screenshots.map((sa, idx) => (
          <div key={idx} className="space-y-3">
            {idx > 0 && <Separator />}

            {/* Extracted OCR Data */}
            {sa.extractedData && sa.extractedData.confidence > 0.3 && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Extracted Trade Data
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {sa.extractedData.pair && (
                    <div><span className="text-muted-foreground text-xs">Pair</span> <span className="font-medium">{sa.extractedData.pair}</span></div>
                  )}
                  {sa.extractedData.timeframe && (
                    <div><span className="text-muted-foreground text-xs">TF</span> <span className="font-medium">{sa.extractedData.timeframe}</span></div>
                  )}
                  {sa.extractedData.entryPrice && (
                    <div><span className="text-muted-foreground text-xs">Entry</span> <span className="font-medium">{sa.extractedData.entryPrice}</span></div>
                  )}
                  {sa.extractedData.stopLoss && (
                    <div><span className="text-muted-foreground text-xs">SL</span> <span className="font-medium">{sa.extractedData.stopLoss}</span></div>
                  )}
                  {sa.extractedData.takeProfit && (
                    <div><span className="text-muted-foreground text-xs">TP</span> <span className="font-medium">{sa.extractedData.takeProfit}</span></div>
                  )}
                  {sa.extractedData.rrRatio && (
                    <div><span className="text-muted-foreground text-xs">R:R</span> <span className="font-medium">{sa.extractedData.rrRatio}</span></div>
                  )}
                  {sa.extractedData.positionSize && (
                    <div><span className="text-muted-foreground text-xs">Size</span> <span className="font-medium">{sa.extractedData.positionSize}</span></div>
                  )}
                  {sa.extractedData.riskPercent && (
                    <div><span className="text-muted-foreground text-xs">Risk</span> <span className="font-medium">{sa.extractedData.riskPercent}%</span></div>
                  )}
                  {sa.extractedData.broker && (
                    <div><span className="text-muted-foreground text-xs">Broker</span> <span className="font-medium">{sa.extractedData.broker}</span></div>
                  )}
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Confidence: {Math.round(sa.extractedData.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            )}

            {/* Chart Analysis */}
            {sa.chartAnalysis && (
              <div className="space-y-2">
                {/* Bias */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Overall Bias:</span>
                  <Badge
                    variant={sa.chartAnalysis.overallBias === "bullish" ? "default" : sa.chartAnalysis.overallBias === "bearish" ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {sa.chartAnalysis.overallBias === "bullish" ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : sa.chartAnalysis.overallBias === "bearish" ? (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    ) : (
                      <Info className="mr-1 h-3 w-3" />
                    )}
                    {sa.chartAnalysis.overallBias}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(sa.chartAnalysis.confidence * 100)}% confidence)
                  </span>
                </div>

                {/* Patterns */}
                {sa.chartAnalysis.patterns.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Detected Patterns</p>
                    <div className="flex flex-wrap gap-1">
                      {sa.chartAnalysis.patterns.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal">
                          {p.label} ({Math.round(p.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {sa.chartAnalysis.summary && (
                  <p className="text-sm text-muted-foreground">{sa.chartAnalysis.summary}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Trade Summary Card ───

function TradeSummaryCard({ summary }: { summary: NonNullable<AIAnalysisResult["tradeSummary"]> }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-blue-500" />
          AI Trade Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{summary.summary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Entry Reason
            </p>
            <p className="text-sm">{summary.entryReason}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="h-3 w-3" /> Exit Reason
            </p>
            <p className="text-sm">{summary.exitReason}</p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Shield className="h-3 w-3" /> Risk Assessment
          </p>
          <p className="text-sm">{summary.riskAssessment}</p>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {summary.strengths.length > 0 && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3">
              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Strengths
              </p>
              <ul className="space-y-1">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-800 dark:text-green-200">{s}</li>
                ))}
              </ul>
            </div>
          )}
          {summary.weaknesses.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Weaknesses
              </p>
              <ul className="space-y-1">
                {summary.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-amber-800 dark:text-amber-200">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Quality Score:</span>
            <span className="font-semibold">{summary.tradeQualityScore}/100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Confidence:</span>
            <span className="font-semibold">{summary.confidenceScore}/100</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Coaching Card ───

function CoachingCard({ coaching }: { coaching: NonNullable<AIAnalysisResult["coaching"]> }) {
  const severityConfig = {
    critical: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20 border-red-200" },
    warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200" },
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200" },
    positive: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20 border-green-200" },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Coaching
        </CardTitle>
        <CardDescription>Personalized feedback to improve your trading</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Bars */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Discipline", score: coaching.disciplineScore },
            { label: "Emotional", score: coaching.emotionalScore },
            { label: "Risk", score: coaching.riskScore },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div
                className={`text-2xl font-bold ${
                  item.score >= 75 ? "text-green-600" : item.score >= 50 ? "text-amber-600" : "text-red-600"
                }`}
              >
                {item.score}
              </div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.score >= 75 ? "bg-green-500" : item.score >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">{coaching.overallFeedback}</p>

        {/* Coaching Items */}
        <div className="space-y-2">
          {coaching.items.map((item) => {
            const config = severityConfig[item.severity];
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 ${config.bg}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.message}</p>
                    {item.actionable && (
                      <p className="text-sm mt-1 font-medium">Action: {item.actionable}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
