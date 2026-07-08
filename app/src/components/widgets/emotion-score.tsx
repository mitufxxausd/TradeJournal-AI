import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Smile, Frown, Meh } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmotionScoreProps {
  score: number
  loading?: boolean
}

export function EmotionScore({ score, loading }: EmotionScoreProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const getMood = (value: number) => {
    if (value >= 75) return { label: "Balanced", icon: Smile, color: "text-emerald-500", bg: "bg-emerald-500/10" }
    if (value >= 50) return { label: "Neutral", icon: Meh, color: "text-amber-500", bg: "bg-amber-500/10" }
    return { label: "Stressed", icon: Frown, color: "text-red-500", bg: "bg-red-500/10" }
  }

  const mood = getMood(score)
  const MoodIcon = mood.icon

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Emotion Score</CardTitle>
        <Smile className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-full", mood.bg)}>
            <MoodIcon className={cn("h-8 w-8", mood.color)} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold">{score}%</p>
          <p className={cn("text-sm font-medium mt-1", mood.color)}>{mood.label}</p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Emotional Control</span>
            <span>{score}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", 
                score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          Based on your journal entries and trading patterns
        </div>
      </CardContent>
    </Card>
  )
}
