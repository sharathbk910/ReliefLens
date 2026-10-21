import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, X, Radio, ArrowRight, Sparkles } from 'lucide-react';
import { VoiceRecorder } from '../voice/index.ts';
import type { VoiceExtractionResult } from '../../shared/types.ts';

export function EmergencyVoiceFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for global voice modal open events from mobile dock, topbar, or dashboard
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-emergency-voice-modal', handleOpen);
    return () => window.removeEventListener('open-emergency-voice-modal', handleOpen);
  }, []);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // If already on report form, don't show the FAB modal to avoid duplication
  if (location.pathname === '/reports/new') {
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
      {/* Quick Voice Modal (Keyboard-friendly, Safe-Area aware, High z-index) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-lg surface-z3 rounded-2xl border border-[var(--border-strong)] shadow-2xl overflow-hidden animate-scale-in my-auto max-h-[90dvh] flex flex-col">
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-rose-500/10 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading truncate">
                    Quick Emergency Voice Report
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    Speak your situation in any language • Audio is analysed automatically
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors shrink-0 cursor-pointer"
                aria-label="Close Quick Voice Report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with internal scrolling for mobile keyboards */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
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
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Multilingual voice capture</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/reports/new');
                }}
                className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
              >
                <span>Manual Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

