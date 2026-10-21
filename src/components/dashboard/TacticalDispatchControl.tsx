import React, { useState } from 'react';
import { ShieldCheck, Truck, Check, AlertTriangle, Radio } from 'lucide-react';
import type { Incident } from '../../shared/types.ts';
import { useToast } from '../ui/Toast.tsx';
import { dataService } from '../../lib/dataService.ts';

interface TacticalDispatchControlProps {
  selectedIncident: Incident | null;
  onDispatchConfirmed?: (incidentId: string, unit: string) => void;
}

export function TacticalDispatchControl({
  selectedIncident,
  onDispatchConfirmed,
}: TacticalDispatchControlProps) {
  const toast = useToast();
  const [sliderValue, setSliderValue] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState('BOAT-R3');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedSuccess, setDeployedSuccess] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const units = [
    { id: 'BOAT-R3', name: '🚤 AQUATIC RESCUE BOAT R-3 (READY)' },
    { id: 'HELO-SAR1', name: '🚁 HELICOPTER SAR-1 (AIRLIFT READY)' },
    { id: 'TRUCK-4WD', name: '🚒 HIGH-WATER 4WD TRUCK 4 (EN ROUTE)' },
    { id: 'DRONE-ALPHA', name: '🛸 SEARCH DRONE ALPHA (AIRBORNE)' },
    { id: 'MEDIC-T2', name: '🚑 SWIFTWATER PARAMEDIC T-2 (STAGED)' },
  ];

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderValue(val);

    if (val >= 98 && selectedIncident && !isDeploying) {
      setIsDeploying(true);
      try {
        // Update incident status to 'confirmed' / in dispatch
        await dataService.updateIncidentStatus({
          incident_id: selectedIncident.id,
          status: 'confirmed',
          verification_reason: `Field resource [${selectedUnit}] deployed via Slide-to-Confirm failsafe.`,
        });

        setDeployedSuccess(true);
        toast.success(
          'Rescue Mission Authorized',
          `Unit [${selectedUnit}] successfully deployed to ${selectedIncident.location_text || selectedIncident.district}.`
        );

        if (onDispatchConfirmed) {
          onDispatchConfirmed(selectedIncident.id, selectedUnit);
        }

        setTimeout(() => {
          setSliderValue(0);
          setDeployedSuccess(false);
          setIsDeploying(false);
        }, 2500);
      } catch (err: any) {
        toast.error('Dispatch Authorization Failed', err.message || 'Unable to update status.');
        setSliderValue(0);
        setIsDeploying(false);
      }
    }
  };

  const handleSliderRelease = () => {
    if (sliderValue < 98) {
      setSliderValue(0);
    }
  };

  if (!selectedIncident) {
    return (
      <div className="surface-z1 border border-[var(--border-subtle)] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[var(--text-secondary)] select-none">
        <div className="flex items-center gap-2 min-w-0">
          <Truck className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300 shrink-0">
            Rescue Team Dispatch:
          </span>
          <span className="font-mono text-xs text-[var(--text-muted)] truncate">
            Tap any incident below to deploy rescue units (boats, helicopters, ambulances)
          </span>
        </div>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--border-subtle)] text-amber-400/80 uppercase shrink-0 self-start sm:self-auto">
          Standby Mode
        </span>
      </div>
    );
  }

  return (
    <div className="relative surface-z2 border-2 border-amber-400/40 rounded-xl p-3 sm:p-3.5 shadow-xl shadow-amber-950/20 space-y-2.5 animate-fade-in select-none">
      <div className="corner-bracket cross-tl"></div>
      <div className="corner-bracket cross-tr"></div>
      <div className="corner-bracket cross-bl"></div>
      <div className="corner-bracket cross-br"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-[var(--border-subtle)]">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="blinker-square"></span>
            <span className="font-mono text-xs text-amber-300 font-bold uppercase tracking-wide">
              Rescue Mission Failsafe HUD
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold uppercase">
              {selectedIncident.priority_tier.toUpperCase()} ({selectedIncident.effective_score}/100)
            </span>
          </div>
          <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] line-clamp-2 leading-snug">
            {selectedIncident.title}
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-mono truncate">
            {selectedIncident.district} • {selectedIncident.location_text || 'Coordinates Verified'}
          </p>
        </div>

        {/* Action Controls & Collapse Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <label htmlFor="unit-select" className="text-xs font-mono text-[var(--text-muted)] font-semibold shrink-0">
              Unit:
            </label>
            <select
              id="unit-select"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              disabled={isDeploying || deployedSuccess}
              className="bg-[var(--surface-1-solid)] border border-amber-400/50 rounded-lg px-2 py-1 text-xs font-mono text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Dispatch Controls' : 'Minimize HUD to scan incident table'}
          >
            {isCollapsed ? 'Expand HUD' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Slide-to-Confirm Emergency Dispatch Slider (Collapsible to keep data table visible) */}
      {!isCollapsed && (
        <div className="space-y-1.5 pt-0.5">
          <div className="slide-track" title="Slide right to 100% to send rescue team. Prevents accidental clicks.">
            <div className="slide-fill" style={{ width: `${sliderValue}%` }}></div>
            <span className="slide-label flex items-center gap-2 px-2 text-center text-xs">
              {deployedSuccess ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-bold animate-pulse">
                  <Check className="w-4 h-4" /> RESCUE UNIT DISPATCHED & LOGGED
                </span>
              ) : isDeploying ? (
                <span className="text-amber-300 font-bold animate-pulse text-xs">
                  TRANSMITTING RESCUE DISPATCH ORDER...
                </span>
              ) : sliderValue > 50 ? (
                <span>RELEASE AT END TO DEPLOY [{selectedUnit}] ➔</span>
              ) : (
                <>
                  <span className="hidden sm:inline">SLIDE RIGHT TO SEND RESCUE TEAM ➔</span>
                  <span className="sm:hidden">SLIDE TO SEND RESCUE ➔</span>
                </>
              )}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              disabled={isDeploying || deployedSuccess}
              className="slide-range"
              aria-label="Slide right to send rescue"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono text-[var(--text-muted)] px-3 pb-1 pt-0.5">
            <span>Failsafe: Accidental click protection</span>
            <span>Audit trail recorded</span>
          </div>
        </div>
      )}
    </div>
  );
}
