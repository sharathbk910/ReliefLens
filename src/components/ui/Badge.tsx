import React from 'react';
import type { PriorityTier, IncidentStatus, VerificationLevel, UncertaintyFlag } from '../../shared/types.ts';

export function Badge({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'warning' | 'danger' | 'success';
}) {
  const variantStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
    danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ tier, score }: { tier: PriorityTier; score?: number }) {
  const isExtremeCritical = tier === 'critical' && typeof score === 'number' && score >= 85;

  const styles: Record<PriorityTier, { bg: string; text: string; border: string; label: string }> = {
    critical: {
      bg: isExtremeCritical
        ? 'bg-rose-100 dark:bg-rose-500/25 shadow-xs dark:shadow-[0_0_12px_rgba(244,63,94,0.25)]'
        : 'bg-rose-50 dark:bg-rose-500/15',
      text: isExtremeCritical ? 'text-rose-900 dark:text-rose-200 font-extrabold' : 'text-rose-700 dark:text-rose-300',
      border: isExtremeCritical ? 'border-rose-400 dark:border-rose-500/60' : 'border-rose-300 dark:border-rose-500/35',
      label: 'CRITICAL',
    },
    high: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-500/30',
      label: 'HIGH',
    },
    medium: {
      bg: 'bg-sky-50 dark:bg-blue-500/10',
      text: 'text-sky-800 dark:text-blue-300',
      border: 'border-sky-300 dark:border-blue-500/25',
      label: 'MEDIUM',
    },
    low: {
      bg: 'bg-slate-100 dark:bg-slate-800/50',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700/50',
      label: 'LOW',
    },
  };

  const style = styles[tier] || styles.low;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 select-none ${style.bg} ${style.text} ${style.border} tracking-wide transition-colors`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{style.label}</span>
      {typeof score === 'number' && (
        <span className="font-mono text-xs opacity-90 ml-0.5 tabular-nums">({score})</span>
      )}
    </span>
  );
}

export function StatusBadge({ status, compact = false }: { status: IncidentStatus; compact?: boolean }) {
  const styles: Record<IncidentStatus, { bg: string; text: string; border: string; label: string; compactLabel: string }> = {
    new: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-500/30',
      label: 'NEW',
      compactLabel: 'NEW',
    },
    under_review: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      text: 'text-indigo-800 dark:text-indigo-300',
      border: 'border-indigo-300 dark:border-indigo-500/30',
      label: 'UNDER REVIEW',
      compactLabel: 'REVIEW',
    },
    confirmed: {
      bg: 'bg-teal-50 dark:bg-cyan-500/10',
      text: 'text-teal-800 dark:text-cyan-300',
      border: 'border-teal-300 dark:border-cyan-500/30',
      label: 'CONFIRMED',
      compactLabel: 'CONFIRMED',
    },
    resolved: {
      bg: 'bg-slate-100 dark:bg-slate-800/50',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700/50',
      label: 'RESOLVED',
      compactLabel: 'RESOLVED',
    },
    dismissed: {
      bg: 'bg-neutral-100 dark:bg-neutral-800/50',
      text: 'text-neutral-700 dark:text-neutral-400',
      border: 'border-neutral-300 dark:border-neutral-700/50',
      label: 'DISMISSED',
      compactLabel: 'DISMISSED',
    },
    merged: {
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-500/30',
      label: 'MERGED',
      compactLabel: 'MERGED',
    },
  };

  const style = styles[status] || styles.new;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0 select-none ${style.bg} ${style.text} ${style.border}`}
    >
      {compact ? style.compactLabel : style.label}
    </span>
  );
}

export function VerificationBadge({ level, compact = false }: { level: VerificationLevel; compact?: boolean }) {
  const styles: Record<VerificationLevel, { text: string; border: string; bg: string; label: string; compactLabel: string; tooltip: string }> = {
    coordinator_verified: {
      text: 'text-teal-800 dark:text-teal-300',
      border: 'border-teal-300 dark:border-teal-500/30',
      bg: 'bg-teal-50 dark:bg-teal-500/10',
      label: 'Coordinator Verified',
      compactLabel: 'Coord Verified',
      tooltip: 'Directly verified on site or radio by emergency response coordinator.',
    },
    corroborated: {
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-300 dark:border-sky-500/30',
      bg: 'bg-sky-50 dark:bg-sky-500/10',
      label: 'Corroborated',
      compactLabel: 'Corroborated',
      tooltip: 'Corroborated by independent citizen reports across multiple communication channels.',
    },
    partially_corroborated: {
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-500/30',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      label: 'Partially Verified',
      compactLabel: 'Partially Verif',
      tooltip: 'Partially matched with existing reports but awaiting additional field evidence.',
    },
    unverified: {
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700/50',
      bg: 'bg-slate-100 dark:bg-slate-800/40',
      label: 'Unverified',
      compactLabel: 'Unverified',
      tooltip: 'Single preliminary report pending verification.',
    },
  };

  const style = styles[level] || styles.unverified;

  return (
    <span
      title={style.tooltip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap shrink-0 select-none ${style.bg} ${style.text} ${style.border}`}
    >
      {compact ? style.compactLabel : style.label}
    </span>
  );
}

export function UncertaintyBadge({ flag, compact = false }: { flag: UncertaintyFlag; compact?: boolean }) {
  const meta: Record<UncertaintyFlag, { label: string; compactLabel: string; tooltip: string; severe?: boolean }> = {
    no_coordinates: {
      label: 'No GPS Coords',
      compactLabel: 'No GPS',
      tooltip: 'No associated report contains verified latitude/longitude coordinates.',
    },
    location_precision_unknown: {
      label: 'Unknown Precision',
      compactLabel: 'Approx Loc',
      tooltip: 'Location description precision is approximate or unknown.',
    },
    single_source: {
      label: 'Single Source',
      compactLabel: '1 Source',
      tooltip: 'Information originates from only one communication channel.',
    },
    people_at_risk_unknown: {
      label: 'Unknown People at Risk',
      compactLabel: 'Unknown Pop',
      tooltip: 'No casualty or impacted headcount estimate has been provided.',
    },
    conflicting_people_estimates: {
      label: 'Conflicting Estimates',
      compactLabel: 'Conflict Est',
      tooltip: 'Reported casualties or people at risk vary by 4x or more.',
      severe: true,
    },
    stale_over_12h: {
      label: 'Stale (>12h)',
      compactLabel: '>12h Old',
      tooltip: 'Latest incoming report is older than 12 hours.',
      severe: true,
    },
    unverified_high_danger: {
      label: 'Unverified High Danger',
      compactLabel: 'High Danger',
      tooltip: 'Immediate danger reported without multi-source or coordinator verification.',
      severe: true,
    },
  };

  const info = meta[flag] || { label: flag, compactLabel: flag, tooltip: flag };

  return (
    <span
      title={info.tooltip}
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide border whitespace-nowrap shrink-0 select-none ${
        info.severe
          ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
          : 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
      }`}
    >
      ⚠️ {compact ? info.compactLabel : info.label}
    </span>
  );
}
