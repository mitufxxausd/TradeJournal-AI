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
  Brain,
  Lock,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  Sparkles,
  BarChart3,
  Award,
  Zap,
  Heart,
  Clock,
  Calendar,
  Loader2,
} from "lucide-react";

// ─── Mock Data ───

const mockCoachingAreas = [
  {
    id: "discipline",
    title: "Discipline",
    icon: Target,
    score: 82,
    trend: "up" as const,
    color: "bg-blue-500",
    summary: "Strong discipline this week. You followed your trading plan on 88% of trades.",
    tips: [
      "Continue using your pre-trade checklist",
      "Avoid trading during low-volatility sessions",
      "Stick to your 2-trade daily limit",
    ],
  },
  {
    id: "psychology",
    title: "Psychology",
    icon: Heart,
    score: 68,
    trend: "up" as const,
    color: "bg-purple-500",
    summary: "Improving emotional control. FOMO incidents reduced from 5 to 2 this week.",
    tips: [
      "Practice 5-minute meditation before sessions",
      "Journal your emotional state after each trade",
      "Take breaks after consecutive losses",
    ],
  },
  {
    id: "risk",
    title: "Risk Management",
    icon: Shield,
    score: 75,
    trend: "down" as const,
    color: "bg-amber-500",
    summary: "Risk management needs attention. Two trades exceeded 2% risk limit.",
    tips: [
      "Set hard stop losses before entry",
      "Reduce position size after a losing streak",
      "Never move your stop loss further away",
    ],
  },
  {
    id: "execution",
    title: "Execution",
    icon: Zap,
    score: 90,
    trend: "up" as const,
    color: "bg-green-500",
    summary: "Excellent execution quality. Entry timing and patience are strong points.",
    tips: [
      "Continue waiting for confirmation signals",
      "Your patience at key levels is paying off",
      "Maintain your current entry process",
    ],
  },
];

const mockWeeklyProgress = [
  { day: "Mon", trades: 3, winRate: 67, discipline: 85 },
  { day: "Tue", trades: 2, winRate: 50, discipline: 90 },
  { day: "Wed", trades: 4, winRate: 75, discipline: 70 },
  { day: "Thu", trades: 1, winRate: 100, discipline: 95 },
  { day: "Fri", trades: 3, winRate: 33, discipline: 80 },
  { day: "Sat", trades: 0, winRate: 0, discipline: 100 },
  { day: "Sun", trades: 0, winRate: 0, discipline: 100 },
];

const mockPerformanceTrend = [
  { label: "Week 1", score: 58 },
  { label: "Week 2", score: 62 },
  { label: "Week 3", score: 60 },
  { label: "Week 4", score: 68 },
  { label: "Week 5", score: 72 },
  { label: "Week 6", score: 78 },
  { label: "This Week", score: 79 },
];

const mockRecentFeedback = [
  {
    id: "1",
    type: "positive" as const,
    title: "Excellent Patience",
    message: "You waited for the 4H FVG to form before entering. This is exactly the kind of patience that leads to high-quality setups.",
    date: "Today",
  },
  {
    id: "2",
    type: "warning" as const,
    title: "Risk Warning",
    message: "Your EURUSD trade risked 2.8% of your account. This exceeds your 2% maximum risk rule. Consider reducing position size.",
    date: "Yesterday",
  },
  {
    id: "3",
    type: "info" as const,
    title: "Pattern Recognition",
    message: "You correctly identified a head and shoulders pattern on GBPUSD. Your technical analysis skills are improving.",
    date: "2 days ago",
  },
];

// ─── Feature Gate ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">AI Coach Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Elite</span> to unlock the AI Coach with personalized trading insights and performance analytics.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Coaching Card ───

function CoachingCard({ area }: { area: typeof mockCoachingAreas[0] }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = area.icon;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", area.color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{area.title}</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-bold",
                  area.score >= 80 ? "text-green-500" : area.score >= 60 ? "text-amber-500" : "text-red-500"
                )}>
                  {area.score}
                </span>
                {area.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            <Progress value={area.score} className="h-2 mt-2" />
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{area.summary}</p>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-8 px-2 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "View"} Tips
          <ChevronRight className={cn("ml-1 h-3 w-3 transition-transform", expanded && "rotate-90")} />
        </Button>

        {expanded && (
          <ul className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {area.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───

export default function AICoach() {
  const { hasAccess, isElite } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const canAccess = hasAccess("aiCoaching");

  const generateReport = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsGenerating(false);
    toast.success("Weekly coaching report generated!");
  };

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            AI Coach
          </h1>
          <p className="mt-1 text-muted-foreground">Personalized AI trading coach</p>
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
            <Brain className="h-7 w-7 text-primary" />
            AI Coach
          </h1>
          <p className="mt-1 text-muted-foreground">
            Personalized coaching insights to improve your trading performance
          </p>
        </div>
        <Button
          onClick={generateReport}
          disabled={isGenerating}
          className="gap-2 shrink-0"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : "Generate Weekly Report"}
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/20"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-primary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`79, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold">79</span>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold">Your Trading Performance</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your overall trading score improved by <span className="text-green-500 font-medium">+7 points</span> this week.
                Execution and Discipline are your strongest areas. Focus on Risk Management for further improvement.
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <Badge variant="outline" className="gap-1">
                  <Target className="h-3 w-3" /> Discipline: 82
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Heart className="h-3 w-3" /> Psychology: 68
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" /> Risk: 75
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" /> Execution: 90
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coaching Areas */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Coaching Areas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {mockCoachingAreas.map((area) => (
            <CoachingCard key={area.id} area={area} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Progress */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockWeeklyProgress.map((day) => (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{day.day}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Discipline</span>
                      <span className="font-medium">{day.discipline}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          day.discipline >= 80 ? "bg-green-500" : day.discipline >= 60 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${day.discipline}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-16">
                    <span className="text-xs text-muted-foreground">{day.trades} trades</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48 pt-4">
              {mockPerformanceTrend.map((point, index) => (
                <div key={point.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs font-medium text-muted-foreground mb-1">{point.score}</span>
                    <div
                      className={cn(
                        "w-full max-w-[40px] rounded-t-md transition-all duration-500",
                        index === mockPerformanceTrend.length - 1 ? "bg-primary" : "bg-primary/40"
                      )}
                      style={{ height: `${(point.score / 100) * 140}px` }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs",
                    index === mockPerformanceTrend.length - 1 ? "font-semibold text-primary" : "text-muted-foreground"
                  )}>
                    {point.label.replace(" ", "\n")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent AI Feedback</h2>
        <div className="space-y-3">
          {mockRecentFeedback.map((feedback) => (
            <Card key={feedback.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                    feedback.type === "positive" && "bg-green-100 text-green-600 dark:bg-green-900/30",
                    feedback.type === "warning" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30",
                    feedback.type === "info" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                  )}>
                    {feedback.type === "positive" && <CheckCircle2 className="h-5 w-5" />}
                    {feedback.type === "warning" && <AlertTriangle className="h-5 w-5" />}
                    {feedback.type === "info" && <Lightbulb className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{feedback.title}</h3>
                      <Badge variant="outline" className="text-xs">{feedback.date}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{feedback.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
