import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Phone, Mic, MapPin, Plus, ShieldAlert, Crosshair, ArrowRight, HeartPulse } from 'lucide-react';

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
    <div className="surface-z2 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-[#141611]/95 to-amber-950/30 shadow-xl shadow-rose-950/20 relative overflow-hidden select-none">
      {/* Background Subtle Emergency Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left Side: Human Friendly Emergency Message */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Active Disaster Response System
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono hidden sm:inline">
              24/7 Human Rescue Coordination
            </span>
          </div>

          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold font-heading text-white tracking-tight">
            Need Emergency Relief or Life Rescue?
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Report crises instantly using voice in any language or one-click forms. Emergency teams prioritize trapped victims and vulnerable families first.
          </p>
        </div>

        {/* Right Side: Primary Emergency Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Main SOS Report Button */}
          <button
            type="button"
            onClick={() => navigate('/reports/new')}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Report Emergency</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Voice SOS Button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-voice-modal'))}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-amber-300 font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Mic className="w-4 h-4 text-[#EBFC72]" />
            <span>VOICE SOS</span>
          </button>

          {/* Direct 112 Helpline Button */}
          <a
            href="tel:112"
            className="px-3.5 py-2.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all hover:border-rose-400"
            title="Direct phone call to 112 National Emergency Hotline"
          >
            <Phone className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>DIAL 112</span>
          </a>
        </div>
      </div>
    </div>
  );
}
