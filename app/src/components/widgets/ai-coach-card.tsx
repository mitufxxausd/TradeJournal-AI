import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react"
import { toast } from "sonner"

interface AICoachCardProps {
  loading?: boolean
}

const insights = [
  {
    type: "strength",
    icon: TrendingUp,
    message: "Your trend following strategy has 72% win rate this month",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    type: "warning",
    icon: AlertTriangle,
    message: "Consider reducing position size during Asian session",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    type: "tip",
    icon: Lightbulb,
    message: "Your best performance is during London-New York overlap",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
]

export function AICoachCard({ loading }: AICoachCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Coach
        </CardTitle>
        <Sparkles className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Personalized insights based on your trading data
        </p>

        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 rounded-lg p-2.5 ${insight.bg}`}
            >
              <insight.icon className={`h-4 w-4 mt-0.5 shrink-0 ${insight.color}`} />
              <span className="text-xs">{insight.message}</span>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => toast.info("AI Coach full analysis - Coming soon!")}
        >
          <Brain className="mr-2 h-4 w-4" />
          Get Full Analysis
        </Button>
      </CardContent>
    </Card>
  )
}
