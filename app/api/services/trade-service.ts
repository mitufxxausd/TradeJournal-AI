import { adminDb } from "../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface Trade {
  id: string;
  uid: string;
  asset: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  status: "open" | "closed";
  pnl?: number | null;
  pnlPercent?: number | null;
  strategy?: string;
  notes?: string;
  createdAt: Date;
  closedAt?: Date | null;
}

export interface CreateTradeInput {
  asset: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy?: string;
  notes?: string;
}

export interface UpdateTradeInput {
  exitPrice?: number;
  status?: "open" | "closed";
  notes?: string;
  strategy?: string;
}

function docToTrade(doc: FirebaseFirestore.DocumentSnapshot): Trade {
  const data = doc.data()!;
  return {
    id: doc.id,
    uid: data.uid,
    asset: data.asset,
    type: data.type,
    entryPrice: data.entryPrice,
    exitPrice: data.exitPrice ?? null,
    quantity: data.quantity,
    stopLoss: data.stopLoss ?? null,
    takeProfit: data.takeProfit ?? null,
    status: data.status,
    pnl: data.pnl ?? null,
    pnlPercent: data.pnlPercent ?? null,
    strategy: data.strategy ?? "",
    notes: data.notes ?? "",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    closedAt: data.closedAt?.toDate() ?? null,
  };
}

export async function createTrade(uid: string, input: CreateTradeInput): Promise<Trade> {
  const docRef = adminDb.collection("trades").doc();
  const now = FieldValue.serverTimestamp();

  await docRef.set({
    uid,
    asset: input.asset,
    type: input.type,
    entryPrice: input.entryPrice,
    quantity: input.quantity,
    stopLoss: input.stopLoss ?? null,
    takeProfit: input.takeProfit ?? null,
    status: "open",
    strategy: input.strategy ?? "",
    notes: input.notes ?? "",
    createdAt: now,
  });

  const snap = await docRef.get();
  return docToTrade(snap);
}

export async function getTradesByUser(uid: string, limit = 50): Promise<Trade[]> {
  const snaps = await adminDb
    .collection("trades")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snaps.docs.map(docToTrade);
}

export async function getTradeById(tradeId: string): Promise<Trade | null> {
  const snap = await adminDb.collection("trades").doc(tradeId).get();
  if (!snap.exists) return null;
  return docToTrade(snap);
}

export async function updateTrade(
  tradeId: string,
  uid: string,
  input: UpdateTradeInput
): Promise<Trade | null> {
  const docRef = adminDb.collection("trades").doc(tradeId);
  const snap = await docRef.get();

  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.uid !== uid) return null;

  const updates: Record<string, unknown> = {};

  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.strategy !== undefined) updates.strategy = input.strategy;

  if (input.exitPrice !== undefined && input.status === "closed") {
    updates.exitPrice = input.exitPrice;
    updates.status = "closed";
    updates.closedAt = FieldValue.serverTimestamp();

    const entryPrice = data.entryPrice as number;
    const qty = data.quantity as number;
    const type = data.type as "BUY" | "SELL";

    let pnl = 0;
    if (type === "BUY") {
      pnl = (input.exitPrice - entryPrice) * qty;
    } else {
      pnl = (entryPrice - input.exitPrice) * qty;
    }
    updates.pnl = Math.round(pnl * 100) / 100;
    updates.pnlPercent = Math.round((pnl / (entryPrice * qty)) * 10000) / 100;
  }

  await docRef.update(updates);
  const updated = await docRef.get();
  return docToTrade(updated);
}

export async function deleteTrade(tradeId: string, uid: string): Promise<boolean> {
  const docRef = adminDb.collection("trades").doc(tradeId);
  const snap = await docRef.get();

  if (!snap.exists) return false;
  if (snap.data()!.uid !== uid) return false;

  await docRef.delete();
  return true;
}

export async function getTradeStats(uid: string): Promise<{
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  totalPnl: number;
  winRate: number;
  avgReturn: number;
  bestTrade: number;
  worstTrade: number;
}> {
  const snaps = await adminDb
    .collection("trades")
    .where("uid", "==", uid)
    .get();

  const trades = snaps.docs.map((d) => d.data());
  const totalTrades = trades.length;
  const openTrades = trades.filter((t) => t.status === "open").length;
  const closedTrades = trades.filter((t) => t.status === "closed").length;

  const closedWithPnl = trades.filter(
    (t) => t.status === "closed" && typeof t.pnl === "number"
  );
  const totalPnl = closedWithPnl.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const wins = closedWithPnl.filter((t) => (t.pnl || 0) > 0).length;
  const winRate = closedWithPnl.length > 0 ? (wins / closedWithPnl.length) * 100 : 0;
  const avgReturn =
    closedWithPnl.length > 0
      ? closedWithPnl.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / closedWithPnl.length
      : 0;

  const pnls = closedWithPnl.map((t) => t.pnl || 0);

  return {
    totalTrades,
    openTrades,
    closedTrades,
    totalPnl: Math.round(totalPnl * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    avgReturn: Math.round(avgReturn * 100) / 100,
    bestTrade: pnls.length > 0 ? Math.round(Math.max(...pnls) * 100) / 100 : 0,
    worstTrade: pnls.length > 0 ? Math.round(Math.min(...pnls) * 100) / 100 : 0,
  };
}
