import { useEffect, useState, useCallback } from "react"
import { getTrade, subscribeToTrades } from "@/lib/firestore"
import type { Trade } from "@/types/trade"

export function useTrade(userId: string | undefined, tradeId: string | undefined) {
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!userId || !tradeId) return
    setLoading(true)
    setError(null)
    try {
      const item = await getTrade(userId, tradeId)
      setTrade(item)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load trade"))
    } finally {
      setLoading(false)
    }
  }, [userId, tradeId])

  useEffect(() => {
    if (!userId || !tradeId) {
      setTrade(null)
      setLoading(false)
      return
    }

    setLoading(true)
    let cancelled = false

    // Subscribe to real-time updates for all trades, then filter for this one
    const unsubscribe = subscribeToTrades(userId, (items) => {
      if (cancelled) return
      const item = items.find((t) => t.id === tradeId)
      if (item) {
        setTrade(item)
      } else {
        setTrade(null)
      }
      setLoading(false)
      setError(null)
    })

    // Also do an immediate fetch
    getTrade(userId, tradeId).then((item) => {
      if (!cancelled && item) {
        setTrade(item)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userId, tradeId])

  return { trade, loading, error, refresh }
}
