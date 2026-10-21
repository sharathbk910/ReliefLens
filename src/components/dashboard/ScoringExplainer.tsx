import React, { useState } from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, ShieldAlert } from 'lucide-react';
import { RULESET } from '../../shared/rules/ruleset.v1.ts';

export function ScoringExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 surface-z1 border border-[var(--border-subtle)] rounded-2xl overflow-hidden transition-all shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[var(--border-subtle)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            How Deterministic Incident Scoring Works (Ruleset v{RULESET.version})
          </span>
          <span className="text-[10px] text-teal-300 font-mono bg-teal-950/50 border border-teal-500/30 px-1.5 py-0.5 rounded">
            Auditable Ruleset
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="p-4 pt-1 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-3 animate-slide-down">
          <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
            ReliefLens calculates deterministic, auditable priority scores between 0 and 100 based on five transparent factors and an unverified high-danger safety floor:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Factor 1 */}
            <div className="p-3 rounded-xl bg-[var(--surface-1-solid)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between font-semibold text-rose-300 mb-1">
                <span>Immediate Danger</span>
                <span className="font-mono text-[11px]">30 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                30 pts for explicit danger flag; 15 pts if danger keywords (e.g. <em>trapped</em>, <em>collapsed</em>, <em>submerged</em>) matched in text.
              </p>
            </div>

            {/* Factor 2 */}
            <div className="p-3 rounded-xl bg-[var(--surface-1-solid)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between font-semibold text-amber-300 mb-1">
                <span>People at Risk</span>
                <span className="font-mono text-[11px]">25 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Max estimate across reports. ≥100: 25pts; ≥20: 20pts; ≥5: 15pts; ≥1: 8pts; 0: 0pts; Unknown: 5 neutral pts.
              </p>
            </div>

            {/* Factor 3 */}
            <div className="p-3 rounded-xl bg-[var(--surface-1-solid)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between font-semibold text-sky-300 mb-1">
                <span>Report Freshness</span>
                <span className="font-mono text-[11px]">20 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Time sensitivity: ≤2h: 20pts; 2–6h: 14pts; 6–12h: 8pts; &gt;12h: 3pts. Labels report age, not safety.
              </p>
            </div>

            {/* Factor 4 */}
            <div className="p-3 rounded-xl bg-[var(--surface-1-solid)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between font-semibold text-purple-300 mb-1">
                <span>Vulnerabilities</span>
                <span className="font-mono text-[11px]">15 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                5 points per distinct flag (children, elderly, medical dependency, isolated remote) capped at 15 points.
              </p>
            </div>

            {/* Factor 5 */}
            <div className="p-3 rounded-xl bg-[var(--surface-1-solid)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between font-semibold text-teal-300 mb-1">
                <span>Confidence</span>
                <span className="font-mono text-[11px]">10 pts</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Unverified: 0pts; Partial: 5pts; Multi-channel corroborated or coordinator verified: 10pts.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2 text-amber-200">
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
