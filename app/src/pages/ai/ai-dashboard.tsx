/**
 * AI Dashboard Page
 * Displays real database statistics only. No mock data, no fabricated insights.
 * All values come from the user's actual trade history.
 */

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
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
  Sparkles,
  Camera,
  Mic,
  Brain,
  ClipboardList,
  CreditCard,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  DollarSign,
  Target,
  Clock,
  Award,
  AlertCircle,
  Lock,
} from "lucide-react";

// ─── Types ───

interface TradeStats {
  totalTrades: number;
  netProfit: number;
  winRate: number;
  avgRR: number;
  avgHoldTime: number;
  bestPair: string;
  worstPair: string;
  currentStreak: number;
  streakType: "win" | "loss" | "none";
  monthlyPerformance: { month: string; profit: number; trades: number }[];
}

// ─── Quick Action Card ───

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  locked?: boolean;
}

function QuickActionCard({ icon: Icon, title, description, href, color, locked }: QuickActionProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        locked && "opacity-60"
      )}
    >
      {locked && (
        <div className="absolute right-3 top-3">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3 flex items-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Open <ArrowRight className="ml-1 h-3 w-3" />
      </div>
    </Link>
  );
}

// ─── Stat Card ───

function StatCard({ title, value, subtitle, icon: Icon, color, loading }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <div className={cn("absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full", color)} />
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Empty State ───

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No Trade Data Available</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Start adding trades to your journal to see AI-powered statistics and insights here.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/trades/new">Add Your First Trade</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Statistics Calculator ───

function calculateStats(trades: Trade[]): TradeStats {
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => (t.profitLoss || 0) > 0);
  const losingTrades = trades.filter((t) => (t.profitLoss || 0) < 0);
  const netProfit = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  // Average R:R
  const tradesWithRR = trades.filter((t) => t.rrRatio !== null && t.rrRatio !== undefined);
  const avgRR = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + (t.rrRatio || 0), 0) / tradesWithRR.length
    : 0;

  // Best/Worst pair
  const pairStats: Record<string, { profit: number; trades: number }> = {};
  for (const trade of trades) {
    if (!pairStats[trade.pair]) {
      pairStats[trade.pair] = { profit: 0, trades: 0 };
    }
    pairStats[trade.pair].profit += trade.profitLoss || 0;
    pairStats[trade.pair].trades += 1;
  }

  let bestPair = "No data";
  let worstPair = "No data";
  let bestProfit = -Infinity;
  let worstProfit = Infinity;

  for (const [pair, stats] of Object.entries(pairStats)) {
    if (stats.profit > bestProfit) {
      bestProfit = stats.profit;
      bestPair = pair;
    }
    if (stats.profit < worstProfit) {
      worstProfit = stats.profit;
      worstPair = pair;
    }
  }

  // Current streak
  const sortedByDate = [...trades].sort((a, b) =>
    (b.tradeDate || b.createdAt).localeCompare(a.tradeDate || a.createdAt)
  );
  let currentStreak = 0;
  let streakType: "win" | "loss" | "none" = "none";
  if (sortedByDate.length > 0) {
    const firstTrade = sortedByDate[0];
    const isWin = (firstTrade.profitLoss || 0) > 0;
    streakType = isWin ? "win" : "loss";
    for (const trade of sortedByDate) {
      const tradeWin = (trade.profitLoss || 0) > 0;
      if (tradeWin === isWin) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Monthly performance
  const monthMap: Record<string, { profit: number; trades: number }> = {};
  for (const trade of trades) {
    const date = trade.tradeDate || trade.createdAt;
    const monthKey = date.substring(0, 7); // YYYY-MM
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { profit: 0, trades: 0 };
    }
    monthMap[monthKey].profit += trade.profitLoss || 0;
    monthMap[monthKey].trades += 1;
  }
  const monthlyPerformance = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      profit: data.profit,
      trades: data.trades,
    }));

  return {
    totalTrades,
    netProfit,
    winRate,
    avgRR,
    avgHoldTime: 0, // Would need entry/exit times to calculate
    bestPair,
    worstPair,
    currentStreak,
    streakType,
    monthlyPerformance,
  };
}

// ─── Main Component ───

