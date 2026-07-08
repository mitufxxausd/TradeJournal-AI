import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountHealthProps {
  score: number
  loading?: boolean
}

export function AccountHealth({ score, loading }: AccountHealthProps) {
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

  const getStatus = (value: number) => {
    if (value >= 80) return { label: "Excellent", color: "text-emerald-500", icon: TrendingUp }
    if (value >= 60) return { label: "Good", color: "text-blue-500", icon: TrendingUp }
    if (value >= 40) return { label: "Fair", color: "text-amber-500", icon: Minus }
    return { label: "Needs Attention", color: "text-red-500", icon: TrendingDown }
  }

  const status = getStatus(score)
  const StatusIcon = status.icon

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Account Health</CardTitle>
        <Heart className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--chart-1))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 264} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold", status.color)}>{score}%</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <StatusIcon className={cn("h-4 w-4", status.color)} />
            <span className={cn("font-medium", status.color)}>{status.label}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Health Score</span>
            <span className="font-medium">{score}/100</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-xs text-muted-foreground">Drawdown</p>
            <p className="text-sm font-semibold text-emerald-500">5.2%</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-xs text-muted-foreground">Consistency</p>
            <p className="text-sm font-semibold text-blue-500">78%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
