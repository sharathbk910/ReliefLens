import React, { useState } from 'react';
import { Search, Filter, X, ArrowUpDown, ChevronDown, Compass } from 'lucide-react';
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
  maxDistanceKm?: number | 'all';
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
    filters.hasUncertainty ||
    (filters.maxDistanceKm !== undefined && filters.maxDistanceKm !== 'all');

  return (
    <div className="surface-z1 border border-[var(--border-subtle)] rounded-2xl p-3 sm:p-3.5 shadow-sm">
      {/* Compact Primary Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search incident title, district, or description..."
            className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as any })}
          className="flex-1 sm:flex-none min-w-[110px] bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs cursor-pointer"
        >
          <option value="all">Status: All</option>
          <option value="new">New</option>
          <option value="under_review">Under Review</option>
          <option value="confirmed">Confirmed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="merged">Merged</option>
        </select>

        {/* Priority Tier Dropdown */}
        <select
          value={filters.priorityTier}
          onChange={(e) => onChange({ priorityTier: e.target.value as any })}
          className="flex-1 sm:flex-none min-w-[110px] bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs cursor-pointer"
        >
          <option value="all">Tier: All</option>
          <option value="critical">Critical (70–100)</option>
          <option value="high">High (45–69)</option>
          <option value="medium">Medium (20–44)</option>
          <option value="low">Low (0–19)</option>
        </select>

        {/* Type Dropdown */}
        <select
          value={filters.incidentType}
          onChange={(e) => onChange({ incidentType: e.target.value as any })}
          className="flex-1 sm:flex-none min-w-[110px] bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs cursor-pointer"
        >
          <option value="all">Type: All</option>
          <option value="flood">Flood</option>
          <option value="fire">Fire</option>
          <option value="medical">Medical</option>
          <option value="landslide">Landslide</option>
          <option value="earthquake">Earthquake</option>
          <option value="shelter_request">Shelter Request</option>
          <option value="other">Other</option>
        </select>

        {/* Proximity / Within Range Filter */}
        <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] min-w-[140px] shadow-xs">
          <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <select
            value={filters.maxDistanceKm ?? 'all'}
            onChange={(e) =>
              onChange({
                maxDistanceKm: e.target.value === 'all' ? 'all' : Number(e.target.value),
              })
            }
            aria-label="Filter incidents within range of your current location"
            className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Range: All Distances</option>
            <option value={5} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Within 5 km of Me</option>
            <option value={10} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Within 10 km of Me</option>
            <option value={25} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Within 25 km of Me</option>
            <option value={50} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Within 50 km of Me</option>
          </select>
        </div>

        {/* Toggle Uncertainty Filter */}
        <button
          onClick={() => onChange({ hasUncertainty: !filters.hasUncertainty })}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer shadow-xs ${
            filters.hasUncertainty
              ? 'bg-amber-100 dark:bg-amber-950/50 border-amber-400 dark:border-amber-500/50 text-amber-900 dark:text-amber-200'
              : 'bg-[var(--surface-1-solid)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>⚠️ Uncertainty Only</span>
        </button>

        {/* Secondary Popover Toggle */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer shadow-xs ${
            panelOpen || filters.district !== 'all'
              ? 'bg-teal-50 dark:bg-[var(--surface-2-solid)] border-teal-400 dark:border-teal-500/40 text-teal-800 dark:text-teal-300'
              : 'bg-[var(--surface-1-solid)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>More Filters</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${panelOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 cursor-pointer font-semibold shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Expandable Secondary Filter Panel */}
      {panelOpen && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-4 text-xs animate-slide-down">
          {/* District Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-medium">District:</span>
            <select
              value={filters.district}
              onChange={(e) => onChange({ district: e.target.value })}
              className="bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs cursor-pointer"
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-medium">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as any })}
              className="bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs cursor-pointer"
            >
              <option value="effective_score">Effective Priority Score</option>
              <option value="last_reported_at">Most Recent Report Time</option>
            </select>
            <button
              onClick={() =>
                onChange({
                  sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc',
                })
              }
              title="Toggle sort direction"
              className="p-1 rounded-lg bg-[var(--surface-1-solid)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xs cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
