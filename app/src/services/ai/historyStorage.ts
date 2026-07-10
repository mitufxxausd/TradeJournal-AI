/**
 * Screenshot Analysis History Storage
 * Phase 7C: Persistent AI Workspace History
 *
 * Stores every screenshot analysis permanently in localStorage.
 * Provides CRUD operations, filtering, grouping, and statistics.
 */

import type {
  ScreenshotAnalysis,
  AnalysisHistory,
  WorkspaceDashboardStats,
  GroupedAnalyses,
  HistoryGroup,
  HistoryFilters,
} from "./types/screenshot-analysis";

const STORAGE_KEY = "ai_workspace_history";
const DEFAULT_MAX_ITEMS = 100;
const RECENT_DAYS = 7;

export function getHistory(): AnalysisHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { analyses: [], maxItems: DEFAULT_MAX_ITEMS };
    const parsed: AnalysisHistory = JSON.parse(raw);
    return {
      analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
      maxItems: parsed.maxItems || DEFAULT_MAX_ITEMS,
    };
  } catch {
    return { analyses: [], maxItems: DEFAULT_MAX_ITEMS };
  }
}

function saveHistory(history: AnalysisHistory): void {
  try {
    if (history.analyses.length > history.maxItems) {
      history.analyses = history.analyses
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, history.maxItems);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      const reduced = history.analyses
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, Math.floor(history.maxItems * 0.8));
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...history, analyses: reduced })
        );
      } catch {
        const minimal = reduced.slice(0, 10);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...history, analyses: minimal })
        );
      }
    }
  }
}

