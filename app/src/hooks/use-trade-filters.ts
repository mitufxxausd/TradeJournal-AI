import { useMemo } from "react"
import type { Trade, TradeFilters, TradeSortOption } from "@/types"

function toDate(value: string | Date | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function tradeDateValue(trade: Trade): Date {
  return toDate(trade.tradeDate) ?? toDate(trade.createdAt) ?? new Date(0)
}

function containsQuery(trade: Trade, query: string): boolean {
  const fields = [
    trade.pair,
    trade.symbol,
    trade.strategy,
    trade.session,
    trade.broker,
    trade.market,
    trade.notes,
    trade.journalNotes,
    trade.psychology?.before?.emotion,
    trade.psychology?.after?.emotion,
    ...(trade.tags ?? []),
  ]
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.toLowerCase())
  return fields.some((field) => field.includes(query))
}

function inRange(value: number | undefined, min?: number, max?: number): boolean {
  if (value === undefined) return false
  if (min !== undefined && value < min) return false
  if (max !== undefined && value > max) return false
  return true
}

export interface FilteredTradesResult {
  items: Trade[]
  total: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function applyFiltersAndSort(
  trades: Trade[],
  filters: TradeFilters,
  sortBy: TradeSortOption,
  page: number,
  limit: number
): FilteredTradesResult {
  const query = filters.query?.trim().toLowerCase()

  let items = trades.filter((trade) => {
    if (trade.archived && !filters.status?.includes("breakeven")) {
      // archived trades can still be shown when they match other criteria
    }

    if (query && !containsQuery(trade, query)) return false

    if (filters.dateRange) {
      const tDate = tradeDateValue(trade)
      if (filters.dateRange.from && tDate < filters.dateRange.from) return false
      if (filters.dateRange.to) {
        const toEnd = new Date(filters.dateRange.to)
        toEnd.setHours(23, 59, 59, 999)
        if (tDate > toEnd) return false
      }
    }

    if (filters.status?.length && !filters.status.includes(trade.status)) return false
    if (filters.strategy?.length && !filters.strategy.includes(trade.strategy ?? "")) return false
    if (filters.market?.length && !filters.market.includes(trade.market)) return false
    if (filters.session?.length && !filters.session.includes(trade.session ?? "")) return false

    if (filters.emotion?.length) {
      const emotions = [trade.psychology?.before?.emotion, trade.psychology?.after?.emotion]
        .filter((v): v is string => Boolean(v))
      if (!emotions.some((e) => filters.emotion?.includes(e))) return false
    }

    if (filters.confidence?.length) {
      const conf = trade.psychology?.before?.confidence
      if (conf === undefined || !filters.confidence.includes(conf)) return false
    }

    if (filters.tags?.length) {
      const tags = trade.tags ?? []
      if (!filters.tags.every((tag) => tags.includes(tag))) return false
    }

    if (!inRange(trade.riskPercent, filters.minRisk, filters.maxRisk)) return false
    if (!inRange(trade.profitLoss, filters.minProfit, filters.maxProfit)) return false

    return true
  })

  items = [...items].sort((a, b) => {
    switch (sortBy) {
      case "newest":
      case "mostRecent":
        return (new Date(b.createdAt ?? 0).getTime() || 0) - (new Date(a.createdAt ?? 0).getTime() || 0)
      case "oldest":
        return (new Date(a.createdAt ?? 0).getTime() || 0) - (new Date(b.createdAt ?? 0).getTime() || 0)
      case "highestProfit":
        return (b.profitLoss ?? 0) - (a.profitLoss ?? 0)
      case "lowestProfit":
        return (a.profitLoss ?? 0) - (b.profitLoss ?? 0)
      case "highestRR":
        return (b.rrRatio ?? 0) - (a.rrRatio ?? 0)
      case "lowestRR":
        return (a.rrRatio ?? 0) - (b.rrRatio ?? 0)
      default:
        return 0
    }
  })

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  const pagedItems = items.slice(start, start + limit)

  return {
    items: pagedItems,
    total,
    page: safePage,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  }
}
