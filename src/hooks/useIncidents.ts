import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../lib/dataService.ts';
import type { Incident, IncidentStatus, IncidentType, PriorityTier } from '../shared/types.ts';

export interface IncidentFiltersState {
  search?: string;
  status?: IncidentStatus | 'all';
  incidentType?: IncidentType | 'all';
  priorityTier?: PriorityTier | 'all';
  district?: string | 'all';
  hasUncertainty?: boolean;
  sortBy?: 'effective_score' | 'last_reported_at';
  sortOrder?: 'asc' | 'desc';
}

export interface UseIncidentsOptions {
  initialPage?: number;
  pageSize?: number;
  autoRefreshInterval?: number; // ms, default 25000
  initialFilters?: IncidentFiltersState;
}

export function useIncidents(options: UseIncidentsOptions = {}) {
  const {
    initialPage = 1,
    pageSize = 10,
    autoRefreshInterval = 25000,
    initialFilters = {
      search: '',
      status: 'all',
      incidentType: 'all',
      priorityTier: 'all',
      district: 'all',
      hasUncertainty: false,
      sortBy: 'effective_score',
      sortOrder: 'desc',
    },
  } = options;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IncidentFiltersState>(initialFilters);
  const [districts, setDistricts] = useState<string[]>([]);
  const [summary, setSummary] = useState({
    openIncidents: 0,
    criticalHigh: 0,
    unresolvedUncertainty: 0,
    pendingDuplicates: 0,
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const [incidentRes, summaryRes, allIncidentsRes] = await Promise.all([
        dataService.getIncidents({
          ...filters,
          page,
          pageSize,
        }),
        dataService.getDashboardSummary(),
        dataService.getIncidents({ pageSize: 500 }),
      ]);

      setIncidents(incidentRes.incidents);
      setTotal(incidentRes.total);
      setSummary(summaryRes);

      const uniqueDistricts = Array.from(
        new Set(
          allIncidentsRes.incidents
            .map((i) => i.district)
            .filter((d): d is string => Boolean(d))
        )
      ).sort();
      setDistricts(uniqueDistricts);
    } catch (err: unknown) {
      console.error('useIncidents fetch error', err);
      const msg = err instanceof Error ? err.message : 'Failed to load incidents data.';
      setError(msg);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [filters, page, pageSize]);

  // Initial fetch and dependency trigger
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization and polling
  useEffect(() => {
    const unsubscribe = dataService.subscribeToIncidents(() => {
      loadData(true);
    });

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (autoRefreshInterval > 0) {
      intervalId = setInterval(() => {
        loadData(true);
      }, autoRefreshInterval);
    }

    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadData, autoRefreshInterval]);

  const updateFilters = useCallback((updated: Partial<IncidentFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      incidentType: 'all',
      priorityTier: 'all',
      district: 'all',
      hasUncertainty: false,
      sortBy: 'effective_score',
      sortOrder: 'desc',
    });
    setPage(1);
  }, []);

  return {
    incidents,
    total,
    page,
    setPage,
    pageSize,
    isLoading,
    error,
    filters,
    updateFilters,
    clearFilters,
    districts,
    summary,
    refresh: () => loadData(false),
  };
}
