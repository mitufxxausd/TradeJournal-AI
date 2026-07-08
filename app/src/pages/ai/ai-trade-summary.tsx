/**
 * AI Trade Summary Page
 * Generates summaries from actual trades only. No invented market analysis.
 * All statistics are calculated from the user's real trade database.
 */

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrades } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/trade";
import {
  ClipboardList,
  Lock,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Award,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  BarChart3,
  BookOpen,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// ─── Types ───

interface TradeSummary {
  period: string;
  totalTrades: number;
  winRate: number;
  netProfit: number;
  avgRR: number;
  bestTrade: { pair: string; pnl: number } | null;
  worstTrade: { pair: string; pnl: number } | null;
  strengths: string[];
  weaknesses: string[];
  riskReview: {
    avgRiskPerTrade: number;
    maxRiskPerTrade: number;
    totalRisked: number;
    riskConsistency: number;
  };
  lessons: {
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium";
  }[];
}

// ─── Feature Gate ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">AI Trade Summary Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Elite</span> to unlock trade summaries with performance insights.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Empty State ───

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No Trades to Summarize</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Add trades to your journal to see a performance summary based on your real data.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Summary Calculator ───

function calculateSummary(trades: Trade[]): TradeSummary {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      period: "All Time",
      totalTrades: 0,
      winRate: 0,
      netProfit: 0,
      avgRR: 0,
      bestTrade: null,
      worstTrade: null,
      strengths: [],
      weaknesses: [],
      riskReview: { avgRiskPerTrade: 0, maxRiskPerTrade: 0, totalRisked: 0, riskConsistency: 0 },
      lessons: [],
    };
  }

  const winningTrades = trades.filter((t) => (t.profitLoss || 0) > 0);
  const losingTrades = trades.filter((t) => (t.profitLoss || 0) < 0);
  const winRate = (winningTrades.length / totalTrades) * 100;
  const netProfit = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

  // Average R:R
  const tradesWithRR = trades.filter((t) => t.rrRatio !== null && t.rrRatio !== undefined);
  const avgRR = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + (t.rrRatio || 0), 0) / tradesWithRR.length
    : 0;

  // Best and worst trade
  let bestTrade: { pair: string; pnl: number } | null = null;
  let worstTrade: { pair: string; pnl: number } | null = null;
  let bestPnl = -Infinity;
  let worstPnl = Infinity;

  for (const trade of trades) {
    const pnl = trade.profitLoss || 0;
    if (pnl > bestPnl) {
      bestPnl = pnl;
      bestTrade = { pair: trade.pair, pnl };
    }
    if (pnl < worstPnl) {
      worstPnl = pnl;
      worstTrade = { pair: trade.pair, pnl };
    }
  }

  // Strengths and weaknesses derived from real data
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (winRate >= 55) {
    strengths.push(`Strong win rate of ${winRate.toFixed(1)}% shows your edge is working`);
  }
  if (avgRR >= 1.5) {
    strengths.push(`Good risk-reward discipline with average R:R of ${avgRR.toFixed(2)}:1`);
  }
  if (winningTrades.length > 0) {
    const avgWin = winningTrades.reduce((s, t) => s + (t.profitLoss || 0), 0) / winningTrades.length;
    if (avgWin > 100) {
      strengths.push(`Healthy average winner at $${avgWin.toFixed(2)} per trade`);
    }
  }
  if (netProfit > 0) {
    strengths.push("Overall profitable - your strategy has a positive expectancy");
  }

  if (winRate < 45) {
    weaknesses.push(`Win rate of ${winRate.toFixed(1)}% is below optimal - review your entry criteria`);
  }
  if (avgRR < 1.2) {
    weaknesses.push("Risk-reward ratio is low - consider holding winners longer");
  }
  if (losingTrades.length > 0) {
    const avgLoss = Math.abs(losingTrades.reduce((s, t) => s + (t.profitLoss || 0), 0)) / losingTrades.length;
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((s, t) => s + (t.profitLoss || 0), 0) / winningTrades.length
      : 0;
    if (avgLoss > avgWin) {
      weaknesses.push("Average loss is larger than average win - tighten your stop losses");
    }
  }
  if (netProfit < 0) {
    weaknesses.push("Currently in drawdown - reduce risk until consistency improves");
  }

  // Risk review
  const riskValues = trades.filter((t) => t.riskPercent !== null).map((t) => t.riskPercent || 0);
  const avgRisk = riskValues.length > 0 ? riskValues.reduce((a, b) => a + b, 0) / riskValues.length : 0;
  const maxRisk = riskValues.length > 0 ? Math.max(...riskValues) : 0;
  const totalRisked = riskValues.reduce((a, b) => a + b, 0);
  const riskVariance = riskValues.length > 0
    ? riskValues.reduce((sum, r) => sum + Math.pow(r - avgRisk, 2), 0) / riskValues.length
    : 0;
  const riskStdDev = Math.sqrt(riskVariance);
  const riskConsistency = avgRisk > 0 ? Math.max(0, 100 - (riskStdDev / avgRisk) * 100) : 0;

  // Lessons derived from real patterns
  const lessons: TradeSummary["lessons"] = [];

  // Session analysis
  const sessionStats: Record<string, { trades: number; wins: number; profit: number }> = {};
  for (const trade of trades) {
    const session = trade.session || "Unknown";
    if (!sessionStats[session]) sessionStats[session] = { trades: 0, wins: 0, profit: 0 };
    sessionStats[session].trades++;
    if ((trade.profitLoss || 0) > 0) sessionStats[session].wins++;
    sessionStats[session].profit += trade.profitLoss || 0;
  }

  const sortedSessions = Object.entries(sessionStats)
    .filter(([, s]) => s.trades >= 3)
    .sort((a, b) => (b[1].wins / b[1].trades) - (a[1].wins / a[1].trades));

  if (sortedSessions.length >= 2) {
    const bestSession = sortedSessions[0];
    const worstSession = sortedSessions[sortedSessions.length - 1];
    const bestRate = (bestSession[1].wins / bestSession[1].trades) * 100;
    const worstRate = (worstSession[1].wins / worstSession[1].trades) * 100;

    if (bestRate - worstRate > 20) {
      lessons.push({
        id: "session-timing",
        title: "Session Timing Matters",
        description: `Your ${bestSession[0]} session has a ${bestRate.toFixed(0)}% win rate vs ${worstRate.toFixed(0)}% in ${worstSession[0]}. Consider focusing your trading during ${bestSession[0]}.`,
        impact: "high",
      });
    }
  }

  // Pair performance lesson
  const pairStats: Record<string, { trades: number; profit: number }> = {};
  for (const trade of trades) {
    if (!pairStats[trade.pair]) pairStats[trade.pair] = { trades: 0, profit: 0 };
    pairStats[trade.pair].trades++;
    pairStats[trade.pair].profit += trade.profitLoss || 0;
  }

  const sortedPairs = Object.entries(pairStats)
    .filter(([, s]) => s.trades >= 3)
    .sort((a, b) => b[1].profit - a[1].profit);

  if (sortedPairs.length >= 2) {
    const bestPair = sortedPairs[0];
    const worstPair = sortedPairs[sortedPairs.length - 1];
    if (bestPair[1].profit > 0 && worstPair[1].profit < 0) {
      lessons.push({
        id: "pair-focus",
        title: "Focus on Your Best Pair",
        description: `${bestPair[0]} has generated $${bestPair[1].profit.toFixed(2)} profit while ${worstPair[0]} lost $${Math.abs(worstPair[1].profit).toFixed(2)}. Consider specializing in what works.`,
        impact: "high",
      });
    }
  }

  // Overtrading lesson
  const dayCounts: Record<string, number> = {};
  for (const trade of trades) {
    const day = (trade.tradeDate || trade.createdAt).substring(0, 10);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }
  const overtradingDays = Object.values(dayCounts).filter((c) => c >= 4).length;
  if (overtradingDays > 0) {
    lessons.push({
      id: "overtrading",
      title: "Watch Your Trade Frequency",
      description: `You had ${overtradingDays} day${overtradingDays > 1 ? "s" : ""} with 4+ trades. Quality over quantity - fewer, higher-conviction setups typically yield better results.`,
      impact: "medium",
    });
  }

  return {
    period: "All Time",
    totalTrades,
    winRate,
    netProfit,
    avgRR,
    bestTrade,
    worstTrade,
    strengths,
    weaknesses,
    riskReview: {
      avgRiskPerTrade: avgRisk,
      maxRiskPerTrade: maxRisk,
      totalRisked,
      riskConsistency,
    },
    lessons,
  };
}

