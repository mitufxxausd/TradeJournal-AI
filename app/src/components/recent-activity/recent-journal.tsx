import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import type { JournalEntry } from "@/types"
import { BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

interface RecentJournalProps {
  entries: JournalEntry[]
  loading?: boolean
}

const moodColors: Record<string, string> = {
  confident: "bg-blue-500/10 text-blue-500",
  reflective: "bg-purple-500/10 text-purple-500",
  optimistic: "bg-emerald-500/10 text-emerald-500",
  frustrated: "bg-red-500/10 text-red-500",
  neutral: "bg-gray-500/10 text-gray-500",
}

export function RecentJournal({ entries, loading }: RecentJournalProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Recent Journal</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/journal">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{entry.title}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1 shrink-0 ${moodColors[entry.mood] || ""}`}
                  >
                    {entry.mood}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {entry.content}
                </p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(entry.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
