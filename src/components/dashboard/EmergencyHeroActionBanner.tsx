import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ShieldAlert, ArrowRight } from 'lucide-react';

interface EmergencyHeroActionBannerProps {
  onSyncLocation: () => void;
  isSyncingLocation: boolean;
}

export function EmergencyHeroActionBanner({
  onSyncLocation,
  isSyncingLocation,
}: EmergencyHeroActionBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl p-4 sm:p-5 border border-sky-200/90 dark:border-slate-800 bg-gradient-to-r from-sky-50/70 via-white to-teal-50/50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800 shadow-sm relative overflow-hidden select-none">
      {/* Subtle modern accent glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-sky-300/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left Side: Human Friendly Emergency Message */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Active Disaster Response System
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              24/7 Human Rescue Coordination
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
            Need Emergency Relief or Life Rescue?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Report crises instantly using voice in any language or structured forms. Emergency teams prioritize trapped victims and vulnerable families first.
          </p>
        </div>

        {/* Right Side: Streamlined Emergency Action Buttons (Clean & Non-Redundant) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Main SOS Report Button */}
          <button
            type="button"
            onClick={() => navigate('/reports/new')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Report Emergency</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Voice SOS Quick Action */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-voice-modal'))}
            className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-sky-800 dark:bg-slate-800 dark:border-slate-700 dark:text-sky-300 font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs"
            title="Speak emergency report with AI multilingual voice recognition"
          >
            <Mic className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Voice SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
