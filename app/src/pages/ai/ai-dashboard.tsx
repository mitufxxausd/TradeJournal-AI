/**
 * AI Dashboard
 *
 * Central hub for all AI features:
 * - Trade analysis & insights
 * - Screenshot analysis workspace stats (Phase 7C)
 * - Chart analysis
 * - Voice notes transcription
 * - AI coaching
 * - Subscription status
 */

import { useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import { useAI } from "@/hooks/ai";
import { useScreenshotHistory } from "@/hooks/ai";
import { cn } from "@/lib/utils";
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
  ScanText,
  Gauge,
  History,
} from "lucide-react";

// ─── Main Component ───

export default function AIDashboard() {
  const { hasAccess } = useSubscription();
  const { status, stats } = useAI();

  const canAccessAI = hasAccess("aiScreenshotAnalysis");

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            AI Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">
            AI-powered insights and analysis for your trading
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Trades"
              value={stats.totalTrades}
              icon={<ClipboardList className="h-4 w-4" />}
            />
            <StatCard
              title="Win Rate"
              value={`${stats.winRate}%`}
              icon={stats.winRate >= 50 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
              trend={stats.winRate >= 50 ? "positive" : "negative"}
            />
            <StatCard
              title="Avg R:R"
              value={stats.averageRiskReward.toFixed(1)}
              icon={<Target className="h-4 w-4" />}
            />
            <StatCard
              title="Sessions"
              value={stats.totalSessions}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
        )}

        {/* AI Workspace Stats (Phase 7C) */}
        {canAccessAI && stats && (
          <>
            <WorkspaceStatsSection />

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
                              className={cn("h-full rounded-full transition-all", month.profit >= 0 ? "bg-green-500" : "bg-red-500")}
                              style={{ width: `${Math.min(100, (Math.abs(month.profit) / Math.max(...stats.monthlyPerformance.map((m) => Math.abs(m.profit)))) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className={cn("text-sm font-medium w-20 text-right", month.profit >= 0 ? "text-green-600" : "text-red-600")}>
                          ${month.profit.toFixed(0)}
                        </span>
                        <span className="text-xs text-muted-foreground w-16 text-right">{month.trades} trades</span>
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title="Screenshot Analysis"
              description="Upload trading screenshots for OCR extraction"
              icon={<Camera className="h-5 w-5" />}
              href="#/ai/screenshot"
              locked={!canAccessAI}
            />
            <ActionCard
              title="Voice Notes"
              description="Record and transcribe trading voice memos"
              icon={<Mic className="h-5 w-5" />}
              href="#/ai/voice"
              locked={false}
            />
            <ActionCard
              title="AI Coaching"
              description="Get personalized trading coaching"
              icon={<Brain className="h-5 w-5" />}
              href="#/ai/coach"
              locked={false}
            />
            <ActionCard
              title="Subscription"
              description="Manage your AI features subscription"
              icon={<CreditCard className="h-5 w-5" />}
              href="#/ai/subscription"
              locked={false}
            />
          </div>
        </section>

        {/* Subscription Status */}
        <SubscriptionStatus />
      </div>
    </AppLayout>
  );
}

// ─── Workspace Stats Section ───

function WorkspaceStatsSection() {
  const history = useScreenshotHistory();
  const stats = history.stats;

  if (stats.totalAnalyses === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ScanText className="h-4 w-4 text-primary" />
          Screenshot Analysis Workspace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Analyses</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.importedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Imported</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pendingReviewCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Review</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Rejected</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              Avg Confidence
            </span>
            <span className="text-sm font-bold">{stats.averageConfidence}%</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ScanText className="h-3 w-3" />
              Avg OCR Accuracy
            </span>
            <span className="text-sm font-bold">{stats.averageOCRAccuracy}%</span>
          </div>
        </div>

        {stats.mostTradedSymbol && (
          <div className="flex items-center justify-between p-2 rounded bg-muted/30 mb-4">
            <span className="text-xs text-muted-foreground">Most Traded Symbol</span>
            <Badge variant="outline" className="font-mono text-xs">{stats.mostTradedSymbol}</Badge>
          </div>
        )}

        {stats.recentActivity.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Activity (7 days)</p>
            <div className="space-y-1.5">
              {stats.recentActivity.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">
                    {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (day.count / Math.max(1, ...stats.recentActivity.map((d) => d.count))) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium w-8 text-right">{day.count}</span>
                    {day.imported > 0 && <Badge className="text-[10px] h-4 px-1 bg-green-500 text-white">{day.imported} imported</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Stat Card ───

function StatCard({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend?: "positive" | "negative" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{title}</p>
          <div className={cn("text-muted-foreground", trend === "positive" && "text-green-500", trend === "negative" && "text-red-500")}>
            {icon}
          </div>
        </div>
        <p className={cn("text-2xl font-bold mt-1", trend === "positive" && "text-green-600", trend === "negative" && "text-red-600")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Action Card ───

function ActionCard({ title, description, icon, href, locked }: { title: string; description: string; icon: React.ReactNode; href: string; locked: boolean }) {
  return (
    <Card className={cn("transition-all hover:shadow-md", locked && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{title}</h3>
              {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <a href={href}>
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Subscription Status ───

function SubscriptionStatus() {
  const { subscription } = useSubscription();

  if (!subscription) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
            {subscription.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {subscription.plan} plan
          </span>
          {subscription.status === "active" && subscription.currentPeriodEnd && (
            <span className="text-xs text-muted-foreground ml-auto">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
