import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { CalendarDay } from "@/types"

interface TradingCalendarProps {
  data: CalendarDay[]
  loading?: boolean
}

export function TradingCalendar({ data, loading }: TradingCalendarProps) {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const getDayData = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return data.find((d) => d.date === dateStr)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{monthName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayNames.map((day) => (
            <div key={day} className="text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayData = getDayData(day)
            const isToday = day === today.getDate()
            const hasProfit = dayData && dayData.profit !== 0
            const isProfit = dayData && dayData.profit > 0

            return (
              <div
                key={day}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-md text-xs cursor-default transition-colors",
                  isToday && "ring-2 ring-primary font-bold",
                  hasProfit && isProfit && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
                  hasProfit && !isProfit && "bg-red-500/20 text-red-700 dark:text-red-300",
                  !hasProfit && !isToday && "hover:bg-muted"
                )}
              >
                <span>{day}</span>
                {dayData && dayData.trades > 0 && (
                  <span className="text-[9px] text-muted-foreground">{dayData.trades}t</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
            <span>Profit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500/60" />
            <span>Loss</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
