/**
 * Firestore Trade Service — Phase 3 Subcollection Pattern
 *
 * All trades are stored under: users/{userId}/trades
 *
 * This is the canonical service for all trade CRUD operations.
 * All pages MUST use this service — do NOT query Firestore directly.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Trade, TradeInput, UserSettings, TradeChecklistItem, TradeScreenshot } from "@/types/trade"

const DEFAULT_PAGE_LIMIT = 50

/* ─────────────────────── helpers ─────────────────────── */

function getUserTradesCollection(userId: string) {
  return collection(db, "users", userId, "trades")
}

function getUserSettingsDocRef(userId: string) {
  return doc(db, "users", userId, "settings", "app")
}

function timestampToString(value: unknown): string | undefined {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }
  if (typeof value === "string") {
    return value
  }
  return undefined
}

/* ─────────────────────── trade normalizer ─────────────────────── */

export function normalizeTrade(id: string, data: Record<string, unknown>): Trade {
  return {
    ...(data as Record<string, unknown>),
    id,
    createdAt:
      timestampToString(data.createdAt) ??
      (typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString()),
    updatedAt:
      timestampToString(data.updatedAt) ??
      (typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString()),
  } as Trade
}

/* ─────────────────────── defaults ─────────────────────── */

export function getDefaultChecklist(): TradeChecklistItem[] {
  return [
    { id: "confirmation", label: "Waited for confirmation", checked: false },
    { id: "risk-limit", label: "Risk below limit", checked: false },
    { id: "trend", label: "Trend followed", checked: false },
    { id: "news", label: "News checked", checked: false },
    { id: "entry-plan", label: "Entry according to plan", checked: false },
  ]
}

function deriveStatus(trade: TradeInput): Trade["status"] {
  if (trade.profitLoss === undefined || trade.profitLoss === null || trade.profitLoss === 0)
    return "breakeven"
  return trade.profitLoss > 0 ? "win" : "loss"
}

/* ─────────────────────── CRUD operations ─────────────────────── */

export async function createTrade(
  userId: string,
  input: Omit<TradeInput, "userId"> & { screenshots?: TradeScreenshot[] }
): Promise<Trade> {
  const now = serverTimestamp()
  const status = input.status ?? deriveStatus(input as TradeInput)
  const data = {
    ...input,
    userId,
    status,
    checklist: input.checklist ?? getDefaultChecklist(),
    screenshots: input.screenshots ?? [],
    createdAt: now,
    updatedAt: now,
  }
  const docRef = await addDoc(getUserTradesCollection(userId), data)
  const snap = await getDoc(docRef)
  return normalizeTrade(docRef.id, snap.data() as Record<string, unknown>)
}

export async function updateTrade(
  userId: string,
  tradeId: string,
  input: Partial<TradeInput> & { screenshots?: TradeScreenshot[] }
): Promise<Trade> {
  const ref = doc(db, "users", userId, "trades", tradeId)
  const status = input.profitLoss !== undefined ? deriveStatus(input as TradeInput) : undefined
  const data: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  }
  if (status !== undefined) {
    data.status = status
  }
  await updateDoc(ref, data)
  const snap = await getDoc(ref)
  return normalizeTrade(tradeId, snap.data() as Record<string, unknown>)
}

export async function deleteTrade(userId: string, tradeId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "trades", tradeId))
}

export async function getTrade(userId: string, tradeId: string): Promise<Trade | null> {
  const snap = await getDoc(doc(db, "users", userId, "trades", tradeId))
  if (!snap.exists()) return null
  return normalizeTrade(snap.id, snap.data() as Record<string, unknown>)
}

/* ─────────────────────── real-time & bulk ─────────────────────── */

export function subscribeToTrades(
  userId: string,
  callback: (trades: Trade[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    getUserTradesCollection(userId),
    orderBy("createdAt", "desc")
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const trades = snapshot.docs.map((d) =>
        normalizeTrade(d.id, d.data() as Record<string, unknown>)
      )
      callback(trades)
    },
    (error) => {
      onError?.(error)
    }
  )
}

export async function fetchTrades(userId: string): Promise<Trade[]> {
  const snapshot = await getDocs(
    query(getUserTradesCollection(userId), orderBy("createdAt", "desc"))
  )
  return snapshot.docs.map((d) => normalizeTrade(d.id, d.data() as Record<string, unknown>))
}

export async function duplicateTrade(userId: string, tradeId: string): Promise<Trade> {
  const original = await getTrade(userId, tradeId)
  if (!original) throw new Error("Trade not found")
  const { id, createdAt, updatedAt, ...rest } = original
  void id
  void createdAt
  void updatedAt
  const data: TradeInput = {
    ...rest,
    notes: rest.notes
      ? `${rest.notes}\n\n(Duplicated from trade ${id})`
      : `(Duplicated from trade ${id})`,
    isFavorite: false,
    isPinned: false,
    isArchived: false,
  }
  return createTrade(userId, data)
}

/* ─────────────────────── flags ─────────────────────── */

