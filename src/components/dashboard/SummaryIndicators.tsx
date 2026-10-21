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
      desc: 'Active operational triage',
      icon: <FolderOpen className="w-4 h-4 text-blue-400" strokeWidth={1.5} />,
      border: 'hover:border-blue-500/40',
      countColor: 'text-blue-400',
      stagger: 'stagger-1',
    },
    {
      id: 'critical',
      label: 'Critical Priority',
      count: criticalHigh,
      desc: 'Score ≥ 45 or safety floor active',
      icon: <AlertCircle className="w-4 h-4 text-rose-500" strokeWidth={1.5} />,
      border: 'hover:border-rose-500/40',
      countColor: 'text-rose-500',
      stagger: 'stagger-2',
    },
    {
      id: 'uncertainty',
      label: 'Data Uncertainty',
      count: unresolvedUncertainty,
      desc: 'Missing coords or single source',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.5} />,
      border: 'hover:border-amber-500/40',
      countColor: 'text-amber-500',
      stagger: 'stagger-3',
    },
    {
      id: 'duplicates',
      label: 'Duplicate Reviews',
      count: pendingDuplicates,
      desc: 'Awaiting coordinator decision',
      icon: <CopyCheck className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />,
      border: 'hover:border-[var(--border-strong)]',
      countColor: 'text-[var(--text-primary)]',
      stagger: 'stagger-4',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
      {indicators.map((ind) => (
        <button
          key={ind.id}
          type="button"
          onClick={() => onFilterClick && onFilterClick(ind.id)}
          className={`text-left p-4 rounded-xl corner-cross bg-[#141611]/90 border border-[var(--border-subtle)] ${ind.border} ${ind.stagger} transition-all duration-200 cursor-pointer overflow-hidden group focus-visible:ring-2 shadow-sm hover:shadow-md hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              {ind.label}
            </span>
            <div className="p-1.5 rounded-md bg-black/40 border border-white/5 group-hover:border-[#EBFC72]/40 transition-colors">
              {ind.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl md:text-3xl font-extrabold font-mono tabular-nums ${ind.countColor}`}>
              {ind.count}
            </span>
          </div>
          <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1 truncate">
            {ind.desc}
          </p>
        </button>
      ))}
    </div>
  );
}
