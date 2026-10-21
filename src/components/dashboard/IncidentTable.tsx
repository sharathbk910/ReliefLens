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
        {incidents.map((incident) => {
          const isSelected = selectedIncidentId === incident.id;
          return (
            <div
              key={incident.id}
              onClick={() => {
                if (onSelectIncident) {
                  onSelectIncident(incident);
                } else {
                  navigate(`/incidents/${incident.id}`);
                }
              }}
              className={`p-3 sm:p-3.5 hover:bg-[var(--border-subtle)] transition-colors cursor-pointer space-y-2 ${
                isSelected ? 'bg-[#EBFC72]/10 border-l-4 border-l-[#EBFC72]' : ''
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <PriorityBadge tier={incident.priority_tier} score={incident.effective_score} />
                <StatusBadge status={incident.status} />
              </div>

              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
                  {incident.title}
                </h4>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" strokeWidth={1.5} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-[var(--border-subtle)]/40 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1 truncate max-w-[170px] sm:max-w-[220px]">
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
          );
        })}
      </div>

      {/* 2. Desktop & Tablet Table (>= 768px - Spacious Layout, Zero Text Clipping, Clean Headers) */}
      <div className="hidden md:block w-full max-w-full overflow-hidden">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          <colgroup>
            <col style={{ width: '18%' }} className="w-[18%]" />
            <col style={{ width: '32%' }} className="w-[32%]" />
            <col style={{ width: '20%' }} className="w-[20%]" />
            <col style={{ width: '7%' }} className="w-[7%]" />
            <col style={{ width: '11%' }} className="w-[11%]" />
            <col style={{ width: '12%' }} className="w-[12%]" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--surface-1-solid)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium select-none shadow-sm">
              <th className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider bg-[var(--surface-1-solid)]">
                Priority & Score
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider bg-[var(--surface-1-solid)]">
                Incident Details
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider bg-[var(--surface-1-solid)]">
                District / Location
              </th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap text-[11px] font-mono uppercase tracking-wider bg-[var(--surface-1-solid)]">
                Reports
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider bg-[var(--surface-1-solid)]">
                Status
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono uppercase tracking-wider bg-[var(--surface-1-solid)]">
                Verification
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
            {incidents.map((incident) => {
              const hasFloorApplied = incident.score_breakdown?.floor_applied;
              const hasOverride = incident.score_override !== null;
              const isSelected = selectedIncidentId === incident.id;
              const priorityBorder =
                incident.priority_tier === 'critical'
                  ? 'border-l-4 border-l-rose-500/70'
                  : incident.priority_tier === 'high'
                  ? 'border-l-4 border-l-amber-500/50'
                  : 'border-l-4 border-l-transparent';

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
                  className={`transition-colors cursor-pointer group ${priorityBorder} ${
                    isSelected
                      ? 'bg-[#EBFC72]/10 hover:bg-[#EBFC72]/15 shadow-[inset_3px_0_0_0_#EBFC72]'
                      : 'hover:bg-[var(--surface-2-solid)]'
                  }`}
                >
                  {/* Priority & Score */}
                  <td className="py-2.5 px-3 align-top whitespace-nowrap overflow-hidden">
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
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#EBFC72] font-bold">
                          ● TARGETED IN HUD
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Type & Uncertainty */}
                  <td className="py-2.5 px-3 align-top overflow-hidden">
                    <div
                      className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug"
                      title={incident.title}
                    >
                      {incident.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[var(--text-secondary)] flex-wrap">
                      <span className="capitalize font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2-solid)] text-teal-300 border border-teal-500/20 whitespace-nowrap shrink-0">
                        {incident.incident_type}
                      </span>
                      <span className="flex items-center gap-0.5 tabular-nums text-[var(--text-muted)] whitespace-nowrap">
                        <Clock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                        {formatTimeAgo(incident.last_reported_at)}
                      </span>
                      {incident.uncertainty_flags && incident.uncertainty_flags.length > 0 && (
                        incident.uncertainty_flags.slice(0, 2).map((flag) => (
                          <UncertaintyBadge key={flag} flag={flag} compact={true} />
                        ))
                      )}
                    </div>
                  </td>

                  {/* District / Location */}
                  <td className="py-2.5 px-3 align-top overflow-hidden">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[var(--text-primary)] truncate" title={incident.district || 'Unassigned District'}>
                        {incident.district || 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight mt-0.5" title={incident.location_text || 'No text location'}>
                        {incident.location_text || 'No text location'}
                      </p>
                      {getDistanceText(incident.latitude, incident.longitude) && (
                        <span className="text-[10px] text-teal-400 font-mono font-medium block truncate mt-0.5">
                          📍 {getDistanceText(incident.latitude, incident.longitude)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Report Count */}
                  <td className="py-2.5 px-2 align-top text-center whitespace-nowrap overflow-hidden">
                    <span
                      className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-xs font-bold tabular-nums"
                      title={`${incident.report_count} reports (${incident.distinct_channel_count} channels)`}
                    >
                      {incident.report_count}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 align-top whitespace-nowrap overflow-hidden">
                    <StatusBadge status={incident.status} compact={true} />
                  </td>

                  {/* Verification & Action */}
                  <td className="py-2.5 px-3 align-top whitespace-nowrap overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <VerificationBadge level={incident.verification_level} compact={true} />
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-teal-400 transition-colors shrink-0" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Mobile-friendly stacked & touch targets) */}
      <div className="p-3 sm:p-3.5 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
        <div className="tabular-nums text-center sm:text-left text-[11px] sm:text-xs">
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
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 min-h-[36px] rounded-lg bg-[var(--border-subtle)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer text-xs"
          >
            Previous
          </button>
          <span className="px-2 text-[var(--text-muted)] font-mono text-[11px] tabular-nums whitespace-nowrap">
            {page} / {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 min-h-[36px] rounded-lg bg-[var(--border-subtle)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer text-xs"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
