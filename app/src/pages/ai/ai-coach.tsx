/**
 * AI Coach Page
 * Generates coaching insights only from user's actual trade history.
 * No fake advice. Shows "Not enough trades for coaching" if insufficient data.
 */

import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
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
  Brain,
  Lock,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  BarChart3,
  Award,
  Zap,
  Heart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ─── Types ───

interface CoachingInsight {
  id: string;
  category: string;
  title: string;
  message: string;
  type: "positive" | "warning" | "info";
  metric?: string;
  value?: number;
}

interface CoachStats {
  totalTrades: number;
  mostProfitablePair: string;
  leastProfitablePair: string;
  overtradingDays: number;
  avgRR: number;
  winRate: number;
  riskConsistency: number;
  bestSession: string;
  worstSession: string;
  avgTradesPerDay: number;
  insights: CoachingInsight[];
}

// ─── Locked Feature ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">AI Coach Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Elite</span> to unlock the AI Coach with personalized trading insights.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Empty State ───

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Not Enough Trades for Coaching</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{message}</p>
      </CardContent>
    </Card>
  );
}

// ─── Insight Card ───

function InsightCard({ insight }: { insight: CoachingInsight }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
            insight.type === "positive" && "bg-green-100 text-green-600 dark:bg-green-900/30",
            insight.type === "warning" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
            insight.type === "info" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
          )}>
            {insight.type === "positive" && <CheckCircle2 className="h-5 w-5" />}
            {insight.type === "warning" && <AlertTriangle className="h-5 w-5" />}
            {insight.type === "info" && <Lightbulb className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{insight.title}</h3>
              <Badge variant="outline" className="text-xs">{insight.category}</Badge>
            </div>
            {insight.metric && (
              <p className="text-sm font-medium mt-1">
                {insight.metric}: {typeof insight.value === "number" ? insight.value.toFixed(2) : insight.value}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Statistics Calculator ───

function calculateCoachStats(trades: Trade[]): CoachStats {
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => (t.profitLoss || 0) > 0);
  const losingTrades = trades.filter((t) => (t.profitLoss || 0) < 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  // Average R:R
  const tradesWithRR = trades.filter((t) => t.rrRatio !== null && t.rrRatio !== undefined);
  const avgRR = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + (t.rrRatio || 0), 0) / tradesWithRR.length
    : 0;

  // Most/Least profitable pair
  const pairStats: Record<string, number> = {};
  const pairTrades: Record<string, number> = {};
  for (const trade of trades) {
    pairStats[trade.pair] = (pairStats[trade.pair] || 0) + (trade.profitLoss || 0);
    pairTrades[trade.pair] = (pairTrades[trade.pair] || 0) + 1;
  }

  let mostProfitablePair = "N/A";
  let leastProfitablePair = "N/A";
  let bestProfit = -Infinity;
  let worstProfit = Infinity;

  for (const [pair, profit] of Object.entries(pairStats)) {
    if (profit > bestProfit) {
      bestProfit = profit;
      mostProfitablePair = pair;
    }
    if (profit < worstProfit) {
      worstProfit = profit;
      leastProfitablePair = pair;
    }
  }

  // Session performance
  const sessionStats: Record<string, { profit: number; trades: number; wins: number }> = {};
  for (const trade of trades) {
    const session = trade.session || "Unknown";
    if (!sessionStats[session]) {
      sessionStats[session] = { profit: 0, trades: 0, wins: 0 };
    }
    sessionStats[session].profit += trade.profitLoss || 0;
    sessionStats[session].trades += 1;
    if ((trade.profitLoss || 0) > 0) sessionStats[session].wins += 1;
  }

  let bestSession = "N/A";
  let worstSession = "N/A";
  let bestSessionProfit = -Infinity;
  let worstSessionProfit = Infinity;

  for (const [session, stats] of Object.entries(sessionStats)) {
    if (stats.profit > bestSessionProfit) {
      bestSessionProfit = stats.profit;
      bestSession = session;
    }
    if (stats.profit < worstSessionProfit) {
      worstSessionProfit = stats.profit;
      worstSession = session;
    }
  }

  // Overtrading detection (days with 4+ trades)
  const dayTradeCounts: Record<string, number> = {};
  for (const trade of trades) {
    const day = trade.tradeDate || trade.createdAt;
    const dayKey = day.substring(0, 10); // YYYY-MM-DD
    dayTradeCounts[dayKey] = (dayTradeCounts[dayKey] || 0) + 1;
  }
  const overtradingDays = Object.values(dayTradeCounts).filter((count) => count >= 4).length;

  // Risk consistency (std dev of riskPercent)
  const riskValues = trades.filter((t) => t.riskPercent !== null).map((t) => t.riskPercent || 0);
  const avgRisk = riskValues.length > 0 ? riskValues.reduce((a, b) => a + b, 0) / riskValues.length : 0;
  const riskVariance = riskValues.length > 0
    ? riskValues.reduce((sum, r) => sum + Math.pow(r - avgRisk, 2), 0) / riskValues.length
    : 0;
  const riskStdDev = Math.sqrt(riskVariance);
  const riskConsistency = avgRisk > 0 ? Math.max(0, 100 - (riskStdDev / avgRisk) * 100) : 0;

  const avgTradesPerDay = Object.keys(dayTradeCounts).length > 0
    ? totalTrades / Object.keys(dayTradeCounts).length
    : 0;

  // Generate insights from real data
  const insights: CoachingInsight[] = [];

  if (mostProfitablePair !== "N/A") {
    insights.push({
      id: "profitable-pair",
      category: "Performance",
      title: `Most Profitable Pair: ${mostProfitablePair}`,
      message: `Your best performing pair is ${mostProfitablePair} with a total profit of $${bestProfit.toFixed(2)}. Consider focusing more on this pair to maximize your edge.`,
      type: "positive",
      metric: "Total Profit",
      value: bestProfit,
    });
  }

  if (leastProfitablePair !== "N/A" && leastProfitablePair !== mostProfitablePair) {
    insights.push({
      id: "unprofitable-pair",
      category: "Risk",
      title: `Least Profitable Pair: ${leastProfitablePair}`,
      message: `${leastProfitablePair} has lost $${Math.abs(worstProfit).toFixed(2)}. Consider reducing position size or avoiding this pair until you identify what's going wrong.`,
      type: "warning",
      metric: "Total Loss",
      value: worstProfit,
    });
  }

  if (overtradingDays > 0) {
    insights.push({
      id: "overtrading",
      category: "Discipline",
      title: "Overtrading Detected",
      message: `You had ${overtradingDays} day${overtradingDays > 1 ? "s" : ""} with 4 or more trades. Overtrading often leads to diminished focus and lower quality setups. Consider setting a daily trade limit.`,
      type: "warning",
      metric: "Overtrading Days",
      value: overtradingDays,
    });
  }

  if (avgRR > 0) {
    const rrInsight: CoachingInsight = {
      id: "risk-reward",
      category: "Risk Management",
      title: `Average R:R: ${avgRR.toFixed(2)}:1`,
      message: avgRR >= 2
        ? "Excellent risk-reward ratio. You're letting winners run and cutting losers short. Keep it up!"
        : avgRR >= 1.5
        ? "Good risk-reward ratio. Aim to push it above 2:1 for better long-term profitability."
        : "Your risk-reward ratio is below 1.5:1. Consider holding winning trades longer or tightening your stop losses.",
      type: avgRR >= 1.5 ? "positive" : "warning",
      metric: "Average R:R",
      value: avgRR,
    };
    insights.push(rrInsight);
  }

  if (bestSession !== "N/A" && bestSession !== worstSession) {
    insights.push({
      id: "best-session",
      category: "Timing",
      title: `Best Session: ${bestSession}`,
      message: `You perform best during the ${bestSession} session with $${bestSessionProfit.toFixed(2)} in profit. Consider focusing your trading during this session.`,
      type: "positive",
      metric: "Session Profit",
      value: bestSessionProfit,
    });
  }

  if (riskConsistency > 0) {
    insights.push({
      id: "risk-consistency",
      category: "Risk Management",
      title: "Risk Consistency",
      message: riskConsistency > 80
        ? "You are very consistent with your risk per trade. This is a hallmark of professional trading."
        : riskConsistency > 50
        ? "Your risk per trade varies somewhat. Try to keep your risk consistent to avoid large drawdowns."
        : "Your risk per trade varies significantly. Inconsistent sizing can lead to account volatility. Consider using a fixed risk percentage.",
      type: riskConsistency > 80 ? "positive" : riskConsistency > 50 ? "info" : "warning",
      metric: "Consistency Score",
      value: riskConsistency,
    });
  }

  if (avgTradesPerDay > 3) {
    insights.push({
      id: "trade-frequency",
      category: "Discipline",
      title: "High Trade Frequency",
      message: `You're averaging ${avgTradesPerDay.toFixed(1)} trades per day. Quality over quantity is key in trading. Fewer, higher-conviction trades often yield better results.`,
      type: "info",
      metric: "Avg Trades/Day",
      value: avgTradesPerDay,
    });
  }

  return {
    totalTrades,
    mostProfitablePair,
    leastProfitablePair,
    overtradingDays,
    avgRR,
    winRate,
    riskConsistency,
    bestSession,
    worstSession,
    avgTradesPerDay,
    insights,
  };
}

// ─── Main Component ───

export default function AICoach() {
  const { hasAccess } = useSubscription();
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess = hasAccess("aiCoaching");

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
            <Brain className="h-7 w-7 text-primary" />
            AI Coach
          </h1>
          <p className="mt-1 text-muted-foreground">Personalized coaching from your trade history</p>
        </div>
        <LockedFeature />
      </div>
    );
  }

  const stats = useMemo(() => calculateCoachStats(trades), [trades]);
  const hasEnoughData = trades.length >= 5;

  return (
    <AppLayout>
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            AI Coach
          </h1>
          <p className="mt-1 text-muted-foreground">
            Personalized coaching insights from your actual trading data
          </p>
        </div>
      </div>

      {!hasEnoughData && !loading ? (
        <EmptyState message="Add at least 5 trades to your journal to receive personalized coaching insights based on your actual performance." />
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    {loading ? <Skeleton className="h-6 w-16" /> : (
                      <p className="text-xl font-bold">{stats.winRate.toFixed(1)}%</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg R:R</p>
                    {loading ? <Skeleton className="h-6 w-16" /> : (
                      <p className="text-xl font-bold">{stats.avgRR > 0 ? `${stats.avgRR.toFixed(2)}:1` : "N/A"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Shield className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Consistency</p>
                    {loading ? <Skeleton className="h-6 w-16" /> : (
                      <p className="text-xl font-bold">{stats.riskConsistency > 0 ? `${stats.riskConsistency.toFixed(0)}%` : "N/A"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Trades</p>
                    {loading ? <Skeleton className="h-6 w-16" /> : (
                      <p className="text-xl font-bold">{stats.totalTrades}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pair Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  Most Profitable Pair
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-32" /> : (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg font-mono font-bold px-3 py-1">
                      {stats.mostProfitablePair}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Focus on your edge
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
                  <ArrowDownRight className="h-4 w-4" />
                  Least Profitable Pair
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-32" /> : (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg font-mono font-bold px-3 py-1">
                      {stats.leastProfitablePair}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Review your approach
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Discipline Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Discipline Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm w-40">Overtrading Days</span>
                  <div className="flex-1">
                    {loading ? <Skeleton className="h-2 w-full" /> : (
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(100, stats.overtradingDays * 10)} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-8">{stats.overtradingDays}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm w-40">Avg Trades / Day</span>
                  <div className="flex-1">
                    {loading ? <Skeleton className="h-2 w-full" /> : (
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(100, stats.avgTradesPerDay * 20)} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-8">{stats.avgTradesPerDay.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coaching Insights */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Personalized Insights
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.insights.length > 0 ? (
                  stats.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Continue trading to generate more personalized insights.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
    </AppLayout>
  );
}
