import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { Trade } from "@/types"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

interface RecentTradesProps {
  trades: Trade[]
  loading?: boolean
}

export function RecentTrades({ trades, loading }: RecentTradesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Trades</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/trades">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between rounded-lg p-3 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    trade.status === "win" ? "bg-emerald-500/10" : "bg-red-500/10"
                  )}
                >
                  {trade.status === "win" ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{trade.symbol}</span>
                    <Badge
                      variant={trade.type === "long" ? "default" : "secondary"}
                      className="text-[10px] h-4 px-1"
                    >
                      {trade.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {trade.strategy} • {trade.session}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "font-semibold",
                    trade.profit >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {trade.profit >= 0 ? "+" : ""}
                  {formatCurrency(trade.profit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(trade.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