export async function toggleFavorite(
  userId: string,
  tradeId: string,
  current: boolean
): Promise<void> {
  const ref = doc(db, "users", userId, "trades", tradeId)
  await updateDoc(ref, { isFavorite: !current, updatedAt: serverTimestamp() })
}

export async function togglePin(
  userId: string,
  tradeId: string,
  current: boolean
): Promise<void> {
  const ref = doc(db, "users", userId, "trades", tradeId)
  await updateDoc(ref, { isPinned: !current, updatedAt: serverTimestamp() })
}

export async function toggleArchive(
  userId: string,
  tradeId: string,
  current: boolean
): Promise<void> {
  const ref = doc(db, "users", userId, "trades", tradeId)
  await updateDoc(ref, { isArchived: !current, updatedAt: serverTimestamp() })
}

export async function updateTradeFlags(
  userId: string,
  tradeId: string,
  flags: { isFavorite?: boolean; isPinned?: boolean; isArchived?: boolean }
): Promise<void> {
  const ref = doc(db, "users", userId, "trades", tradeId)
  await updateDoc(ref, { ...flags, updatedAt: serverTimestamp() })
}

/* ─────────────────────── batch operations ─────────────────────── */

export async function batchDeleteTrades(userId: string, ids: string[]): Promise<void> {
  const batch = writeBatch(db)
  for (const tradeId of ids) {
    batch.delete(doc(db, "users", userId, "trades", tradeId))
  }
  await batch.commit()
}

/* ─────────────────────── filtered queries ─────────────────────── */

export async function fetchFilteredTrades(
  userId: string,
  filters: {
    search?: string
    market?: string
    direction?: string
    status?: string
    session?: string
    dateFrom?: string
    dateTo?: string
    strategy?: string
    tags?: string[]
    minProfit?: number | null
    maxProfit?: number | null
    minRisk?: number | null
    maxRisk?: number | null
    archived?: boolean | null
  },
  sort: { field: string; direction: "asc" | "desc" } = { field: "createdAt", direction: "desc" }
): Promise<Trade[]> {
  const constraints = [orderBy(sort.field, sort.direction)]
  const q = query(getUserTradesCollection(userId), ...constraints)
  const snapshot = await getDocs(q)
  let trades = snapshot.docs.map((d) => normalizeTrade(d.id, d.data() as Record<string, unknown>))

  // Apply filters client-side (subcollection queries don't need composite indexes)
  if (filters.search) {
    const search = filters.search.toLowerCase()
    trades = trades.filter(
      (t) =>
        t.pair.toLowerCase().includes(search) ||
        (t.strategy || "").toLowerCase().includes(search) ||
        (t.broker || "").toLowerCase().includes(search) ||
        (t.notes || "").toLowerCase().includes(search) ||
        t.tags.some((tag: string) => tag.toLowerCase().includes(search))
    )
  }

  if (filters.market && filters.market !== "all") {
    trades = trades.filter((t) => t.market === filters.market)
  }
  if (filters.direction && filters.direction !== "all") {
    trades = trades.filter((t) => t.direction === filters.direction)
  }
  if (filters.status && filters.status !== "all") {
    trades = trades.filter((t) => t.status === filters.status)
  }
  if (filters.session && filters.session !== "all") {
    trades = trades.filter((t) => t.session === filters.session)
  }
  if (filters.dateFrom) {
    trades = trades.filter((t) => t.tradeDate >= filters.dateFrom!)
  }
  if (filters.dateTo) {
    trades = trades.filter((t) => t.tradeDate <= filters.dateTo!)
  }
  if (filters.strategy) {
    const s = filters.strategy.toLowerCase()
    trades = trades.filter((t) => (t.strategy || "").toLowerCase().includes(s))
  }
  if (filters.tags && filters.tags.length > 0) {
    trades = trades.filter((t) => filters.tags!.some((tag) => t.tags.includes(tag)))
  }
  if (filters.minProfit !== null && filters.minProfit !== undefined) {
    trades = trades.filter((t) => (t.profitLoss || 0) >= filters.minProfit!)
  }
  if (filters.maxProfit !== null && filters.maxProfit !== undefined) {
    trades = trades.filter((t) => (t.profitLoss || 0) <= filters.maxProfit!)
  }
  if (filters.minRisk !== null && filters.minRisk !== undefined) {
    trades = trades.filter((t) => (t.riskPercent || 0) >= filters.minRisk!)
  }
  if (filters.maxRisk !== null && filters.maxRisk !== undefined) {
    trades = trades.filter((t) => (t.riskPercent || 0) <= filters.maxRisk!)
  }
  if (filters.archived !== null && filters.archived !== undefined) {
    trades = trades.filter((t) => t.isArchived === filters.archived)
  }

  return trades
}

/* ─────────────────────── user settings ─────────────────────── */

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const snap = await getDoc(getUserSettingsDocRef(userId))
  if (!snap.exists()) return null
  return snap.data() as UserSettings
}

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
  await setDoc(getUserSettingsDocRef(userId), settings, { merge: true })
}
