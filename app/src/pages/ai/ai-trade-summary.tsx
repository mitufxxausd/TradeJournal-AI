import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  Loader2,
  Calendar,
  BarChart3,
  Zap,
  BookOpen,
  Star,
} from "lucide-react";

// ─── Mock Data ───

const mockSummary = {
  period: "This Week",
  dateRange: "Jul 1 - Jul 8, 2026",
  totalTrades: 14,
  winRate: 64,
  profitLoss: 324.5,
  avgRR: 1.82,
  bestTrade: { pair: "XAUUSD", pnl: 156.0 },
  worstTrade: { pair: "EURUSD", pnl: -45.2 },
  strengths: [
    "Consistent use of technical confluence for entries",
    "Strong risk management with average R:R of 1.82",
    "Excellent patience in waiting for high-quality setups",
    "Good journaling habits improving self-awareness",
  ],
  weaknesses: [
    "Overtrading on Wednesdays (4 trades vs 2 target)",
    "Occasional emotional entries after losses",
    "Missing some optimal exit opportunities",
    "Inconsistent position sizing across pairs",
  ],
  suggestions: [
    "Implement a strict 2-trade daily maximum",
    "Add a 30-minute cooldown after any loss",
    "Review and refine your take-profit strategy",
    "Standardize position sizing with a risk calculator",
  ],
  riskReview: {
    avgRiskPerTrade: 1.4,
    maxRiskPerTrade: 2.8,
    totalRisked: 19.6,
    riskConsistency: 72,
    sharpeRatio: 1.45,
    maxDrawdown: 3.2,
  },
  executionReview: {
    entryQuality: 85,
    exitQuality: 68,
    timingScore: 78,
    disciplineScore: 82,
  },
  lessons: [
    {
      id: "1",
      title: "Quality Over Quantity",
      description: "Your win rate on days with 2 or fewer trades was 80% compared to 50% on days with more. Fewer, more selective trades yield better results.",
      impact: "high" as const,
    },
    {
      id: "2",
      title: "Session Timing Matters",
      description: "London session trades showed a 75% win rate versus 45% during Asian session. Focus on high-volatility periods.",
      impact: "medium" as const,
    },
    {
      id: "3",
      title: "Let Winners Run",
      description: "Your average winning trade reached only 68% of its potential. Consider trailing stops or partial profit-taking to maximize gains.",
      impact: "high" as const,
    },
  ],
};

// ─── Feature Gate ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">AI Trade Summary Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Elite</span> to unlock AI-generated trade summaries with performance insights and actionable lessons.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Score Ring Component ───

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const circumference = 2 * Math.PI * ((size - 8) / 2);
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            className="text-muted/20"
            cx={size / 2}
            cy={size / 2}
            r={(size - 8) / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle
            className={cn(color, "transition-all duration-1000")}
            cx={size / 2}
            cy={size / 2}
            r={(size - 8) / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Main Component ───

export default function AITradeSummary() {
  const { hasAccess, isElite } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const canAccess = hasAccess("aiTradeScore");

  const generateSummary = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsGenerating(false);
    toast.success("AI Trade Summary generated!");
  };

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Trade Summary
          </h1>
          <p className="mt-1 text-muted-foreground">AI-generated trade performance review</p>
        </div>
        <LockedFeature />
      </div>
    );
  }

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
            AI-generated analysis of your trading performance
          </p>
        </div>
        <Button
          onClick={generateSummary}
          disabled={isGenerating}
          className="gap-2 shrink-0"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : "Generate New Summary"}
        </Button>
      </div>

      {/* Period & Quick Stats */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
          <Calendar className="h-3.5 w-3.5" />
          {mockSummary.period}: {mockSummary.dateRange}
        </Badge>
        <Badge className={cn(
          "gap-1 text-sm px-3 py-1",
          mockSummary.profitLoss >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
        )}>
          {mockSummary.profitLoss >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          P&L: ${mockSummary.profitLoss.toFixed(2)}
        </Badge>
        <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
          <Target className="h-3.5 w-3.5" />
          Win Rate: {mockSummary.winRate}%
        </Badge>
        <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
          <BarChart3 className="h-3.5 w-3.5" />
          {mockSummary.totalTrades} Trades
        </Badge>
      </div>

      {/* Performance Scores */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Execution Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-around gap-6 py-4">
            <ScoreRing score={mockSummary.executionReview.entryQuality} label="Entry Quality" />
            <ScoreRing score={mockSummary.executionReview.exitQuality} label="Exit Quality" />
            <ScoreRing score={mockSummary.executionReview.timingScore} label="Timing" />
            <ScoreRing score={mockSummary.executionReview.disciplineScore} label="Discipline" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strengths */}
        <Card className="transition-all hover:shadow-md border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mockSummary.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="transition-all hover:shadow-md border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mockSummary.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0 mt-0.5">
                    <XCircle className="h-3 w-3" />
                  </div>
                  <span className="text-sm">{w}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {mockSummary.suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border bg-card p-4"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Review */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Risk Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Avg Risk/Trade</p>
              <p className="text-2xl font-bold mt-1">{mockSummary.riskReview.avgRiskPerTrade}%</p>
              <Progress value={(mockSummary.riskReview.avgRiskPerTrade / 3) * 100} className="h-1.5 mt-2" />
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Max Risk/Trade</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                mockSummary.riskReview.maxRiskPerTrade > 2 ? "text-amber-500" : "text-green-500"
              )}>
                {mockSummary.riskReview.maxRiskPerTrade}%
              </p>
              <Progress value={(mockSummary.riskReview.maxRiskPerTrade / 3) * 100} className="h-1.5 mt-2" />
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
              <p className="text-2xl font-bold mt-1">{mockSummary.riskReview.sharpeRatio}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
              <p className="text-2xl font-bold mt-1">{mockSummary.riskReview.maxDrawdown}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Lessons */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Key Lessons
        </h2>
        <div className="space-y-4">
          {mockSummary.lessons.map((lesson) => (
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
      </section>

      {/* Best/Worst Trades */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Trade</p>
                <p className="font-semibold">{mockSummary.bestTrade.pair}</p>
                <p className="text-sm font-bold text-green-600">+${mockSummary.bestTrade.pnl.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Worst Trade</p>
                <p className="font-semibold">{mockSummary.worstTrade.pair}</p>
                <p className="text-sm font-bold text-red-600">${mockSummary.worstTrade.pnl.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
