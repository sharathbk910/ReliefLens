import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ShieldAlert, Cpu, Sparkles } from 'lucide-react';
import { RULESET } from '../../shared/rules/ruleset.v1.ts';

export function ScoringExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="surface-z1 border border-[var(--border-subtle)] rounded-xl overflow-hidden transition-all shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 py-2 gap-2 bg-[#12130f]/60">
        <div className="flex items-center gap-2 min-w-0">
          <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-[var(--text-primary)] shrink-0">
            Triage Scoring Formula:
          </span>
          <span className="hidden md:inline text-xs text-[var(--text-muted)] truncate">
            Danger 30% • People 25% • Freshness 20% • Vulnerability 15% • Confidence 10%
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="self-start sm:self-auto text-xs font-mono text-[var(--text-secondary)] hover:text-white flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-[var(--surface-2-solid)] hover:bg-[var(--border-subtle)] transition-colors border border-[var(--border-subtle)] cursor-pointer"
        >
          <span>{open ? 'Hide Formula' : 'Scoring Logic'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <div className="p-4 pt-1 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
              ResQWave uses zero opaque "black-box" AI for life-or-death triage. Scores from 0 to 100 are generated through deterministic mathematical weighting with human coordinator sign-off:
            </p>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#EBFC72] bg-[#EBFC72]/10 px-2 py-0.5 rounded">
              <Sparkles className="w-3 h-3" /> HUMAN CHIEF IN THE LOOP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Factor 1 */}
            <div className="p-3 rounded-lg bg-black/40 border border-rose-500/20 hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between font-semibold text-rose-300 mb-1">
                <span className="font-mono text-xs">Immediate Danger</span>
                <span className="font-mono text-[11px] text-rose-400 font-bold">30 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                30 pts for explicit danger flag; 15 pts if danger keywords (e.g. <em>trapped</em>, <em>collapsed</em>, <em>submerged</em>) matched in text.
              </p>
            </div>

            {/* Factor 2 */}
            <div className="p-3 rounded-lg bg-black/40 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between font-semibold text-amber-300 mb-1">
                <span className="font-mono text-xs">People at Risk</span>
                <span className="font-mono text-[11px] text-amber-400 font-bold">25 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Max estimate across reports. ≥100: 25pts; ≥20: 20pts; ≥5: 15pts; ≥1: 8pts; 0: 0pts; Unknown: 5 neutral pts.
              </p>
            </div>

            {/* Factor 3 */}
            <div className="p-3 rounded-lg bg-black/40 border border-sky-500/20 hover:border-sky-500/40 transition-colors">
              <div className="flex items-center justify-between font-semibold text-sky-300 mb-1">
                <span className="font-mono text-xs">Report Freshness</span>
                <span className="font-mono text-[11px] text-sky-400 font-bold">20 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Time sensitivity: ≤2h: 20pts; 2–6h: 14pts; 6–12h: 8pts; &gt;12h: 3pts. Penalizes stale reports.
              </p>
            </div>

            {/* Factor 4 */}
            <div className="p-3 rounded-lg bg-black/40 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between font-semibold text-purple-300 mb-1">
                <span className="font-mono text-xs">Vulnerabilities</span>
                <span className="font-mono text-[11px] text-purple-400 font-bold">15 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                5 points per distinct flag (children, elderly, medical dependency, isolated remote) capped at 15 points.
              </p>
            </div>

            {/* Factor 5 */}
            <div className="p-3 rounded-lg bg-black/40 border border-[#EBFC72]/20 hover:border-[#EBFC72]/40 transition-colors">
              <div className="flex items-center justify-between font-semibold text-[#EBFC72] mb-1">
                <span className="font-mono text-xs">Confidence</span>
                <span className="font-mono text-[11px] text-[#EBFC72] font-bold">10 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Unverified: 0pts; Partial: 5pts; Multi-channel corroborated or coordinator verified: 10pts.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/25 border border-amber-500/30 flex items-start gap-2 text-amber-200">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="text-[11px]">
              <strong>Unverified High Danger Safety Floor:</strong> If immediate danger is reported but the incident remains unverified, a safety floor of <strong>45 points (High Priority)</strong> is enforced so life-threatening situations are never deprioritized due to missing verification.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
