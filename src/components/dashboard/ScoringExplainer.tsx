import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ShieldAlert, Cpu, Sparkles } from 'lucide-react';
import { RULESET } from '../../shared/rules/ruleset.v1.ts';

export function ScoringExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 corner-cross bg-[#141611]/90 border border-[var(--border-subtle)] rounded-xl overflow-hidden transition-all shadow-sm">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between p-3.5 gap-2.5">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between gap-3 text-left group flex-1"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EBFC72] emergency-pulse-dot" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[#EBFC72] transition-colors flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#EBFC72]" />
              Deterministic Incident Scoring Formula (v{RULESET.version})
            </span>
            <span className="text-[10px] text-[#EBFC72] font-mono bg-[#EBFC72]/10 border border-[#EBFC72]/30 px-2 py-0.5 rounded-sm">
              100% EXPLAINABLE & AUDITABLE
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Tactical Quick Formula Banner */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-muted)] bg-black/40 px-2.5 py-1 rounded border border-white/5">
          <span className="text-rose-400 font-semibold">DANGER 30%</span>
          <span>+</span>
          <span className="text-amber-400 font-semibold">PEOPLE 25%</span>
          <span>+</span>
          <span className="text-sky-400 font-semibold">FRESHNESS 20%</span>
          <span>+</span>
          <span className="text-purple-400 font-semibold">VULNERABILITY 15%</span>
          <span>+</span>
          <span className="text-[#EBFC72] font-semibold">CONFIDENCE 10%</span>
        </div>
      </div>

      {open && (
        <div className="p-4 pt-1 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
              ReliefLens uses zero opaque "black-box" AI for life-or-death triage. Scores from 0 to 100 are generated through deterministic mathematical weighting with human coordinator sign-off:
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
