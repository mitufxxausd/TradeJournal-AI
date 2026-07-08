import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTrades } from "@/lib/firestore";
import type { Trade, TradeStats } from "@/types/trade";
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Activity,
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
  Legend,
} from "recharts";

export default function Analytics() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
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

    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    const profits = closedTrades.map((t) => t.profitLoss || 0);
    for (const p of profits) {
      runningTotal += p;
      if (runningTotal > peak) peak = runningTotal;
      const dd = peak - runningTotal;
      if (dd > maxDrawdown) maxDrawdown = dd;
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
      consecutiveWins: 0,
      consecutiveLosses: 0,
      maxDrawdown,
    };
  }, [trades]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { profit: number; trades: number }> = {};
    for (const trade of trades) {
      const month = trade.tradeDate.substring(0, 7);
      if (!grouped[month]) grouped[month] = { profit: 0, trades: 0 };
      grouped[month].profit += trade.profitLoss || 0;
      grouped[month].trades++;
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

  const statCards = [
    {
      title: "Net P&L",
      value: stats.netPnl,
      prefix: "$",
      icon: stats.netPnl >= 0 ? TrendingUp : TrendingDown,
      iconColor: stats.netPnl >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Total Trades",
      value: stats.totalTrades,
      icon: Activity,
      iconColor: "text-blue-500",
    },
    {
      title: "Win Rate",
      value: stats.winRate.toFixed(1) + "%",
      icon: Target,
      iconColor: "text-purple-500",
    },
    {
      title: "Profit Factor",
      value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2),
      icon: BarChart3,
      iconColor: "text-amber-500",
    },
    {
      title: "Gross Profit",
      value: "$" + stats.totalProfit.toLocaleString(),
      icon: DollarSign,
      iconColor: "text-green-500",
    },
    {
      title: "Max Drawdown",
      value: "$" + stats.maxDrawdown.toLocaleString(),
      icon: TrendingDown,
      iconColor: "text-red-500",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Detailed analysis of your trading performance</p>
        </div>

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
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Performance</CardTitle>
              <CardDescription>P&L by month</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorProfit2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tickFormatter={(v) => v.slice(5)} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Profit"]}
                    />
                    <Area type="monotone" dataKey="profit" stroke="#22c55e" fillOpacity={1} fill="url(#colorProfit2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Win/Loss Distribution</CardTitle>
              <CardDescription>Trade outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
