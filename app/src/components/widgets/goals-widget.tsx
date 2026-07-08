import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, TrendingUp, Shield } from "lucide-react"
import type { TradingGoal } from "@/types"

interface GoalsWidgetProps {
  goals: TradingGoal[]
  loading?: boolean
}

const goalIcons: Record<string, React.ElementType> = {
  "Monthly Profit Target": TrendingUp,
  "Win Rate Goal": Target,
  "Risk-Free Trades": Shield,
}

export function GoalsWidget({ goals, loading }: GoalsWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {goals.map((goal) => {
          const Icon = goalIcons[goal.title] || Target
          const progress = Math.min((goal.current / goal.target) * 100, 100)

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{goal.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {goal.title === "Monthly Profit Target"
                    ? `$${goal.current.toLocaleString()}`
                    : goal.current.toFixed(1)}
                </span>
                <span>
                  {goal.title === "Monthly Profit Target"
                    ? `$${goal.target.toLocaleString()}`
                    : goal.target}
                  </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
