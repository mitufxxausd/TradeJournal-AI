import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { StrategyPerformance } from "@/types"
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"

interface StrategyPerformanceChartProps {
  data: StrategyPerformance[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md">
        <p className="text-xs font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.name === "profit" ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function StrategyPerformanceChart({ data, loading }: StrategyPerformanceChartProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Strategy Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="strategy"
              type="category"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="wins" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Wins" />
            <Bar dataKey="losses" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Losses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
