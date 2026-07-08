import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Camera,
  Mic,
  Brain,
  ClipboardList,
  CreditCard,
  TrendingUp,
  Zap,
  Lock,
  BarChart3,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Mock Data ───

const mockRecentActivity = [
  { id: "1", type: "screenshot" as const, title: "EURUSD 1H Analysis", time: "2 min ago", status: "completed" as const },
  { id: "2", type: "voice" as const, title: "Trade Review Note", time: "15 min ago", status: "completed" as const },
  { id: "3", type: "coaching" as const, title: "Weekly Coaching Report", time: "1 hour ago", status: "completed" as const },
  { id: "4", type: "summary" as const, title: "XAUUSD Trade Summary", time: "3 hours ago", status: "completed" as const },
];

const mockRecentScreenshots = [
  { id: "1", pair: "EURUSD", timeframe: "1H", confidence: 87, direction: "buy" as const },
  { id: "2", pair: "GBPUSD", timeframe: "4H", confidence: 72, direction: "sell" as const },
  { id: "3", pair: "XAUUSD", timeframe: "15M", confidence: 91, direction: "buy" as const },
];

const mockVoiceNotes = [
  { id: "1", name: "Pre-session Analysis", duration: "3:24", date: "Today" },
  { id: "2", name: "Trade Review - EURUSD", duration: "5:12", date: "Today" },
  { id: "3", name: "Weekly Reflection", duration: "8:45", date: "Yesterday" },
];

const mockCoachingInsights = [
  { id: "1", category: "Discipline", score: 82, trend: "up" as const },
  { id: "2", category: "Psychology", score: 68, trend: "up" as const },
  { id: "3", category: "Risk Management", score: 75, trend: "down" as const },
  { id: "4", category: "Execution", score: 90, trend: "up" as const },
];

// ─── Quick Action Card ───

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  locked?: boolean;
  onClick?: () => void;
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

// ─── Main Component ───

export default function AIDashboard() {
  const { tier, hasAccess, isPro, isElite } = useSubscription();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const freeCredits = isElite ? "Unlimited" : isPro ? "50 remaining" : "3 remaining";
  const creditPercent = isElite ? 100 : isPro ? 70 : 30;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(creditPercent), 300);
    return () => clearTimeout(timer);
  }, [creditPercent]);

  const getTierBadge = () => {
    if (isElite) return { label: "ELITE", variant: "default" as const, className: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0" };
    if (isPro) return { label: "PRO", variant: "default" as const, className: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-0" };
    return { label: "FREE", variant: "secondary" as const, className: "" };
  };

  const tierBadge = getTierBadge();

  return (
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

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-primary/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today&apos;s AI Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">analyses performed</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-amber-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Remaining Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeCredits}</div>
            <div className="mt-2">
              <Progress value={animatedProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-green-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold capitalize">{tier}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isElite ? "All features unlocked" : isPro ? "Most features available" : "Upgrade for more"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-purple-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">AI Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">84%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">pattern detection rate</p>
          </CardContent>
        </Card>
      </div>

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
            description="Record trading notes with AI transcription"
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
            description="AI-generated trade performance review"
            href="/ai/summary"
            color="bg-green-500"
            locked={!hasAccess("aiTradeScore")}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent AI Activity */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent AI Activity
            </CardTitle>
            <Link to="/ai/screenshot" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    activity.type === "screenshot" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                    activity.type === "voice" && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                    activity.type === "coaching" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                    activity.type === "summary" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                  )}>
                    {activity.type === "screenshot" && <Camera className="h-4 w-4" />}
                    {activity.type === "voice" && <Mic className="h-4 w-4" />}
                    {activity.type === "coaching" && <Brain className="h-4 w-4" />}
                    {activity.type === "summary" && <ClipboardList className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Screenshot Analysis */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Recent Screenshot Analysis
            </CardTitle>
            <Link to="/ai/screenshot" className="text-xs text-primary hover:underline">
              Analyze new
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRecentScreenshots.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{s.pair}</span>
                      <Badge variant="outline" className="text-xs">{s.timeframe}</Badge>
                      <Badge className={cn(
                        "text-xs",
                        s.direction === "buy" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      )}>
                        {s.direction.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <div className="flex-1">
                        <Progress value={s.confidence} className="h-1.5" />
                      </div>
                      <span className="text-xs font-medium">{s.confidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Voice Notes */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              Recent Voice Notes
            </CardTitle>
            <Link to="/ai/voice" className="text-xs text-primary hover:underline">
              Record new
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockVoiceNotes.map((note) => (
                <div key={note.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{note.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {note.duration}
                      <span>·</span>
                      {note.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!hasAccess("voiceNotes") && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Upgrade to Pro to use Voice Notes
                <Link to="/ai/subscription" className="ml-auto text-primary font-medium hover:underline">
                  Upgrade
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Coaching Insights */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Coaching Insights
            </CardTitle>
            <Link to="/ai/coach" className="text-xs text-primary hover:underline">
              Full report
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCoachingInsights.map((insight) => (
                <div key={insight.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{insight.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold",
                        insight.score >= 80 ? "text-green-500" : insight.score >= 60 ? "text-amber-500" : "text-red-500"
                      )}>
                        {insight.score}/100
                      </span>
                      <TrendingUp className={cn(
                        "h-3 w-3",
                        insight.trend === "up" ? "text-green-500" : "text-red-500"
                      )} />
                    </div>
                  </div>
                  <Progress
                    value={insight.score}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
            {!hasAccess("aiCoaching") && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Upgrade to Elite for AI Coaching
                <Link to="/ai/subscription" className="ml-auto text-primary font-medium hover:underline">
                  Upgrade
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
  );
}
