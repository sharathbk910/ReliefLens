import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, X, Radio, ArrowRight, Sparkles } from 'lucide-react';
import { VoiceRecorder } from '../VoiceRecorder.tsx';
import type { VoiceExtractionResult } from '../../shared/types.ts';

export function EmergencyVoiceFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // If already on report form or map page, don't show the FAB to avoid duplication and overlapping with map drawers
  if (location.pathname === '/reports/new' || location.pathname === '/map') {
    return null;
  }

  const handleExtractionSuccess = (extraction: VoiceExtractionResult) => {
    setIsOpen(false);
    // Navigate to report form and pass the extraction result in router state
    navigate('/reports/new', {
      state: {
        prefilledVoiceExtraction: extraction,
      },
    });
  };

  return (
    <>
      {/* Floating Action Button (Spatial Z-3 Layer) */}
      <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 md:right-8 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Quick Emergency Voice Report"
          className="group relative flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto p-0 sm:px-3.5 sm:py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xl shadow-rose-900/40 transition-all duration-200 active:scale-95 border border-rose-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          {/* Pulsing beacon glow */}
          <span className="absolute -inset-1 rounded-full bg-rose-500/25 animate-ping pointer-events-none opacity-75" />

          <div className="relative flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-white/20">
            <Mic className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={2} />
          </div>
          <span className="relative hidden sm:inline tracking-wide font-heading pr-0.5">
            Emergency Voice Report
          </span>
        </button>
      </div>

      {/* Quick Voice Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg surface-z3 rounded-2xl border border-[var(--border-strong)] shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-rose-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                    Quick Emergency Voice Report
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Speak your situation in any language • Audio is analysed automatically
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
                aria-label="Close Quick Voice Report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              <VoiceRecorder
                onExtractionSuccess={handleExtractionSuccess}
                onCancel={() => setIsOpen(false)}
                onSwitchToManual={() => {
                  setIsOpen(false);
                  navigate('/reports/new');
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Hands-free emergency voice capture
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/reports/new');
                }}
                className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                Open Manual Form
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
