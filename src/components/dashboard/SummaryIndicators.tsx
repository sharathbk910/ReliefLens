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
      icon: <FolderOpen className="w-4 h-4 text-[#ccff00]" strokeWidth={2} />,
      border: 'hover:border-[#ccff00]/50 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)]',
      countColor: 'text-white',
      badge: 'LIVE_TRIAGE',
      stagger: 'stagger-1',
    },
    {
      id: 'critical',
      label: 'Critical Priority',
      count: criticalHigh,
      desc: 'Score ≥ 45 or safety floor active',
      icon: <AlertCircle className="w-4 h-4 text-[#ccff00]" strokeWidth={2} />,
      border: 'hover:border-[#ccff00] hover:shadow-[0_0_25px_rgba(204,255,0,0.25)]',
      countColor: 'text-[#ccff00]',
      badge: 'TIER_1',
      stagger: 'stagger-2',
    },
    {
      id: 'uncertainty',
      label: 'Data Uncertainty',
      count: unresolvedUncertainty,
      desc: 'Missing coords or single source',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={2} />,
      border: 'hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      countColor: 'text-amber-400',
      badge: 'REVIEW_REQ',
      stagger: 'stagger-3',
    },
    {
      id: 'duplicates',
      label: 'Duplicate Reviews',
      count: pendingDuplicates,
      desc: 'Awaiting coordinator decision',
      icon: <CopyCheck className="w-4 h-4 text-[#10b981]" strokeWidth={2} />,
      border: 'hover:border-[#10b981]/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      countColor: 'text-white',
      badge: 'CLUSTER_SYNC',
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
          className={`text-left p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 ${ind.border} ${ind.stagger} transition-all duration-300 cursor-pointer overflow-hidden group focus-visible:ring-2 shadow-xl hover:-translate-y-1 relative`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
              {ind.label}
            </span>
            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 group-hover:border-[#ccff00]/40 transition-colors">
              {ind.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl md:text-4xl font-extrabold font-heading tabular-nums ${ind.countColor} tracking-tight`}>
              {ind.count}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#ccff00]/70 font-semibold ml-auto">
              {ind.badge}
            </span>
          </div>
          <p className="text-[11px] text-white/50 mt-1.5 truncate font-sans">
            {ind.desc}
          </p>
        </button>
      ))}
    </div>
  );
}
