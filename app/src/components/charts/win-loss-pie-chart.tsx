import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface WinLossPieChartProps {
  wins: number
  losses: number
  loading?: boolean
}

const COLORS = ["hsl(var(--chart-2))", "hsl(var(--chart-3))"]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-lg font-bold">{formatNumber(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function WinLossPieChart({ wins, losses, loading }: WinLossPieChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
  ]

  const total = wins + losses
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Win/Loss Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-center">
            <p className="text-3xl font-bold text-emerald-500">{winRate}%</p>
            <p className="text-sm text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
