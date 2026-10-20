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
      desc: 'Active operational response',
      icon: <FolderOpen className="w-5 h-5 text-blue-400" />,
      border: 'border-blue-900/40 hover:border-blue-700/60',
      bg: 'bg-slate-900/80',
      countColor: 'text-blue-100',
    },
    {
      id: 'critical',
      label: 'Critical / High Attention',
      count: criticalHigh,
      desc: 'Score ≥ 45 or safety floor active',
      icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
      border: 'border-rose-900/40 hover:border-rose-700/60',
      bg: 'bg-slate-900/80',
      countColor: 'text-rose-200',
    },
    {
      id: 'uncertainty',
      label: 'Unresolved Uncertainty',
      count: unresolvedUncertainty,
      desc: 'Missing coords, conflicting, single source',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      border: 'border-amber-900/40 hover:border-amber-700/60',
      bg: 'bg-slate-900/80',
      countColor: 'text-amber-200',
    },
    {
      id: 'duplicates',
      label: 'Duplicate Suggestions',
      count: pendingDuplicates,
      desc: 'Awaiting coordinator confirmation',
      icon: <CopyCheck className="w-5 h-5 text-purple-400" />,
      border: 'border-purple-900/40 hover:border-purple-700/60',
      bg: 'bg-slate-900/80',
      countColor: 'text-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      {indicators.map((ind) => (
        <div
          key={ind.id}
          onClick={() => onFilterClick && onFilterClick(ind.id)}
          className={`p-4 rounded-xl border ${ind.border} ${ind.bg} transition-all duration-150 cursor-pointer shadow-sm relative overflow-hidden group`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
              {ind.label}
            </span>
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
              {ind.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl md:text-3xl font-bold font-heading ${ind.countColor}`}>
              {ind.count}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {ind.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
