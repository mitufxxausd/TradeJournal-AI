import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Gauge } from "lucide-react"
import { cn } from "@/lib/utils"

interface RiskMeterProps {
  score: number
  loading?: boolean
}

export function RiskMeter({ score, loading }: RiskMeterProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const getColor = (value: number) => {
    if (value <= 30) return "text-emerald-500"
    if (value <= 60) return "text-amber-500"
    return "text-red-500"
  }

  const getLabel = (value: number) => {
    if (value <= 30) return "Low Risk"
    if (value <= 60) return "Moderate"
    return "High Risk"
  }

  const rotation = (score / 100) * 180 - 90

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Risk Meter</CardTitle>
        <Gauge className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-28 w-48">
          {/* Gauge background */}
          <svg viewBox="0 0 200 110" className="h-full w-full">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#riskGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 251} 251`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            {/* Needle */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-transform duration-1000"
              style={{
                transformOrigin: "100px 100px",
                transform: `rotate(${rotation}deg)`,
              }}
            />
            <circle cx="100" cy="100" r="6" fill="currentColor" />
          </svg>
        </div>
        <div className="mt-2 text-center">
          <p className={cn("text-2xl font-bold", getColor(score))}>{score}%</p>
          <p className={cn("text-sm font-medium", getColor(score))}>{getLabel(score)}</p>
        </div>
        <div className="mt-3 w-full space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Safe</span>
            <span>Caution</span>
            <span>Danger</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
        </div>
      </CardContent>
    </Card>
  )
}