export default function AIDashboard() {
  const { user } = useAuth();
  const { tier, hasAccess, isPro, isElite } = useSubscription();
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

  const stats = useMemo(() => calculateStats(trades), [trades]);
  const hasData = trades.length > 0;

  const tierBadge = isElite
    ? { label: "ELITE", className: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0" }
    : isPro
    ? { label: "PRO", className: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-0" }
    : { label: "FREE", className: "" };

  return (
    <AppLayout>
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            AI Workspace
          </h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered tools to analyze, coach, and improve your trading
          </p>
        </div>
        <Badge className={cn("px-3 py-1 text-xs font-bold tracking-wider", tierBadge.className)}>
          {tierBadge.label} PLAN
        </Badge>
      </div>

      {!hasData && !loading ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Trades"
              value={stats.totalTrades}
              subtitle="All time trades"
              icon={BarChart3}
              color="bg-primary/10"
              loading={loading}
            />
            <StatCard
              title="Net Profit"
              value={`$${stats.netProfit.toFixed(2)}`}
              subtitle={stats.netProfit >= 0 ? "All time profit" : "All time loss"}
              icon={DollarSign}
              color={stats.netProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10"}
              loading={loading}
            />
            <StatCard
              title="Win Rate"
              value={`${stats.winRate.toFixed(1)}%`}
              subtitle={`${stats.totalTrades > 0 ? Math.round(stats.winRate * stats.totalTrades / 100) : 0} winning trades`}
              icon={Target}
              color="bg-blue-500/10"
              loading={loading}
            />
            <StatCard
              title="Average R:R"
              value={stats.avgRR > 0 ? `${stats.avgRR.toFixed(2)}:1` : "N/A"}
              subtitle="Risk to reward ratio"
              icon={Award}
              color="bg-purple-500/10"
              loading={loading}
            />
          </div>

          {/* Second Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Best Pair"
              value={stats.bestPair}
              subtitle="Most profitable pair"
              icon={TrendingUp}
              color="bg-green-500/10"
              loading={loading}
            />
            <StatCard
              title="Worst Pair"
              value={stats.worstPair}
              subtitle="Least profitable pair"
              icon={TrendingDown}
              color="bg-red-500/10"
              loading={loading}
            />
            <StatCard
              title="Current Streak"
              value={stats.currentStreak > 0 ? `${stats.currentStreak} ${stats.streakType}` : "None"}
              subtitle="Consecutive results"
              icon={stats.streakType === "win" ? TrendingUp : stats.streakType === "loss" ? TrendingDown : Minus}
              color={stats.streakType === "win" ? "bg-green-500/10" : stats.streakType === "loss" ? "bg-red-500/10" : "bg-muted/50"}
              loading={loading}
            />
            <StatCard
              title="Avg Hold Time"
              value="No data"
              subtitle="Coming soon"
              icon={Clock}
              color="bg-amber-500/10"
              loading={loading}
            />
          </div>

          {/* Monthly Performance */}
          {stats.monthlyPerformance.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Monthly Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.monthlyPerformance.map((month) => (
                    <div key={month.month} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-20 shrink-0">{month.month}</span>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              month.profit >= 0 ? "bg-green-500" : "bg-red-500"
                            )}
                            style={{
                              width: `${Math.min(100, (Math.abs(month.profit) / Math.max(...stats.monthlyPerformance.map((m) => Math.abs(m.profit)))) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className={cn(
                        "text-sm font-medium w-20 text-right",
                        month.profit >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ${month.profit.toFixed(0)}
                      </span>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {month.trades} trades
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            icon={Camera}
            title="Screenshot Analysis"
            description="Upload and analyze trade screenshots"
            href="/ai/screenshot"
            color="bg-blue-500"
            locked={!hasAccess("aiScreenshotAnalysis")}
          />
          <QuickActionCard
            icon={Mic}
            title="Voice Notes"
            description="Record trading notes with transcription"
            href="/ai/voice"
            color="bg-purple-500"
            locked={!hasAccess("voiceNotes")}
          />
          <QuickActionCard
            icon={Brain}
            title="AI Coach"
            description="Get personalized trading coaching"
            href="/ai/coach"
            color="bg-amber-500"
            locked={!hasAccess("aiCoaching")}
          />
          <QuickActionCard
            icon={ClipboardList}
            title="Trade Summary"
            description="Trade performance review"
            href="/ai/summary"
            color="bg-green-500"
            locked={!hasAccess("aiTradeScore")}
          />
        </div>
      </section>

      {/* Upgrade Banner */}
      {!isElite && (
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">Unlock the full power of AI</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to {isPro ? "Elite" : "Pro"} and get access to {isPro ? "AI Coaching, Trade Summary & unlimited analysis" : "Voice Notes, Screenshot Analysis & more"}.
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link to="/ai/subscription">Upgrade Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </AppLayout>
  );
}
