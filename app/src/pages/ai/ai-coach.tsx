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
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrades } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/trade";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Shield,
  Lock,
  Sparkles,
} from "lucide-react";

// ─── Types ───

interface CoachInsight {
  id: string;
  category: "strength" | "weakness" | "opportunity" | "risk";
  title: string;
  description: string;
  metric: string;
}

interface CoachStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgRR: number;
  consistency: number;
  discipline: number;
}

// ─── Empty State ───

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Brain className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">AI Coach</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Insight Card ───

function InsightCard({ insight }: { insight: CoachInsight }) {
  const colors = {
    strength: "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
    weakness: "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
    opportunity: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
    risk: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  };

  const icons = {
    strength: TrendingUp,
    weakness: TrendingDown,
    opportunity: Target,
    risk: AlertTriangle,
  };

  const Icon = icons[insight.category];

  return (
    <Card className={cn("border-l-4", colors[insight.category])}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
            <Badge variant="outline" className="mt-2 text-xs">
              {insight.metric}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stats Calculator ───

function calculateCoachStats(trades: Trade[]): CoachStats {
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => (t.profitLoss || 0) > 0);
  const losingTrades = trades.filter((t) => (t.profitLoss || 0) < 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0));
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  const tradesWithRR = trades.filter((t) => t.rrRatio !== null && t.rrRatio !== undefined);
  const avgRR = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + (t.rrRatio || 0), 0) / tradesWithRR.length
    : 0;

  // Consistency: how often the trader sticks to similar R:R
  const rrValues = tradesWithRR.map((t) => t.rrRatio || 0);
  const avgRRValue = rrValues.reduce((a, b) => a + b, 0) / rrValues.length;
  const variance = rrValues.reduce((sum, rr) => sum + Math.pow(rr - avgRRValue, 2), 0) / rrValues.length;
  const consistency = Math.max(0, 100 - variance * 10);

  // Discipline: win rate * consistency
  const discipline = (winRate * consistency) / 100;

  return {
    totalTrades,
    winRate,
    profitFactor,
    avgRR,
    consistency,
    discipline,
  };
}

// ─── Insight Generator ───

function generateInsights(trades: Trade[]): CoachInsight[] {
  const insights: CoachInsight[] = [];
  const stats = calculateCoachStats(trades);

  // Win Rate Analysis
  if (stats.winRate >= 60) {
    insights.push({
      id: "win-rate-strength",
      category: "strength",
      title: "Strong Win Rate",
      description: `Your ${stats.winRate.toFixed(1)}% win rate is above average. You're doing well at picking winning setups.`,
      metric: `${stats.winRate.toFixed(1)}% win rate`,
    });
  } else if (stats.winRate < 40) {
    insights.push({
      id: "win-rate-weakness",
      category: "weakness",
      title: "Low Win Rate",
      description: "Your win rate is below 40%. Consider reviewing your entry criteria and waiting for higher-probability setups.",
      metric: `${stats.winRate.toFixed(1)}% win rate`,
    });
  }

  // Profit Factor
  if (stats.profitFactor >= 2) {
    insights.push({
      id: "profit-factor-strength",
      category: "strength",
      title: "Excellent Profit Factor",
      description: `Your profit factor of ${stats.profitFactor.toFixed(2)} shows you're making significantly more on winners than losers.`,
      metric: `Profit factor: ${stats.profitFactor.toFixed(2)}`,
    });
  } else if (stats.profitFactor < 1) {
    insights.push({
      id: "profit-factor-risk",
      category: "risk",
      title: "Negative Profit Factor",
      description: "You're losing more than you're winning. Focus on cutting losses faster and letting winners run.",
      metric: `Profit factor: ${stats.profitFactor.toFixed(2)}`,
    });
  }

  // R:R Analysis
  if (stats.avgRR >= 2) {
    insights.push({
      id: "rr-strength",
      category: "strength",
      title: "Good Risk Management",
      description: `Your average R:R of ${stats.avgRR.toFixed(2)}:1 shows strong risk management. Keep targeting asymmetric rewards.`,
      metric: `Avg R:R: ${stats.avgRR.toFixed(2)}:1`,
    });
  } else if (stats.avgRR < 1) {
    insights.push({
      id: "rr-opportunity",
      category: "opportunity",
      title: "Improve Risk:Reward Ratio",
      description: "Your average R:R is below 1:1. Try setting wider take profits or tighter stop losses for better asymmetry.",
      metric: `Avg R:R: ${stats.avgRR.toFixed(2)}:1`,
    });
  }

  // Consistency
  if (stats.consistency < 50) {
    insights.push({
      id: "consistency-weakness",
      category: "weakness",
      title: "Inconsistent Position Sizing",
      description: "Your R:R varies significantly between trades. Try to maintain consistent risk per trade.",
      metric: `Consistency: ${stats.consistency.toFixed(0)}%`,
    });
  }

  return insights;
}

// ─── Feature Gate ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">AI Coach Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Elite</span> to unlock personalized AI coaching based on your actual trading data.
      </p>
    </div>
  );
}

// ─── Main Component ───

export default function AICoach() {
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
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
  }, [user]);

  const canAccess = hasAccess("aiCoaching");

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            AI Coach
          </h1>
          <p className="mt-1 text-muted-foreground">Personalized coaching from your trading data</p>
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
          {/* Stats Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
                    <Progress value={stats.winRate} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Profit Factor</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="space-y-2">
                    <div className={cn(
                      "text-2xl font-bold",
                      stats.profitFactor >= 1.5 ? "text-green-600" : stats.profitFactor < 1 ? "text-red-600" : ""
                    )}>
                      {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
                    </div>
                    <Progress value={Math.min(100, stats.profitFactor * 33)} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Average R:R</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="space-y-2">
                    <div className={cn(
                      "text-2xl font-bold",
                      stats.avgRR >= 2 ? "text-green-600" : stats.avgRR < 1 ? "text-red-600" : ""
                    )}>
                      {stats.avgRR.toFixed(2)}:1
                    </div>
                    <Progress value={Math.min(100, stats.avgRR * 33)} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Coaching Insights
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {generateInsights(trades).length > 0 ? (
                  generateInsights(trades).map((insight) => (
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
