import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryIndicators } from '../components/dashboard/SummaryIndicators.tsx';
import { IncidentFilters } from '../components/dashboard/IncidentFilters.tsx';
import { IncidentTable } from '../components/dashboard/IncidentTable.tsx';
import { ScoringExplainer } from '../components/dashboard/ScoringExplainer.tsx';
import { dataService } from '../lib/dataService.ts';
import type {
  Incident,
  IncidentStatus,
  IncidentType,
  PriorityTier,
} from '../shared/types.ts';

export function DashboardPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(true);

  // Summary Metrics
  const [summary, setSummary] = useState({
    openIncidents: 0,
    criticalHigh: 0,
    unresolvedUncertainty: 0,
    pendingDuplicates: 0,
  });

  // Filter State
  const [filters, setFilters] = useState<{
    search: string;
    status: IncidentStatus | 'all';
    incidentType: IncidentType | 'all';
    priorityTier: PriorityTier | 'all';
    district: string | 'all';
    hasUncertainty: boolean;
    sortBy: 'effective_score' | 'last_reported_at';
    sortOrder: 'asc' | 'desc';
  }>({
    search: '',
    status: 'all',
    incidentType: 'all',
    priorityTier: 'all',
    district: 'all',
    hasUncertainty: false,
    sortBy: 'effective_score',
    sortOrder: 'desc',
  });

  const [districts, setDistricts] = useState<string[]>([]);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [incidentRes, summaryRes] = await Promise.all([
        dataService.getIncidents({
          ...filters,
          page,
          pageSize,
        }),
        dataService.getDashboardSummary(),
      ]);

      setIncidents(incidentRes.incidents);
      setTotal(incidentRes.total);
      setSummary(summaryRes);

      // Extract unique districts
      const allIncidents = await dataService.getIncidents({ pageSize: 500 });
      const uniqueDistricts = Array.from(
        new Set(
          allIncidents.incidents
            .map((i) => i.district)
            .filter((d): d is string => Boolean(d))
        )
      ).sort();
      setDistricts(uniqueDistricts);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (updated: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1); // Reset to page 1 on filter change
  };

  const handleClearFilters = () => {
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
  };

  const handleIndicatorClick = (id: string) => {
    if (id === 'open') {
      handleFilterChange({ status: 'new' });
    } else if (id === 'critical') {
      handleFilterChange({ priorityTier: 'critical' });
    } else if (id === 'uncertainty') {
      handleFilterChange({ hasUncertainty: true });
    } else if (id === 'duplicates') {
      navigate('/duplicates');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-white tracking-tight">
            Incident Coordination Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time disaster reports consolidated with explainable priority ranking.
          </p>
        </div>
      </div>

      {/* 4 Compact Summary Indicators (Section 4.1) */}
      <SummaryIndicators
        openIncidents={summary.openIncidents}
        criticalHigh={summary.criticalHigh}
        unresolvedUncertainty={summary.unresolvedUncertainty}
        pendingDuplicates={summary.pendingDuplicates}
        onFilterClick={handleIndicatorClick}
      />

      {/* Scoring Explainer Panel */}
      <ScoringExplainer />

      {/* Compact Incident Filter Toolbar */}
      <IncidentFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        districts={districts}
      />

      {/* Incidents Table */}
      <IncidentTable
        incidents={incidents}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
