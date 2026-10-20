import React from 'react';
import type { PriorityTier, IncidentStatus, VerificationLevel, UncertaintyFlag } from '../../shared/types.ts';

export function PriorityBadge({ tier, score }: { tier: PriorityTier; score?: number }) {
  const styles: Record<PriorityTier, { bg: string; text: string; border: string; label: string }> = {
    critical: {
      bg: 'bg-rose-950/80',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      label: 'CRITICAL',
    },
    high: {
      bg: 'bg-amber-950/80',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      label: 'HIGH',
    },
    medium: {
      bg: 'bg-blue-950/80',
      text: 'text-blue-300',
      border: 'border-blue-500/40',
      label: 'MEDIUM',
    },
    low: {
      bg: 'bg-slate-800/80',
      text: 'text-slate-300',
      border: 'border-slate-700',
      label: 'LOW',
    },
  };

  const style = styles[tier] || styles.low;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border} tracking-wide transition-colors`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {style.label}
      {typeof score === 'number' && (
        <span className="font-mono text-[11px] opacity-90 ml-0.5">({score})</span>
      )}
    </span>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, { bg: string; text: string; border: string; label: string }> = {
    new: {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-300',
      border: 'border-emerald-600/30',
      label: 'NEW',
    },
    under_review: {
      bg: 'bg-indigo-950/60',
      text: 'text-indigo-300',
      border: 'border-indigo-600/30',
      label: 'UNDER REVIEW',
    },
    confirmed: {
      bg: 'bg-cyan-950/60',
      text: 'text-cyan-300',
      border: 'border-cyan-600/30',
      label: 'CONFIRMED',
    },
    resolved: {
      bg: 'bg-slate-800/60',
      text: 'text-slate-400',
      border: 'border-slate-700/60',
      label: 'RESOLVED',
    },
    dismissed: {
      bg: 'bg-neutral-800/60',
      text: 'text-neutral-400',
      border: 'border-neutral-700/60',
      label: 'DISMISSED',
    },
    merged: {
      bg: 'bg-purple-950/60',
      text: 'text-purple-300',
      border: 'border-purple-600/30',
      label: 'MERGED',
    },
  };

  const style = styles[status] || styles.new;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
    >
      {style.label}
    </span>
  );
}

export function VerificationBadge({ level }: { level: VerificationLevel }) {
  const styles: Record<VerificationLevel, { text: string; border: string; bg: string; label: string }> = {
    coordinator_verified: {
      text: 'text-teal-300',
      border: 'border-teal-500/40',
      bg: 'bg-teal-950/50',
      label: 'Verified by Coordinator',
    },
    corroborated: {
      text: 'text-sky-300',
      border: 'border-sky-500/40',
      bg: 'bg-sky-950/50',
      label: 'Multi-Channel Corroborated',
    },
    partially_corroborated: {
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/50',
      label: 'Partially Corroborated',
    },
    unverified: {
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      bg: 'bg-rose-950/50',
      label: 'Unverified Evidence',
    },
  };

  const style = styles[level] || styles.unverified;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      {style.label}
    </span>
  );
}

export function UncertaintyBadge({ flag }: { flag: UncertaintyFlag }) {
  const meta: Record<UncertaintyFlag, { label: string; tooltip: string; severe?: boolean }> = {
    no_coordinates: {
      label: 'No GPS Coords',
      tooltip: 'No associated report contains verified latitude/longitude coordinates.',
    },
    location_precision_unknown: {
      label: 'Unknown Precision',
      tooltip: 'Location description precision is approximate or unknown.',
    },
    single_source: {
      label: 'Single Source',
      tooltip: 'Information originates from only one communication channel.',
    },
    people_at_risk_unknown: {
      label: 'Unknown People at Risk',
      tooltip: 'No casualty or impacted headcount estimate has been provided.',
    },
    conflicting_people_estimates: {
      label: 'Conflicting Estimates',
      tooltip: 'Reported casualties or people at risk vary by 4x or more.',
      severe: true,
    },
    stale_over_12h: {
      label: 'Stale (>12h)',
      tooltip: 'Latest incoming report is older than 12 hours.',
      severe: true,
    },
    unverified_high_danger: {
      label: 'Unverified High Danger',
      tooltip: 'Immediate danger reported without multi-source or coordinator verification.',
      severe: true,
    },
  };

  const info = meta[flag] || { label: flag, tooltip: flag };

  return (
    <span
      title={info.tooltip}
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wide border ${
        info.severe
          ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
          : 'bg-amber-950/30 text-amber-300 border-amber-500/30'
      }`}
    >
      ⚠️ {info.label}
    </span>
  );
}
