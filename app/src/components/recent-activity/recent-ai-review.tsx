import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/utils"
import type { AIReview } from "@/types"
import { Brain, ThumbsUp, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

interface RecentAIReviewProps {
  reviews: AIReview[]
  loading?: boolean
}

export function RecentAIReview({ reviews, loading }: RecentAIReviewProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Recent AI Review
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/ai-coach">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Trade #{review.tradeId}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {review.feedback}
                  </p>

                  {review.strengths.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <ThumbsUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-500">Strengths</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {review.strengths.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {review.weaknesses.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-amber-500">Areas to Improve</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {review.weaknesses.map((w, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {review.suggestions.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Lightbulb className="h-3 w-3 text-blue-500" />
                        <span className="text-xs font-medium text-blue-500">Suggestions</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {review.suggestions.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDateTime(review.date)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
