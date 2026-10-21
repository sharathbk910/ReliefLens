import React, { useState } from 'react';
import { Search, Filter, X, ArrowUpDown, ChevronDown } from 'lucide-react';
import type { IncidentStatus, IncidentType, PriorityTier } from '../../shared/types.ts';

interface FiltersState {
  search: string;
  status: IncidentStatus | 'all';
  incidentType: IncidentType | 'all';
  priorityTier: PriorityTier | 'all';
  district: string | 'all';
  hasUncertainty: boolean;
  sortBy: 'effective_score' | 'last_reported_at';
  sortOrder: 'asc' | 'desc';
}

interface IncidentFiltersProps {
  filters: FiltersState;
  onChange: (updated: Partial<FiltersState>) => void;
  onClear: () => void;
  districts: string[];
}

export function IncidentFilters({
  filters,
  onChange,
  onClear,
  districts,
}: IncidentFiltersProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.incidentType !== 'all' ||
    filters.priorityTier !== 'all' ||
    filters.district !== 'all' ||
    filters.hasUncertainty;

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-4 shadow-xl">
      {/* Compact Primary Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search incident title, district, or description..."
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#ccff00] focus:border-[#ccff00] transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as any })}
          className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#ccff00] focus:border-[#ccff00] transition-colors cursor-pointer"
        >
          <option value="all" className="bg-[#0c0c0c] text-white">Status: All</option>
          <option value="new" className="bg-[#0c0c0c] text-white">New</option>
          <option value="under_review" className="bg-[#0c0c0c] text-white">Under Review</option>
          <option value="confirmed" className="bg-[#0c0c0c] text-white">Confirmed</option>
          <option value="resolved" className="bg-[#0c0c0c] text-white">Resolved</option>
          <option value="dismissed" className="bg-[#0c0c0c] text-white">Dismissed</option>
          <option value="merged" className="bg-[#0c0c0c] text-white">Merged</option>
        </select>

        {/* Priority Tier Dropdown */}
        <select
          value={filters.priorityTier}
          onChange={(e) => onChange({ priorityTier: e.target.value as any })}
          className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#ccff00] focus:border-[#ccff00] transition-colors cursor-pointer"
        >
          <option value="all" className="bg-[#0c0c0c] text-white">Tier: All</option>
          <option value="critical" className="bg-[#0c0c0c] text-white">Critical (70–100)</option>
          <option value="high" className="bg-[#0c0c0c] text-white">High (45–69)</option>
          <option value="medium" className="bg-[#0c0c0c] text-white">Medium (20–44)</option>
          <option value="low" className="bg-[#0c0c0c] text-white">Low (0–19)</option>
        </select>

        {/* Type Dropdown */}
        <select
          value={filters.incidentType}
          onChange={(e) => onChange({ incidentType: e.target.value as any })}
          className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#ccff00] focus:border-[#ccff00] transition-colors cursor-pointer"
        >
          <option value="all" className="bg-[#0c0c0c] text-white">Type: All</option>
          <option value="flood" className="bg-[#0c0c0c] text-white">Flood</option>
          <option value="fire" className="bg-[#0c0c0c] text-white">Fire</option>
          <option value="medical" className="bg-[#0c0c0c] text-white">Medical</option>
          <option value="landslide" className="bg-[#0c0c0c] text-white">Landslide</option>
          <option value="earthquake" className="bg-[#0c0c0c] text-white">Earthquake</option>
          <option value="shelter_request" className="bg-[#0c0c0c] text-white">Shelter Request</option>
          <option value="other" className="bg-[#0c0c0c] text-white">Other</option>
        </select>

        {/* Toggle Uncertainty Filter */}
        <button
          onClick={() => onChange({ hasUncertainty: !filters.hasUncertainty })}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            filters.hasUncertainty
              ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
              : 'bg-white/[0.05] border-white/10 text-white/60 hover:text-white hover:border-white/20'
          }`}
        >
          <span>⚠️ Uncertainty Only</span>
        </button>

        {/* Secondary Popover Toggle */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            panelOpen || filters.district !== 'all'
              ? 'bg-[#ccff00]/15 border-[#ccff00]/40 text-[#ccff00]'
              : 'bg-white/[0.05] border-white/10 text-white/60 hover:text-white hover:border-white/20'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>More Filters</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${panelOpen ? 'rotate-180 text-[#ccff00]' : ''}`} />
        </button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-black font-bold px-3 py-2 rounded-xl bg-[#ccff00] hover:bg-[#d8ff33] shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-colors"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Expandable Secondary Filter Panel */}
      {panelOpen && (
        <div className="mt-3.5 pt-3.5 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs animate-slide-down">
          {/* District Filter */}
          <div className="flex items-center gap-2">
            <span className="text-white/50 font-mono text-[11px] uppercase tracking-wider">District:</span>
            <select
              value={filters.district}
              onChange={(e) => onChange({ district: e.target.value })}
              className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#ccff00] focus:border-[#ccff00] cursor-pointer"
            >
              <option value="all" className="bg-[#0c0c0c] text-white">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d} className="bg-[#0c0c0c] text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-white/50 font-mono text-[11px] uppercase tracking-wider">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as any })}
              className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#ccff00] focus:border-[#ccff00] cursor-pointer"
            >
              <option value="effective_score" className="bg-[#0c0c0c] text-white">Effective Priority Score</option>
              <option value="last_reported_at" className="bg-[#0c0c0c] text-white">Most Recent Report Time</option>
            </select>
            <button
              onClick={() =>
                onChange({
                  sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc',
                })
              }
              title="Toggle sort direction"
              className="p-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/60 hover:text-[#ccff00] hover:border-[#ccff00]/40 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
