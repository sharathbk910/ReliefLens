import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet } from 'lucide-react';
import { SummaryIndicators } from '../components/dashboard/SummaryIndicators.tsx';
import { IncidentFilters } from '../components/dashboard/IncidentFilters.tsx';
import { IncidentTable } from '../components/dashboard/IncidentTable.tsx';
import { ScoringExplainer } from '../components/dashboard/ScoringExplainer.tsx';
import { DashboardMapPreview } from '../components/dashboard/DashboardMapPreview.tsx';
import { DispatchExportModal } from '../components/dashboard/DispatchExportModal.tsx';
import { Button } from '../components/ui/Button.tsx';
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
  const [isExportOpen, setIsExportOpen] = useState(false);

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
    <div className="space-y-4 animate-spatial-enter">
      {/* Operational Header - Immediate Live Data, No Marketing Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-[var(--text-primary)] tracking-tight">
            Incident Coordination Dashboard
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Continuous triage with deterministic multi-factor scoring and spatial cross-referencing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            className="text-xs shrink-0 border-[var(--border-strong)] hover:bg-[var(--border-subtle)]"
          >
            Export Manifest
          </Button>
        </div>
      </div>

      {/* 4 Summary Indicators (Surface-Z1) */}
      <SummaryIndicators
        openIncidents={summary.openIncidents}
        criticalHigh={summary.criticalHigh}
        unresolvedUncertainty={summary.unresolvedUncertainty}
        pendingDuplicates={summary.pendingDuplicates}
        onFilterClick={handleIndicatorClick}
      />

      {/* Scoring Explainer Panel */}
      <ScoringExplainer />

      {/* Filter Toolbar */}
      <IncidentFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        districts={districts}
      />

      {/* Incidents Table + Spatial Map Preview (Beside on desktop, stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-4 min-w-0">
          <IncidentTable
            incidents={incidents}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
        <div className="lg:col-span-4 min-w-0 sticky top-4">
          <DashboardMapPreview incidents={incidents} />
        </div>
      </div>

      {/* Field Dispatch Manifest Export Modal */}
      <DispatchExportModal
        incidents={incidents}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
