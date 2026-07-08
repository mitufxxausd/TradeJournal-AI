import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import type { MonthlyData, WeeklyData, DailyData } from "@/types"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"

interface ProfitChartProps {
  monthlyData: MonthlyData[]
  weeklyData: WeeklyData[]
  dailyData: DailyData[]
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

export function ProfitChart({ monthlyData, weeklyData, dailyData, loading }: ProfitChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const renderChart = (data: Array<{ profit: number }>, dataKey: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={dataKey}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={50}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.profit >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-3))"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profit Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly">{renderChart(monthlyData, "month")}</TabsContent>
          <TabsContent value="weekly">{renderChart(weeklyData, "week")}</TabsContent>
          <TabsContent value="daily">{renderChart(dailyData, "day")}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
