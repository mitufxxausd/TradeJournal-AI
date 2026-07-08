import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Percent,
  DollarSign,
  Wallet,
  Trophy,
  AlertTriangle,
  Activity,
} from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  type: "currency" | "percentage" | "number"
  trend?: number
  icon: string
  loading?: boolean
}

const iconMap: Record<string, React.ElementType> = {
  trades: BarChart3,
  wins: Trophy,
  losses: AlertTriangle,
  winRate: Percent,
  profitFactor: Activity,
  averageRR: Target,
  netProfit: DollarSign,
  balance: Wallet,
  largestWin: TrendingUp,
  largestLoss: TrendingDown,
}

export function StatCard({ title, value, type, trend, icon, loading }: StatCardProps) {
  const Icon = iconMap[icon] || BarChart3

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  const formattedValue =
    type === "currency"
      ? formatCurrency(value)
      : type === "percentage"
        ? formatPercentage(value)
        : formatNumber(value)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {trend !== undefined && (
          <Badge
            variant={trend >= 0 ? "success" : "destructive"}
            className="mt-1"
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
