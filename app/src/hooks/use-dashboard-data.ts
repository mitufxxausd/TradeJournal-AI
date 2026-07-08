import { useState, useEffect, useCallback } from "react"
import type {
  DashboardStats,
  MonthlyData,
  WeeklyData,
  DailyData,
  EquityPoint,
  StrategyPerformance,
  SessionPerformance,
  Trade,
  JournalEntry,
  AIReview,
  TradingGoal,
  CalendarDay,
} from "@/types"

// Demo data generator for the dashboard
function generateDemoData() {
  const stats: DashboardStats = {
    totalTrades: 847,
    winningTrades: 512,
    losingTrades: 335,
    winRate: 60.45,
    profitFactor: 1.78,
    averageRR: 1.85,
    netProfit: 24680.5,
    currentBalance: 74680.5,
    largestWin: 3250.0,
    largestLoss: -1850.0,
  }

  const equityData: EquityPoint[] = Array.from({ length: 90 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (90 - i))
    return {
      date: date.toISOString().split("T")[0],
      balance: 50000 + Math.sin(i * 0.1) * 5000 + i * 300 + Math.random() * 2000 - 1000,
    }
  })

  const monthlyData: MonthlyData[] = [
    { month: "Jan", profit: 3200, trades: 72 },
    { month: "Feb", profit: 4100, trades: 68 },
    { month: "Mar", profit: -1200, trades: 85 },
    { month: "Apr", profit: 5800, trades: 90 },
    { month: "May", profit: 3200, trades: 78 },
    { month: "Jun", profit: 4500, trades: 82 },
    { month: "Jul", profit: 2800, trades: 75 },
    { month: "Aug", profit: 5100, trades: 88 },
    { month: "Sep", profit: 1900, trades: 70 },
    { month: "Oct", profit: 3600, trades: 80 },
    { month: "Nov", profit: 4200, trades: 85 },
    { month: "Dec", profit: 2380.5, trades: 74 },
  ]

  const weeklyData: WeeklyData[] = [
    { week: "Week 1", profit: 1200, trades: 18 },
    { week: "Week 2", profit: 850, trades: 15 },
    { week: "Week 3", profit: -400, trades: 20 },
    { week: "Week 4", profit: 2100, trades: 22 },
    { week: "Week 5", profit: 1600, trades: 19 },
    { week: "Week 6", profit: 950, trades: 16 },
    { week: "Week 7", profit: 1800, trades: 21 },
    { week: "Week 8", profit: 1300, trades: 17 },
  ]

  const dailyData: DailyData[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }) + " " + (i + 1),
      profit: Math.random() * 2000 - 500,
      trades: Math.floor(Math.random() * 8) + 1,
    }
  })

  const strategyData: StrategyPerformance[] = [
    { strategy: "Trend Following", wins: 180, losses: 95, profit: 12500 },
    { strategy: "Breakout", wins: 120, losses: 70, profit: 8900 },
    { strategy: "Mean Reversion", wins: 95, losses: 80, profit: 4200 },
    { strategy: "Scalping", wins: 72, losses: 55, profit: 3100 },
    { strategy: "Swing", wins: 45, losses: 35, profit: -4020 },
  ]

  const sessionData: SessionPerformance[] = [
    { session: "London", wins: 210, losses: 120, profit: 15200 },
    { session: "New York", wins: 180, losses: 110, profit: 11800 },
    { session: "Asian", wins: 72, losses: 65, profit: -2320 },
    { session: "Sydney", wins: 50, losses: 40, profit: 0.5 },
  ]

  const recentTrades: Trade[] = [
    {
      id: "1",
      symbol: "EURUSD",
      type: "long",
      entryPrice: 1.085,
      exitPrice: 1.092,
      size: 1.0,
      profit: 700,
      pips: 70,
      strategy: "Trend Following",
      session: "London",
      date: "2026-07-05T10:30:00Z",
      status: "win",
    },
    {
      id: "2",
      symbol: "GBPUSD",
      type: "short",
      entryPrice: 1.274,
      exitPrice: 1.268,
      size: 0.5,
      profit: 300,
      pips: 60,
      strategy: "Breakout",
      session: "New York",
      date: "2026-07-05T14:15:00Z",
      status: "win",
    },
    {
      id: "3",
      symbol: "USDJPY",
      type: "long",
      entryPrice: 161.5,
      exitPrice: 161.2,
      size: 1.0,
      profit: -300,
      pips: -30,
      strategy: "Mean Reversion",
      session: "Asian",
      date: "2026-07-04T22:00:00Z",
      status: "loss",
    },
    {
      id: "4",
      symbol: "AUDUSD",
      type: "short",
      entryPrice: 0.672,
      exitPrice: 0.668,
      size: 0.5,
      profit: 200,
      pips: 40,
      strategy: "Scalping",
      session: "Sydney",
      date: "2026-07-04T18:30:00Z",
      status: "win",
    },
    {
      id: "5",
      symbol: "USDCAD",
      type: "long",
      entryPrice: 1.365,
      exitPrice: 1.363,
      size: 1.0,
      profit: -200,
      pips: -20,
      strategy: "Swing",
      session: "London",
      date: "2026-07-04T08:00:00Z",
      status: "loss",
    },
  ]

  const recentJournal: JournalEntry[] = [
    {
      id: "1",
      title: "Great London session today",
      content: "Followed my plan perfectly and caught a nice trend on EURUSD...",
      date: "2026-07-05T12:00:00Z",
      mood: "confident",
      tags: ["trend-following", "discipline", "london"],
    },
    {
      id: "2",
      title: "Need to work on patience",
      content: "Entered too early on USDJPY before confirmation...",
      date: "2026-07-04T23:00:00Z",
      mood: "reflective",
      tags: ["patience", "improvement"],
    },
    {
      id: "3",
      title: "Breakout strategy working well",
      content: "The new breakout rules are paying off. 3 wins in a row...",
      date: "2026-07-04T16:00:00Z",
      mood: "optimistic",
      tags: ["breakout", "strategy", "wins"],
    },
  ]

  const recentAIReviews: AIReview[] = [
    {
      id: "1",
      tradeId: "1",
      feedback: "Excellent trade execution. You waited for the trend confirmation before entering.",
      strengths: ["Patience", "Good entry timing", "Proper risk management"],
      weaknesses: [],
      suggestions: ["Consider adding to winning positions"],
      date: "2026-07-05T10:35:00Z",
    },
    {
      id: "2",
      tradeId: "3",
      feedback: "This trade lacked proper confirmation. The setup was premature.",
      strengths: ["Good risk sizing"],
      weaknesses: ["Early entry", "No trend confirmation"],
      suggestions: ["Wait for 2 confirmations before entering", "Check higher timeframe alignment"],
      date: "2026-07-04T22:05:00Z",
    },
  ]

  const goals: TradingGoal[] = [
    { id: "1", title: "Monthly Profit Target", target: 5000, current: 2380.5, deadline: "2026-07-31" },
    { id: "2", title: "Win Rate Goal", target: 65, current: 60.45, deadline: "2026-07-31" },
    { id: "3", title: "Risk-Free Trades", target: 100, current: 47, deadline: "2026-07-31" },
  ]

  const calendarData: CalendarDay[] = Array.from({ length: 31 }, (_, i) => {
    const date = new Date(2026, 6, i + 1)
    return {
      date: date.toISOString().split("T")[0],
      profit: Math.random() * 1500 - 300,
      trades: Math.floor(Math.random() * 6),
    }
  })

  return {
    stats,
    equityData,
    monthlyData,
    weeklyData,
    dailyData,
    strategyData,
    sessionData,
    recentTrades,
    recentJournal,
    recentAIReviews,
    goals,
    calendarData,
  }
}

export function useDashboardData() {
  const [data, setData] = useState<ReturnType<typeof generateDemoData> | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))
    setData(generateDemoData())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, loading, refetch: fetchData }
}
