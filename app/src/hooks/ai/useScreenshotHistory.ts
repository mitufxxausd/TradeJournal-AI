/**
 * useScreenshotHistory Hook
 * Phase 7C: Persistent AI Workspace History
 *
 * Manages screenshot analysis history with full CRUD operations.
 * Provides grouped history, dashboard stats, and journal integration.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  ScreenshotAnalysis,
  AnalysisStatus,
  WorkspaceDashboardStats,
  GroupedAnalyses,
  HistoryFilters,
} from "@/services/ai";
import {
  getAllAnalyses,
  saveAnalysis,
  updateAnalysis,
  deleteAnalysis,
  duplicateAnalysis,
  getDashboardStats,
  markAsImported,
  groupAnalysesByDate,
  filterAnalyses,
} from "@/services/ai";

export interface UseScreenshotHistoryReturn {
  analyses: ScreenshotAnalysis[];
  groupedAnalyses: GroupedAnalyses[];
  stats: WorkspaceDashboardStats;
  isLoading: boolean;
  addAnalysis: (analysis: Omit<ScreenshotAnalysis, "id" | "timestamp">) => ScreenshotAnalysis;
  updateAnalysis: (id: string, updates: Partial<Omit<ScreenshotAnalysis, "id" | "timestamp">>) => ScreenshotAnalysis | null;
  deleteAnalysis: (id: string) => boolean;
  duplicateAnalysis: (id: string) => ScreenshotAnalysis | null;
  markImported: (analysisId: string, journalTradeId: string) => ScreenshotAnalysis | null;
  refresh: () => void;
  filteredAnalyses: ScreenshotAnalysis[];
  setFilters: (filters: HistoryFilters) => void;
  clearFilters: () => void;
  filters: HistoryFilters;
}

export function useScreenshotHistory(): UseScreenshotHistoryReturn {
  const [analyses, setAnalyses] = useState<ScreenshotAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFiltersState] = useState<HistoryFilters>({});

  const refresh = useCallback(() => {
    setIsLoading(true);
    setAnalyses(getAllAnalyses());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addAnalysis = useCallback((analysis: Omit<ScreenshotAnalysis, "id" | "timestamp">) => {
    const saved = saveAnalysis(analysis);
    setAnalyses((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<Omit<ScreenshotAnalysis, "id" | "timestamp">>) => {
    const updated = updateAnalysis(id, updates);
    if (updated) setAnalyses((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const handleDelete = useCallback((id: string) => {
    const success = deleteAnalysis(id);
    if (success) setAnalyses((prev) => prev.filter((a) => a.id !== id));
    return success;
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    const duplicated = duplicateAnalysis(id);
    if (duplicated) setAnalyses((prev) => [duplicated, ...prev]);
    return duplicated;
  }, []);

  const handleMarkImported = useCallback((analysisId: string, journalTradeId: string) => {
    const updated = markAsImported(analysisId, journalTradeId);
    if (updated) setAnalyses((prev) => prev.map((a) => (a.id === analysisId ? updated : a)));
    return updated;
  }, []);

  const setFilters = useCallback((newFilters: HistoryFilters) => { setFiltersState(newFilters); }, []);
  const clearFilters = useCallback(() => { setFiltersState({}); }, []);

  const filteredAnalyses = useMemo(() => filterAnalyses(analyses, filters), [analyses, filters]);
  const groupedAnalyses = useMemo(() => groupAnalysesByDate(filteredAnalyses), [filteredAnalyses]);
  const stats = useMemo(() => getDashboardStats(), [analyses]);

  return {
    analyses, groupedAnalyses, stats, isLoading,
    addAnalysis, updateAnalysis: handleUpdate, deleteAnalysis: handleDelete,
    duplicateAnalysis: handleDuplicate, markImported: handleMarkImported,
    refresh, filteredAnalyses, setFilters, clearFilters, filters,
  };
}
