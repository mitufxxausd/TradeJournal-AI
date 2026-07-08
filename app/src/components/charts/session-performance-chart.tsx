import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { SessionPerformance } from "@/types"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface SessionPerformanceChartProps {
  data: SessionPerformance[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function SessionPerformanceChart({ data, loading }: SessionPerformanceChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((session) => ({
    session: session.session,
    profit: session.profit,
    fullMark: Math.max(...data.map((s) => Math.abs(s.profit))) * 1.2,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Session Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="session" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Profit"
              dataKey="profit"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
