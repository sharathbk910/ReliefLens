import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, CopyCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Incident } from '../../shared/types.ts';
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
}

export function IncidentTable({
  incidents,
  isLoading = false,
  page,
  pageSize,
  total,
  onPageChange,
}: IncidentTableProps) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / pageSize);

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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 animate-pulse">
        <p className="text-sm">Loading emergency incidents...</p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
          🎯
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No Incidents Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No records match your active search and filter criteria. Try clearing filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
              <th className="py-3 px-4">Priority & Score</th>
              <th className="py-3 px-4 min-w-[220px]">Incident Details</th>
              <th className="py-3 px-4">District / Location</th>
              <th className="py-3 px-4 text-center">Reports</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Uncertainty Flags</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {incidents.map((incident) => {
              const hasFloorApplied = incident.score_breakdown?.floor_applied;
              const hasOverride = incident.score_override !== null;

              return (
                <tr
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  {/* Priority & Score */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex flex-col gap-1 items-start">
                      <PriorityBadge
                        tier={incident.priority_tier}
                        score={incident.effective_score}
                      />
                      {hasFloorApplied && (
                        <span className="text-[10px] text-amber-400 font-mono">
                          Floor Adjusted (45)
                        </span>
                      )}
                      {hasOverride && (
                        <span className="text-[10px] text-purple-400 font-mono">
                          Manual Override
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Type */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                      {incident.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="capitalize font-mono px-1 rounded bg-slate-800 text-slate-300">
                        {incident.incident_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(incident.last_reported_at)}
                      </span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-start gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="truncate max-w-[180px]">
                        <p className="font-medium text-slate-200 truncate">
                          {incident.district || 'Unassigned District'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {incident.location_text || 'No text location'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Report Count */}
                  <td className="py-3.5 px-4 align-top text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-medium">
                      <span>{incident.report_count}</span>
                      <span className="text-[10px] text-slate-400">
                        ({incident.distinct_channel_count} ch)
                      </span>
                    </div>
                  </td>

                  {/* Verification Level */}
                  <td className="py-3.5 px-4 align-top">
                    <VerificationBadge level={incident.verification_level} />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 align-top">
                    <StatusBadge status={incident.status} />
                  </td>

                  {/* Uncertainty Flags */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {incident.uncertainty_flags && incident.uncertainty_flags.length > 0 ? (
                        incident.uncertainty_flags.map((flag) => (
                          <UncertaintyBadge key={flag} flag={flag} />
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Complete
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 align-top text-right">
                    <span className="inline-flex items-center text-slate-400 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing{' '}
          <strong className="text-white">
            {total > 0 ? (page - 1) * pageSize + 1 : 0}
          </strong>{' '}
          to{' '}
          <strong className="text-white">
            {Math.min(page * pageSize, total)}
          </strong>{' '}
          of <strong className="text-white">{total}</strong> incidents
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-2 text-slate-400">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
