import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, CopyCheck, ArrowRight, ShieldCheck, Target, ChevronRight } from 'lucide-react';
import type { Incident } from '../../shared/types.ts';
import { calculateHaversineMeters } from '../../shared/duplicate.ts';
import {
  PriorityBadge,
  StatusBadge,
  VerificationBadge,
  UncertaintyBadge,
} from '../ui/Badge.tsx';

interface IncidentTableProps {
  incidents: Incident[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
}

export function IncidentTable({
  incidents,
  isLoading = false,
  page,
  pageSize,
  total,
  onPageChange,
  selectedIncidentId,
  onSelectIncident,
}: IncidentTableProps) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / pageSize);

  const userLocation = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const lat = localStorage.getItem('relieflens_user_lat');
      const lng = localStorage.getItem('relieflens_user_lng');
      if (lat && lng) {
        return { lat: parseFloat(lat), lng: parseFloat(lng) };
      }
    } catch (_) {}
    return null;
  }, []);

  const getDistanceText = (lat?: number | null, lng?: number | null) => {
    if (
      !userLocation ||
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      return null;
    }
    const meters = calculateHaversineMeters(userLocation.lat, userLocation.lng, lat, lng);
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) {
      const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `${mins}m ago`;
    }
    if (diffHours < 24) {
      return `${Math.round(diffHours)}h ago`;
    }
    return `${Math.round(diffHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="surface-z1 p-8 text-center text-[var(--text-muted)] animate-pulse">
        <p className="text-sm font-medium">Loading operational incidents...</p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="surface-z1 p-10 text-center text-[var(--text-muted)]">
        <div className="w-10 h-10 rounded-full bg-[var(--border-subtle)] flex items-center justify-center mx-auto mb-3 text-[var(--text-secondary)]">
          <Target className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Incidents Found</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
          No records match your active search and filter criteria. Try adjusting or clearing filters.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-z1 rounded-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col shadow-sm">
      {/* 1. Mobile Stacked Cards (< 768px - Section G) */}
      <div className="md:hidden divide-y divide-[var(--border-subtle)]">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            onClick={() => navigate(`/incidents/${incident.id}`)}
            className="p-3.5 hover:bg-[var(--border-subtle)] transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <PriorityBadge tier={incident.priority_tier} score={incident.effective_score} />
              <StatusBadge status={incident.status} />
            </div>

            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                {incident.title}
              </h4>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" strokeWidth={1.5} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{incident.district || incident.location_text || 'No Location'}</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {getDistanceText(incident.latitude, incident.longitude) && (
                  <span className="text-[10px] text-teal-400 font-mono font-medium">
                    📍 {getDistanceText(incident.latitude, incident.longitude)}
                  </span>
                )}
                <span className="flex items-center gap-1 tabular-nums font-mono text-[10px]">
                  <Clock className="w-3 h-3 text-[var(--text-muted)]" strokeWidth={1.5} />
                  {formatTimeAgo(incident.last_reported_at)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Desktop & Tablet Table (>= 768px - Fixed Layout, No Unintended Sliding or Overlapping) */}
      <div className="hidden md:block table-scroll-container">
        <table className="w-full text-left text-xs border-collapse table-fixed min-w-[1150px]">
          <colgroup>
            <col className="w-[150px]" />
            <col className="w-[280px]" />
            <col className="w-[180px]" />
            <col className="w-[90px]" />
            <col className="w-[140px]" />
            <col className="w-[110px]" />
            <col className="w-[150px]" />
            <col className="w-[50px]" />
          </colgroup>
          <thead>
            <tr className="bg-[var(--surface-1)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium select-none">
              <th className="py-3 px-3.5 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">Priority & Score</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">Incident Details</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">District / Location</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">Reports</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">Verification</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">Status</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">Uncertainty</th>
              <th className="py-3 px-2 text-center whitespace-nowrap text-[11px] font-mono uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
            {incidents.map((incident) => {
              const hasFloorApplied = incident.score_breakdown?.floor_applied;
              const hasOverride = incident.score_override !== null;
              const isSelected = selectedIncidentId === incident.id;

              return (
                <tr
                  key={incident.id}
                  onClick={() => {
                    if (onSelectIncident) {
                      onSelectIncident(incident);
                    } else {
                      navigate(`/incidents/${incident.id}`);
                    }
                  }}
                  className={`transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-[#EBFC72]/10 hover:bg-[#EBFC72]/15 shadow-[inset_3px_0_0_0_#EBFC72]'
                      : 'hover:bg-[var(--surface-2-solid)]'
                  }`}
                >
                  {/* Priority & Score */}
                  <td className="py-3 px-3.5 align-top whitespace-nowrap overflow-hidden">
                    <div className="flex flex-col gap-1 items-start whitespace-nowrap">
                      <PriorityBadge
                        tier={incident.priority_tier}
                        score={incident.effective_score}
                      />
                      {hasFloorApplied && (
                        <span className="text-[10px] text-amber-400 font-mono whitespace-nowrap">
                          Floor Adjusted (45)
                        </span>
                      )}
                      {hasOverride && (
                        <span className="text-[10px] text-teal-400 font-mono whitespace-nowrap">
                          Manual Override
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#EBFC72] font-bold">
                          ● TARGETED IN HUD
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Type */}
                  <td className="py-3 px-3.5 align-top overflow-hidden">
                    <div className="font-semibold text-[var(--text-primary)] group-hover:text-teal-300 transition-colors truncate">
                      {incident.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)]">
                      <span className="capitalize font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2-solid)] text-teal-300 border border-teal-500/20 text-[10px] whitespace-nowrap shrink-0">
                        {incident.incident_type}
                      </span>
                      <span className="flex items-center gap-1 tabular-nums text-[var(--text-muted)] whitespace-nowrap truncate">
                        <Clock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                        {formatTimeAgo(incident.last_reported_at)}
                      </span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-3.5 align-top overflow-hidden">
                    <div className="flex items-start gap-1 text-[var(--text-primary)]">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="truncate w-full">
                        <div className="flex items-center justify-between gap-1 truncate">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {incident.district || 'Unassigned District'}
                          </p>
                          {getDistanceText(incident.latitude, incident.longitude) && (
                            <span className="text-[10px] text-teal-400 font-mono font-medium shrink-0">
                              📍 {getDistanceText(incident.latitude, incident.longitude)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          {incident.location_text || 'No text location'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Report Count */}
                  <td className="py-3 px-3.5 align-top text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--border-subtle)] text-[var(--text-primary)] font-mono font-medium tabular-nums whitespace-nowrap">
                      <span>{incident.report_count}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        ({incident.distinct_channel_count} ch)
                      </span>
                    </div>
                  </td>

                  {/* Verification Level */}
                  <td className="py-3 px-3.5 align-top whitespace-nowrap">
                    <VerificationBadge level={incident.verification_level} />
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3.5 align-top whitespace-nowrap">
                    <StatusBadge status={incident.status} />
                  </td>

                  {/* Uncertainty Flags */}
                  <td className="py-3 px-3.5 align-top whitespace-nowrap">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {incident.uncertainty_flags && incident.uncertainty_flags.length > 0 ? (
                        incident.uncertainty_flags.map((flag) => (
                          <UncertaintyBadge key={flag} flag={flag} />
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-500 flex items-center gap-1 whitespace-nowrap">
                          <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                          Verified
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action Link (Navigate to Incident Details) */}
                  <td className="py-3 px-2 align-top text-center whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/incidents/${incident.id}`);
                      }}
                      className="p-1.5 rounded hover:bg-white/10 text-[var(--text-muted)] group-hover:text-teal-400 transition-colors"
                      title="Open full incident record"
                    >
                      <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
        <div className="tabular-nums">
          Showing{' '}
          <strong className="text-[var(--text-primary)]">
            {total > 0 ? (page - 1) * pageSize + 1 : 0}
          </strong>{' '}
          to{' '}
          <strong className="text-[var(--text-primary)]">
            {Math.min(page * pageSize, total)}
          </strong>{' '}
          of <strong className="text-[var(--text-primary)]">{total}</strong> incidents
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1 rounded bg-[var(--border-subtle)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-2 text-[var(--text-muted)] tabular-nums">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1 rounded bg-[var(--border-subtle)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
