import { useEffect, useState, useCallback } from "react"
import { getUserSettings, saveUserSettings } from "@/lib/firestore"
import type { UserSettings } from "@/types"

export function useUserSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const save = useCallback(
    async (next: UserSettings) => {
      if (!userId) return
      setLoading(true)
      try {
        await saveUserSettings(userId, next)
        setSettings(next)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to save settings"))
        throw err
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    if (!userId) {
      setSettings(null)
      return
    }
    let cancelled = false
    setLoading(true)
    getUserSettings(userId)
      .then((s) => {
        if (!cancelled) setSettings(s)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Failed to load settings"))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return { settings, loading, error, save }
}