export function saveAnalysis(
  analysis: Omit<ScreenshotAnalysis, "id" | "timestamp">
): ScreenshotAnalysis {
  const history = getHistory();
  const now = Date.now();
  const fullAnalysis: ScreenshotAnalysis = {
    ...analysis,
    id: `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: now,
  };
  history.analyses.unshift(fullAnalysis);
  saveHistory(history);
  return fullAnalysis;
}

export function updateAnalysis(
  id: string,
  updates: Partial<Omit<ScreenshotAnalysis, "id" | "timestamp">>
): ScreenshotAnalysis | null {
  const history = getHistory();
  const index = history.analyses.findIndex((a) => a.id === id);
  if (index === -1) return null;
  history.analyses[index] = { ...history.analyses[index], ...updates };
  saveHistory(history);
  return history.analyses[index];
}

export function getAnalysis(id: string): ScreenshotAnalysis | null {
  const history = getHistory();
  return history.analyses.find((a) => a.id === id) || null;
}

export function deleteAnalysis(id: string): boolean {
  const history = getHistory();
  const initialLen = history.analyses.length;
  history.analyses = history.analyses.filter((a) => a.id !== id);
  if (history.analyses.length < initialLen) {
    saveHistory(history);
    return true;
  }
  return false;
}

export function duplicateAnalysis(id: string): ScreenshotAnalysis | null {
  const existing = getAnalysis(id);
  if (!existing) return null;
  const { id: _id, timestamp: _ts, ...rest } = existing;
  return saveAnalysis({
    ...rest,
    status: "needs_review",
    reviewStatus: "pending",
    importStatus: "not_imported",
    journalTradeId: null,
    aiAdvice: null,
  });
}

export function getAllAnalyses(): ScreenshotAnalysis[] {
  return getHistory().analyses.sort((a, b) => b.timestamp - a.timestamp);
}

export function filterAnalyses(
  analyses: ScreenshotAnalysis[],
  filters: HistoryFilters
): ScreenshotAnalysis[] {
  return analyses.filter((a) => {
    if (filters.status && a.status !== filters.status) return false;
    if (filters.symbol) {
      const symbol = a.extractedTrade?.symbol || "";
      if (!symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false;
    }
    if (filters.dateFrom && a.timestamp < filters.dateFrom) return false;
    if (filters.dateTo && a.timestamp > filters.dateTo) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchesSymbol = a.extractedTrade?.symbol?.toLowerCase().includes(q);
      const matchesFile = a.fileName.toLowerCase().includes(q);
      const matchesOCR = a.ocrText.toLowerCase().includes(q);
      if (!matchesSymbol && !matchesFile && !matchesOCR) return false;
    }
    return true;
  });
}

export function groupAnalysesByDate(
  analyses: ScreenshotAnalysis[]
): GroupedAnalyses[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 86400000 * 7;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const groups: Record<HistoryGroup, ScreenshotAnalysis[]> = {
    today: [], yesterday: [], this_week: [], this_month: [], older: [],
  };

  for (const analysis of analyses) {
    const ts = analysis.timestamp;
    if (ts >= todayStart) groups.today.push(analysis);
    else if (ts >= yesterdayStart) groups.yesterday.push(analysis);
    else if (ts >= weekStart) groups.this_week.push(analysis);
    else if (ts >= monthStart) groups.this_month.push(analysis);
    else groups.older.push(analysis);
  }

  const result: GroupedAnalyses[] = [];
  if (groups.today.length > 0) result.push({ group: "today", label: "Today", analyses: groups.today });
  if (groups.yesterday.length > 0) result.push({ group: "yesterday", label: "Yesterday", analyses: groups.yesterday });
  if (groups.this_week.length > 0) result.push({ group: "this_week", label: "This Week", analyses: groups.this_week });
  if (groups.this_month.length > 0) result.push({ group: "this_month", label: "This Month", analyses: groups.this_month });
  if (groups.older.length > 0) result.push({ group: "older", label: "Older", analyses: groups.older });
  return result;
}

export function getDashboardStats(): WorkspaceDashboardStats {
  const analyses = getAllAnalyses();
  const totalAnalyses = analyses.length;
  const importedCount = analyses.filter((a) => a.importStatus === "imported").length;
  const pendingReviewCount = analyses.filter(
    (a) => a.status === "needs_review" || a.reviewStatus === "pending"
  ).length;
  const rejectedCount = analyses.filter((a) => a.status === "rejected").length;

  const avgConfidence = totalAnalyses > 0
    ? Math.round(analyses.reduce((sum, a) => sum + (a.extractedTrade?.overallConfidence || 0), 0) / totalAnalyses)
    : 0;

  const avgOCRAccuracy = totalAnalyses > 0
    ? Math.round(analyses.reduce((sum, a) => sum + (a.imageQuality?.expectedOCRAccuracy || 0), 0) / totalAnalyses)
    : 0;

  const symbolCounts: Record<string, number> = {};
  for (const a of analyses) {
    const sym = a.extractedTrade?.symbol;
    if (sym) symbolCounts[sym] = (symbolCounts[sym] || 0) + 1;
  }
  let mostTradedSymbol: string | null = null;
  let maxCount = 0;
  for (const [sym, count] of Object.entries(symbolCounts)) {
    if (count > maxCount) { maxCount = count; mostTradedSymbol = sym; }
  }

  const recentActivity: WorkspaceDashboardStats["recentActivity"] = [];
  const now = new Date();
  for (let i = RECENT_DAYS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    const dayAnalyses = analyses.filter((a) => a.timestamp >= dayStart && a.timestamp < dayEnd);
    recentActivity.push({
      date: d.toISOString().split("T")[0],
      count: dayAnalyses.length,
      imported: dayAnalyses.filter((a) => a.importStatus === "imported").length,
    });
  }

  return { totalAnalyses, importedCount, pendingReviewCount, rejectedCount, averageConfidence: avgConfidence, averageOCRAccuracy: avgOCRAccuracy, mostTradedSymbol, recentActivity };
}

export function markAsImported(analysisId: string, journalTradeId: string): ScreenshotAnalysis | null {
  return updateAnalysis(analysisId, { status: "imported", importStatus: "imported", journalTradeId });
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStorageInfo(): { itemCount: number; estimatedSizeKB: number } {
  const history = getHistory();
  const raw = localStorage.getItem(STORAGE_KEY) || "";
  return { itemCount: history.analyses.length, estimatedSizeKB: Math.round(raw.length / 1024) };
}
