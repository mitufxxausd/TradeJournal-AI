import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTrades } from "@/lib/firestore";
import type { Trade, TradeStats, MonthlyPerformance } from "@/types/trade";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time trades using Phase 3 subcollection pattern
    const unsubscribe = subscribeToTrades(
      user.uid,
      (items) => {
        setTrades(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading trades:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const stats: TradeStats = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status !== "open");
    const winningTrades = closedTrades.filter((t) => (t.profitLoss || 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.profitLoss || 0) < 0);
    const breakevenTrades = closedTrades.filter((t) => (t.profitLoss || 0) === 0);
    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0));
    const profits = closedTrades.map((t) => t.profitLoss || 0);

    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    for (const p of profits) {
      runningTotal += p;
      if (runningTotal > peak) peak = runningTotal;
      const dd = peak - runningTotal;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    for (const t of closedTrades) {
      if ((t.profitLoss || 0) > 0) {
        consecutiveWins++;
        consecutiveLosses = 0;
        if (consecutiveWins > maxConsecutiveWins) maxConsecutiveWins = consecutiveWins;
      } else if ((t.profitLoss || 0) < 0) {
        consecutiveLosses++;
        consecutiveWins = 0;
        if (consecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = consecutiveLosses;
      }
    }

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalProfit,
      totalLoss,
      netPnl: totalProfit - totalLoss,
      avgProfit: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      avgRr: closedTrades.length > 0
        ? closedTrades.reduce((sum, t) => sum + (t.rrRatio || 0), 0) / closedTrades.length
        : 0,
      bestTrade: profits.length > 0 ? Math.max(...profits) : 0,
      worstTrade: profits.length > 0 ? Math.min(...profits) : 0,
      avgTradeDuration: 0,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      maxDrawdown,
    };
  }, [trades]);

  const monthlyData: MonthlyPerformance[] = useMemo(() => {
    const grouped: Record<string, { profit: number; trades: number; wins: number }> = {};
    for (const trade of trades) {
      const month = trade.tradeDate.substring(0, 7);
      if (!grouped[month]) grouped[month] = { profit: 0, trades: 0, wins: 0 };
      grouped[month].profit += trade.profitLoss || 0;
      grouped[month].trades++;
      if ((trade.profitLoss || 0) > 0) grouped[month].wins++;
    }
    return Object.entries(grouped)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [trades]);

  const winLossData = [
    { name: "Wins", value: stats.winningTrades, color: "#22c55e" },
    { name: "Losses", value: stats.losingTrades, color: "#ef4444" },
    { name: "Breakeven", value: stats.breakevenTrades, color: "#6b7280" },
  ];

  const marketData = useMemo(() => {
    const grouped: Record<string, { trades: number; profit: number }> = {};
    for (const trade of trades) {
      if (!grouped[trade.market]) grouped[trade.market] = { trades: 0, profit: 0 };
      grouped[trade.market].trades++;
      grouped[trade.market].profit += trade.profitLoss || 0;
    }
    return Object.entries(grouped)
      .map(([market, data]) => ({ market, ...data }))
      .sort((a, b) => b.profit - a.profit);
  }, [trades]);

  const statCards = [
    {
      title: "Net P&L",
      value: stats.netPnl,
      prefix: "$",
      icon: stats.netPnl >= 0 ? TrendingUp : TrendingDown,
      iconColor: stats.netPnl >= 0 ? "text-green-500" : "text-red-500",
      trend: `${stats.winRate.toFixed(1)}% win rate`,
    },
    {
      title: "Total Trades",
      value: stats.totalTrades,
      icon: Activity,
      iconColor: "text-blue-500",
      trend: `${stats.winningTrades}W / ${stats.losingTrades}L`,
    },
    {
      title: "Win Rate",
      value: stats.winRate.toFixed(1),
      suffix: "%",
      icon: Target,
      iconColor: "text-purple-500",
      trend: `${stats.consecutiveWins} max streak`,
    },
    {
      title: "Profit Factor",
      value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2),
      icon: Percent,
      iconColor: "text-amber-500",
      trend: `$${stats.avgProfit.toFixed(0)} avg win`,
    },
    {
      title: "Gross Profit",
      value: stats.totalProfit,
      prefix: "$",
      icon: DollarSign,
      iconColor: "text-green-500",
      trend: `Best: $${stats.bestTrade.toFixed(0)}`,
    },
    {
      title: "Gross Loss",
      value: -stats.totalLoss,
      prefix: "$",
      icon: DollarSign,
      iconColor: "text-red-500",
      trend: `Worst: $${stats.worstTrade.toFixed(0)}`,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Welcome back, {userProfile?.displayName?.split(" ")[0] || "Trader"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your trading performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/analytics")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button onClick={() => navigate("/trades/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Trade
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {card.prefix}
                    {typeof card.value === "number" ? card.value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : card.value}
                    {card.suffix}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{card.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equity Curve */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Performance</CardTitle>
              <CardDescription>P&L by month</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => v.slice(5)}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Profit"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No trade data yet</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => navigate("/trades/new")}
                    >
                      Add your first trade
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Win/Loss Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Win/Loss</CardTitle>
              <CardDescription>Trade distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Market Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Market</CardTitle>
            <CardDescription>P&L across different markets</CardDescription>
          </CardHeader>
          <CardContent>
            {marketData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="market" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Profit"]}
                  />
                  <Bar
                    dataKey="profit"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <p>No market data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Trades</CardTitle>
              <CardDescription>Your last 5 trades</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/trades")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {trades.length > 0 ? (
              <div className="space-y-3">
                {trades.slice(0, 5).map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trades/${trade.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        (trade.profitLoss || 0) > 0
                          ? "bg-green-100 text-green-600"
                          : (trade.profitLoss || 0) < 0
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {(trade.profitLoss || 0) > 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (trade.profitLoss || 0) < 0 ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">=</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {trade.pair} ({trade.direction})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trade.strategy} • {trade.timeframe}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${
                        (trade.profitLoss || 0) > 0
                          ? "text-green-600"
                          : (trade.profitLoss || 0) < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}>
                        {trade.profitLoss && trade.profitLoss > 0 ? "+" : ""}
                        ${(trade.profitLoss || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trade.tradeDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No trades recorded yet</p>
                <Button
                  variant="link"
                  onClick={() => navigate("/trades/new")}
                >
                  Add your first trade
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
