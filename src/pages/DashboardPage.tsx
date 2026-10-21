import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Crosshair, Loader2 } from 'lucide-react';
import { SummaryIndicators } from '../components/dashboard/SummaryIndicators.tsx';
import { IncidentFilters } from '../components/dashboard/IncidentFilters.tsx';
import { IncidentTable } from '../components/dashboard/IncidentTable.tsx';
import { ScoringExplainer } from '../components/dashboard/ScoringExplainer.tsx';
import { DashboardMapPreview } from '../components/dashboard/DashboardMapPreview.tsx';
import { DispatchExportModal } from '../components/dashboard/DispatchExportModal.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useIncidents } from '../hooks/index.ts';
import { useToast } from '../components/ui/Toast.tsx';
import { dataService } from '../lib/dataService.ts';

export function DashboardPage() {
  const navigate = useNavigate();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const toast = useToast();

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

  const handleSyncToMyLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation Unavailable', 'Your browser does not support automatic geolocation.');
      return;
    }
    setIsSyncingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        localStorage.setItem('relieflens_user_lat', latitude.toString());
        localStorage.setItem('relieflens_user_lng', longitude.toString());
        localStorage.setItem('relieflens_user_accuracy', Math.round(accuracy).toString());
        dataService.anchorToUserLocation(latitude, longitude);
        setIsSyncingLocation(false);
        toast.success(
          'Reports Synced to Your Area',
          `Incidents have been anchored around your current position (${latitude.toFixed(4)}, ${longitude.toFixed(4)}).`
        );
      },
      (err) => {
        setIsSyncingLocation(false);
        if (err.code === 1) {
          toast.error(
            'Location Access Denied',
            'Please allow location permission in your browser address bar to sync reports to your area.'
          );
        } else {
          toast.error('Location Error', err.message || 'Unable to retrieve your current location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
            onClick={handleSyncToMyLocation}
            disabled={isSyncingLocation}
            leftIcon={
              isSyncingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-teal-400" />
              )
            }
            className="text-xs shrink-0 border-teal-500/40 text-teal-300 hover:bg-teal-950/30 hover:border-teal-400"
            title="Relocate registered reports to your current area"
          >
            {isSyncingLocation ? 'Syncing...' : 'Sync to My Location'}
          </Button>
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

      {/* Incidents Table + Spatial Map Preview (Full responsive layout, side-by-side on 2xl+ displays) */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-5 items-start">
        <div className="2xl:col-span-8 space-y-4 min-w-0 w-full">
          <IncidentTable
            incidents={incidents}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
          />
        </div>
        <div className="2xl:col-span-4 min-w-0 w-full 2xl:sticky 2xl:top-4">
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
