import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisciplineScoreProps {
  score: number
  loading?: boolean
}

export function DisciplineScore({ score, loading }: DisciplineScoreProps) {
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

  const getLevel = (value: number) => {
    if (value >= 85) return { label: "Excellent", icon: Award, color: "text-emerald-500" }
    if (value >= 70) return { label: "Good", icon: CheckCircle, color: "text-blue-500" }
    if (value >= 50) return { label: "Developing", icon: AlertCircle, color: "text-amber-500" }
    return { label: "Needs Work", icon: XCircle, color: "text-red-500" }
  }

  const level = getLevel(score)
  const LevelIcon = level.icon

  const rules = [
    { name: "Follow Trading Plan", followed: score >= 80 },
    { name: "Risk Management", followed: score >= 70 },
    { name: "No Revenge Trading", followed: score >= 75 },
    { name: "Journal Consistency", followed: score >= 60 },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Discipline Score</CardTitle>
        <Award className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold">{score}%</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <LevelIcon className={cn("h-4 w-4", level.color)} />
            <p className={cn("text-sm font-medium", level.color)}>{level.label}</p>
          </div>
        </div>

        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.name} className="flex items-center justify-between">
              <span className="text-sm">{rule.name}</span>
              {rule.followed ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
