import type { QueryDocumentSnapshot, QueryConstraint } from "firebase/firestore";
import {
  db,
  auth,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch,
  limit,
  startAfter,
} from "@/lib/firebase";
import type { Trade, TradeFilters, TradeSort } from "@/types/trade";

const TRADES_COLLECTION = "trades";

function getCurrentUserId(): string {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.uid;
}

export async function createTrade(tradeData: Omit<Trade, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Trade> {
  const userId = getCurrentUserId();
  const id = doc(collection(db, TRADES_COLLECTION)).id;
  const now = new Date().toISOString();

  const trade: Trade = {
    id,
    userId,
    ...tradeData,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, TRADES_COLLECTION, id), trade);
  return trade;
}

export async function updateTrade(id: string, updates: Partial<Trade>): Promise<void> {
  const userId = getCurrentUserId();
  const tradeRef = doc(db, TRADES_COLLECTION, id);
  const snap = await getDoc(tradeRef);
  if (!snap.exists() || snap.data().userId !== userId) {
    throw new Error("Trade not found or unauthorized");
  }
  await updateDoc(tradeRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTrade(id: string): Promise<void> {
  const userId = getCurrentUserId();
  const tradeRef = doc(db, TRADES_COLLECTION, id);
  const snap = await getDoc(tradeRef);
  if (!snap.exists() || snap.data().userId !== userId) {
    throw new Error("Trade not found or unauthorized");
  }
  await deleteDoc(tradeRef);
}

export async function getTrade(id: string): Promise<Trade | null> {
  const snap = await getDoc(doc(db, TRADES_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Trade;
}

export async function getUserTrades(
  filters?: TradeFilters,
  sort?: TradeSort,
  pageSize?: number,
  lastDoc?: QueryDocumentSnapshot,
): Promise<{ trades: Trade[]; lastDoc: QueryDocumentSnapshot | null }> {
  const userId = getCurrentUserId();
  const constraints: QueryConstraint[] = [where("userId", "==", userId)];

  if (filters) {
    if (filters.market && filters.market !== "all") {
      constraints.push(where("market", "==", filters.market));
    }
    if (filters.direction && filters.direction !== "all") {
      constraints.push(where("direction", "==", filters.direction));
    }
    if (filters.status && filters.status !== "all") {
      constraints.push(where("status", "==", filters.status));
    }
    if (filters.session && filters.session !== "all") {
      constraints.push(where("session", "==", filters.session));
    }
    if (filters.broker) {
      constraints.push(where("broker", "==", filters.broker));
    }
  }

  const sortField = sort?.field || "tradeDate";
  const sortDir = sort?.direction || "desc";
  constraints.push(orderBy(sortField, sortDir));

  if (pageSize) {
    constraints.push(limit(pageSize));
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, TRADES_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let trades = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Trade));

  // Client-side filtering for complex filters
  if (filters) {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      trades = trades.filter((t) =>
        t.pair.toLowerCase().includes(search) ||
        t.strategy.toLowerCase().includes(search) ||
        t.broker.toLowerCase().includes(search) ||
        t.notes.toLowerCase().includes(search) ||
        t.tags.some((tag: string) => tag.toLowerCase().includes(search))
      );
    }
    if (filters.dateRange.from) {
      trades = trades.filter((t) => t.tradeDate >= filters.dateRange.from!);
    }
    if (filters.dateRange.to) {
      trades = trades.filter((t) => t.tradeDate <= filters.dateRange.to!);
    }
    if (filters.strategy) {
      trades = trades.filter((t) => t.strategy.toLowerCase().includes(filters.strategy.toLowerCase()));
    }
    if (filters.tags.length > 0) {
      trades = trades.filter((t) => filters.tags.some((tag: string) => t.tags.includes(tag)));
    }
    if (filters.minProfit !== null) {
      trades = trades.filter((t) => (t.profitLoss || 0) >= filters.minProfit!);
    }
    if (filters.maxProfit !== null) {
      trades = trades.filter((t) => (t.profitLoss || 0) <= filters.maxProfit!);
    }
    if (filters.minRisk !== null) {
      trades = trades.filter((t) => (t.riskPercent || 0) >= filters.minRisk!);
    }
    if (filters.maxRisk !== null) {
      trades = trades.filter((t) => (t.riskPercent || 0) <= filters.maxRisk!);
    }
  }

  return {
    trades,
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
}

export async function toggleFavorite(id: string, current: boolean): Promise<void> {
  await updateTrade(id, { isFavorite: !current });
}

export async function togglePin(id: string, current: boolean): Promise<void> {
  await updateTrade(id, { isPinned: !current });
}

export async function toggleArchive(id: string, current: boolean): Promise<void> {
  await updateTrade(id, { isArchived: !current });
}

export async function duplicateTrade(trade: Trade): Promise<Trade> {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = trade;
  void _id;
  void _createdAt;
  void _updatedAt;
  return createTrade({
    ...data,
    notes: `${data.notes}\n\n[Duplicated from trade ${_id}]`,
    isFavorite: false,
    isPinned: false,
  });
}

export async function batchDeleteTrades(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.delete(doc(db, TRADES_COLLECTION, id));
  }
  await batch.commit();
}
