import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Crosshair, Loader2 } from 'lucide-react';
import { SummaryIndicators } from '../components/dashboard/SummaryIndicators.tsx';
import { IncidentFilters } from '../components/dashboard/IncidentFilters.tsx';
import { IncidentTable } from '../components/dashboard/IncidentTable.tsx';
import { ScoringExplainer } from '../components/dashboard/ScoringExplainer.tsx';
import { DashboardMapPreview } from '../components/dashboard/DashboardMapPreview.tsx';
import { DispatchExportModal } from '../components/dashboard/DispatchExportModal.tsx';
import { TacticalDispatchControl } from '../components/dashboard/TacticalDispatchControl.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useIncidents } from '../hooks/index.ts';
import { useToast } from '../components/ui/Toast.tsx';
import { dataService } from '../lib/dataService.ts';
import type { Incident } from '../shared/types.ts';

export function DashboardPage() {
  const navigate = useNavigate();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
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
    refresh,
  } = useIncidents({ pageSize: 25 });

  useEffect(() => {
    if (incidents.length > 0) {
      if (!selectedIncident || !incidents.some((inc) => inc.id === selectedIncident.id)) {
        const topCritical = incidents.find((inc) => inc.priority_tier === 'critical') || incidents[0];
        setSelectedIncident(topCritical);
      }
    } else {
      setSelectedIncident(null);
    }
  }, [incidents, selectedIncident]);

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
      {/* Crisis Reassurance & Guidance Hero Banner */}
      <div className="corner-cross bg-gradient-to-r from-[#171813] via-[#1b1d16] to-[#141510] border border-[#2d3024] p-4 sm:p-5 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(235,252,114,0.06),_transparent_70%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="blinker-square" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#EBFC72] font-semibold">
                DISASTER COORDINATION PROTOCOL ACTIVE
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                // ZERO BLACK-BOX AI
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold font-heading text-white tracking-tight">
              TRAPPED IN A DISASTER? WE COORDINATE FAST, TRANSPARENT RESCUE.
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Immediate distress triage for vulnerable, remote, and flood-trapped citizens. Deterministic 4-factor scoring ensures life-or-death dispatches are transparent, fast, and auditable.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/report')}
              className="px-4 py-2 rounded-lg bg-[#EBFC72] hover:bg-[#d8e860] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
            >
              <span>🚨</span> SUBMIT EMERGENCY REPORT
            </button>
            <button
              onClick={handleSyncToMyLocation}
              disabled={isSyncingLocation}
              className="px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-teal-500/30 text-teal-300 font-mono text-xs transition-colors flex items-center gap-1.5"
            >
              {isSyncingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-teal-400" />
              )}
              <span>{isSyncingLocation ? 'SYNCING GPS...' : 'SYNC TO MY AREA'}</span>
            </button>
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

      {/* Tactical Dispatch Control HUD (Interactive Slide-to-Confirm Failsafe) */}
      <TacticalDispatchControl
        selectedIncident={selectedIncident}
        onDispatchConfirmed={() => {
          refresh();
        }}
      />

      {/* Filter Toolbar */}
      <IncidentFilters
        filters={filters as any}
        onChange={updateFilters}
        onClear={clearFilters}
        districts={districts}
      />

      {/* Incidents Table + Spatial Map Preview (Side-by-side on xl+ displays, stacked on mobile/tablet) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-7 2xl:col-span-8 space-y-4 min-w-0 w-full">
          <IncidentTable
            incidents={incidents}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setPage(p)}
            selectedIncidentId={selectedIncident?.id}
            onSelectIncident={(incident) => setSelectedIncident(incident)}
          />
        </div>
        <div className="xl:col-span-5 2xl:col-span-4 min-w-0 w-full xl:sticky xl:top-4">
          <DashboardMapPreview incidents={incidents} isLoading={isLoading} />
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
