import React from 'react';
import { AlertCircle, AlertTriangle, CopyCheck, FolderOpen } from 'lucide-react';

interface SummaryIndicatorsProps {
  openIncidents: number;
  criticalHigh: number;
  unresolvedUncertainty: number;
  pendingDuplicates: number;
  onFilterClick?: (filterType: string) => void;
}

export function SummaryIndicators({
  openIncidents,
  criticalHigh,
  unresolvedUncertainty,
  pendingDuplicates,
  onFilterClick,
}: SummaryIndicatorsProps) {
  const indicators = [
    {
      id: 'open',
      label: 'Open Incidents',
      count: openIncidents,
      desc: 'Active crisis situations in progress',
      icon: <FolderOpen className="w-4 h-4 text-blue-400" strokeWidth={1.5} />,
      border: 'hover:border-blue-500/40',
      countColor: 'text-blue-400',
      stagger: 'stagger-1',
    },
    {
      id: 'critical',
      label: 'Critical Danger',
      count: criticalHigh,
      desc: 'Trapped victims & life-threatening risk',
      icon: <AlertCircle className="w-4 h-4 text-rose-500" strokeWidth={1.5} />,
      border: 'hover:border-rose-500/40',
      countColor: 'text-rose-500',
      stagger: 'stagger-2',
    },
    {
      id: 'uncertainty',
      label: 'Needs Verification',
      count: unresolvedUncertainty,
      desc: 'Awaiting exact location or field check',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.5} />,
      border: 'hover:border-amber-500/40',
      countColor: 'text-amber-500',
      stagger: 'stagger-3',
    },
    {
      id: 'duplicates',
      label: 'Linked Duplicates',
      count: pendingDuplicates,
      desc: 'Merged reports to prevent wasted aid',
      icon: <CopyCheck className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />,
      border: 'hover:border-[var(--border-strong)]',
      countColor: 'text-[var(--text-primary)]',
      stagger: 'stagger-4',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-4 mb-4">
      {indicators.map((ind) => (
        <button
          key={ind.id}
          type="button"
          onClick={() => onFilterClick && onFilterClick(ind.id)}
          className={`text-left p-3 sm:p-3.5 md:p-4 rounded-xl corner-cross bg-[#141611]/90 border border-[var(--border-subtle)] ${ind.border} ${ind.stagger} tactical-card-interactive cursor-pointer overflow-hidden group focus-visible:ring-2 shadow-sm relative`}
        >
          <div className="corner-bracket cross-tl"></div>
          <div className="corner-bracket cross-tr"></div>
          <div className="corner-bracket cross-bl"></div>
          <div className="corner-bracket cross-br"></div>

          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate pr-1">
              {ind.label}
            </span>
            <div className="p-1 sm:p-1.5 rounded-md bg-black/40 border border-white/5 group-hover:border-[#EBFC72]/40 transition-colors shrink-0">
              {ind.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl md:text-3xl font-extrabold font-mono tabular-nums ${ind.countColor}`}>
              {ind.count}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-mono text-[var(--text-muted)] mt-0.5 sm:mt-1 truncate">
            {ind.desc}
          </p>
        </button>
      ))}
    </div>
  );
}
