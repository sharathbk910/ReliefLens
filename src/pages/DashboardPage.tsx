import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet } from 'lucide-react';
import { SummaryIndicators } from '../components/dashboard/SummaryIndicators.tsx';
import { IncidentFilters } from '../components/dashboard/IncidentFilters.tsx';
import { IncidentTable } from '../components/dashboard/IncidentTable.tsx';
import { ScoringExplainer } from '../components/dashboard/ScoringExplainer.tsx';
import { DashboardMapPreview } from '../components/dashboard/DashboardMapPreview.tsx';
import { DispatchExportModal } from '../components/dashboard/DispatchExportModal.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useIncidents } from '../hooks/index.ts';

export function DashboardPage() {
  const navigate = useNavigate();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const {
    incidents,
    total,
    page,
    setPage,
    pageSize,
    isLoading,
    filters,
    updateFilters,
    clearFilters,
    districts,
    summary,
  } = useIncidents({ pageSize: 25 });

  const handleIndicatorClick = (id: string) => {
    if (id === 'open') {
      updateFilters({ status: 'new' });
    } else if (id === 'critical') {
      updateFilters({ priorityTier: 'critical' });
    } else if (id === 'uncertainty') {
      updateFilters({ hasUncertainty: true });
    } else if (id === 'duplicates') {
      navigate('/duplicates');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
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
        filters={filters as any}
        onChange={updateFilters}
        onClear={clearFilters}
        districts={districts}
      />

      {/* Incidents Table + Spatial Map Preview (Beside on desktop, stacked on mobile) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4 min-w-0">
          <IncidentTable
            incidents={incidents}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
        <div className="xl:col-span-4 min-w-0 xl:sticky xl:top-4">
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
