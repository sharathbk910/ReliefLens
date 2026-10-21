import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Crosshair, Loader2, Mic } from 'lucide-react';
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
    allIncidents,
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
    <div className="space-y-3.5 sm:space-y-4 animate-fade-in">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="blinker-square" />
            <h1 className="text-base sm:text-lg md:text-xl font-bold font-heading text-white tracking-tight">
              Incident Command Center
            </h1>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#EBFC72]/15 text-[#EBFC72] border border-[#EBFC72]/30 shrink-0">
              Live Triage
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono mt-0.5 leading-snug">
            Deterministic 4-factor scoring • Fast and auditable emergency response
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-voice-modal'))}
            className="flex-1 sm:flex-none justify-center px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Open Multilingual Voice Emergency Assistant"
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Voice SOS</span>
          </button>
          <button
            type="button"
            onClick={handleSyncToMyLocation}
            disabled={isSyncingLocation}
            className="flex-1 sm:flex-none justify-center px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 font-mono text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Anchor simulated incidents around your current location"
          >
            {isSyncingLocation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span className="hidden sm:inline">{isSyncingLocation ? 'SYNCING GPS...' : 'SYNC TO MY AREA'}</span>
            <span className="sm:hidden">{isSyncingLocation ? 'SYNCING...' : 'SYNC GPS'}</span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            className="flex-1 sm:flex-none justify-center text-xs shrink-0 border-[var(--border-strong)] hover:bg-[var(--border-subtle)]"
          >
            Export Manifest
          </Button>
        </div>
      </div>

      {/* Live Tactical Response Telemetry Strip */}
      <div className="surface-z1 px-3 sm:px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono border border-[var(--border-subtle)] bg-[#12130f]/90">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">LIVE TELEMETRY</span>
          </div>
          <span className="text-[var(--text-muted)]">•</span>
          <span className="text-[var(--text-secondary)]">24/7 HUMAN RESCUE COORDINATION</span>
          <span className="text-[var(--text-muted)] hidden md:inline">•</span>
          <span className="text-amber-300 font-semibold hidden md:inline">SAFETY FLOOR (45 PTS)</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--text-muted)]">
          <span>RULESET: v1.0.0</span>
          <span>•</span>
          <span className="text-[#EBFC72] font-semibold">FAILSAFE ACTIVE</span>
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

      {/* Scoring Explainer & Filter Toolbar */}
      <div className="space-y-2">
        <IncidentFilters
          filters={filters as any}
          onChange={updateFilters}
          onClear={clearFilters}
          districts={districts}
        />
        <ScoringExplainer />
      </div>

      {/* Incidents Table + Spatial Map Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-7 2xl:col-span-8 space-y-3 min-w-0 w-full">
          {/* Tactical Dispatch Control HUD (appears when an incident is targeted) */}
          <TacticalDispatchControl
            selectedIncident={selectedIncident}
            onDispatchConfirmed={() => {
              refresh();
            }}
          />

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
          <DashboardMapPreview
            incidents={incidents}
            allIncidents={allIncidents}
            isLoading={isLoading}
          />
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
