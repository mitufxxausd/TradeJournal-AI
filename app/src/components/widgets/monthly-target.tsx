import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { Target } from "lucide-react"

interface MonthlyTargetProps {
  current: number
  target: number
  loading?: boolean
}

export function MonthlyTarget({ current, target, loading }: MonthlyTargetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const progress = Math.min((current / target) * 100, 100)
  const remaining = target - current

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Monthly Target</CardTitle>
        <Target className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{formatCurrency(current)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(target)}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{progress.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(remaining)} remaining</span>
          <span>{new Date().toLocaleDateString("en-US", { month: "long" })}</span>
        </div>
      </CardContent>
    </Card>
  )
}