// ─── Main Component ───

export default function AITradeSummary() {
  const { hasAccess } = useSubscription();
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess = hasAccess("aiTradeScore");

  useEffect(() => {
    if (!user || !canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchTrades(user.uid)
      .then((data) => {
        if (mounted) {
          setTrades(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, canAccess]);

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Trade Summary
          </h1>
          <p className="mt-1 text-muted-foreground">Trade performance summary</p>
        </div>
        <LockedFeature />
      </div>
    );
  }

  const summary = useMemo(() => calculateSummary(trades), [trades]);
  const hasData = trades.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Trade Summary
          </h1>
          <p className="mt-1 text-muted-foreground">
            Performance summary based on your actual trading data
          </p>
        </div>
      </div>

      {!hasData && !loading ? (
        <EmptyState />
      ) : (
        <>
          {/* Period & Quick Stats */}
          <div className="flex flex-wrap items-center gap-3">
            {loading ? (
              <>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
              </>
            ) : (
              <>
                <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {summary.period}
                </Badge>
                <Badge className={cn(
                  "gap-1 text-sm px-3 py-1",
                  summary.netProfit >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
                )}>
                  {summary.netProfit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  P&L: ${summary.netProfit.toFixed(2)}
                </Badge>
                <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
                  <Target className="h-3.5 w-3.5" />
                  Win Rate: {summary.winRate.toFixed(1)}%
                </Badge>
                <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {summary.totalTrades} Trades
                </Badge>
              </>
            )}
          </div>

          {/* Best/Worst Trades */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-green-500/20">
              <CardContent className="p-4">
                {loading ? <Skeleton className="h-20 w-full" /> : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Best Trade</p>
                      {summary.bestTrade ? (
                        <>
                          <p className="font-semibold">{summary.bestTrade.pair}</p>
                          <p className="text-sm font-bold text-green-600">+${summary.bestTrade.pnl.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-red-500/20">
              <CardContent className="p-4">
                {loading ? <Skeleton className="h-20 w-full" /> : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <ArrowDownRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Worst Trade</p>
                      {summary.worstTrade ? (
                        <>
                          <p className="font-semibold">{summary.worstTrade.pair}</p>
                          <p className="text-sm font-bold text-red-600">${summary.worstTrade.pnl.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : summary.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {summary.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                        <span className="text-sm">{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No clear strengths identified yet. Keep trading to build your data.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : summary.weaknesses.length > 0 ? (
                  <ul className="space-y-3">
                    {summary.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0 mt-0.5">
                          <XCircle className="h-3 w-3" />
                        </div>
                        <span className="text-sm">{w}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No major weaknesses detected. Keep up the good work!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk Review */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Risk Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Avg Risk/Trade</p>
                    <p className="text-2xl font-bold mt-1">{summary.riskReview.avgRiskPerTrade.toFixed(2)}%</p>
                    <Progress value={Math.min(100, (summary.riskReview.avgRiskPerTrade / 3) * 100)} className="h-1.5 mt-2" />
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Max Risk/Trade</p>
                    <p className={cn(
                      "text-2xl font-bold mt-1",
                      summary.riskReview.maxRiskPerTrade > 2 ? "text-amber-500" : "text-green-500"
                    )}>
                      {summary.riskReview.maxRiskPerTrade.toFixed(2)}%
                    </p>
                    <Progress value={Math.min(100, (summary.riskReview.maxRiskPerTrade / 3) * 100)} className="h-1.5 mt-2" />
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Total Risked</p>
                    <p className="text-2xl font-bold mt-1">{summary.riskReview.totalRisked.toFixed(2)}%</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Risk Consistency</p>
                    <p className="text-2xl font-bold mt-1">{summary.riskReview.riskConsistency.toFixed(0)}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Lessons */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Key Lessons
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : summary.lessons.length > 0 ? (
              <div className="space-y-4">
                {summary.lessons.map((lesson) => (
                  <Card key={lesson.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                          lesson.impact === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                        )}>
                          {lesson.impact === "high" ? <AlertTriangle className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <Badge variant={lesson.impact === "high" ? "destructive" : "secondary"} className="text-xs">
                              {lesson.impact.toUpperCase()} IMPACT
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Continue trading to generate data-driven lessons.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
