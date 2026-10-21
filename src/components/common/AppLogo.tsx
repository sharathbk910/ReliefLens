import React from 'react';

export interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'icon';
  showText?: boolean;
  showTagline?: boolean;
  tagline?: string;
  badge?: string;
}

export function ResQWaveIconMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Ocean Blue Gradient */}
        <linearGradient id="rlLogoOcean" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        {/* Teal Wave Gradient */}
        <linearGradient id="rlLogoTeal" x1="12" y1="28" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        {/* Light Cyan Signal Waves */}
        <linearGradient id="rlLogoCyan" x1="16" y1="8" x2="48" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        {/* Emergency Beacon Core */}
        <radialGradient id="rlLogoBeacon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
      </defs>

      {/* Communication Signal Wave Arcs */}
      <path
        d="M20 18C23.6 14.4 28.5 12.2 34 12.2C39.5 12.2 44.4 14.4 48 18"
        stroke="url(#rlLogoCyan)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M24 22C26.5 19.5 30.1 18 34 18C37.9 18 41.5 19.5 44 22"
        stroke="url(#rlLogoCyan)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Primary Flowing Ocean Blue Beacon Wave */}
      <path
        d="M34 15C25.2 15 18 22.2 18 31C18 38.5 24 45.5 31.5 54.2C32.8 55.7 35.2 55.7 36.5 54.2C39.2 51.1 42.5 47.2 45.4 43C42 43.8 38 42.8 35 40.5C29.5 36.2 29.8 28.5 35.6 25C39.8 22.5 44.8 23.2 48.2 26.2C49.3 27.2 50 29.1 50 31C50 22.2 42.8 15 34 15Z"
        fill="url(#rlLogoOcean)"
      />

      {/* Dynamic Secondary Surge Wave (Teal) */}
      <path
        d="M12 43C16.5 37.5 22.5 37 28 41C33.5 45 40 45.5 46.5 41C48.8 39.4 51.2 37.2 53 35C52.5 41.5 48.5 47.5 42.8 51.2C38 54.3 32 54.5 26.5 51.8C20.8 49 16 45.5 12 43Z"
        fill="url(#rlLogoTeal)"
      />

      {/* Light Cyan Crest Highlight */}
      <path
        d="M16 45C20.5 41 25.5 41.5 30 44.5C35 48 41.5 47.5 47 43.5C45.2 46.8 41.8 49.5 37.5 50.8C30.5 52.8 22.5 50.5 16 45Z"
        fill="#e0f2fe"
        opacity="0.8"
      />

      {/* Emergency Beacon Center Point */}
      <circle cx="34" cy="30" r="5" fill="url(#rlLogoBeacon)" />
      <circle cx="34" cy="30" r="2" fill="#ffffff" />
    </svg>
  );
}

export function AppLogo({
  className = '',
  size = 'md',
  variant = 'full',
  showText = true,
  showTagline = false,
  tagline = 'Connecting Emergencies to Action',
  badge = 'v1.0',
}: AppLogoProps) {
  const iconSizeClasses = {
    xs: 'w-6 h-6 p-0.5',
    sm: 'w-7 h-7 p-0.5',
    md: 'w-9 h-9 p-1',
    lg: 'w-12 h-12 p-1.5',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 p-2',
  };

  const shouldShowText = variant !== 'icon' && showText;
  const shouldShowTagline = variant === 'full' && showTagline;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Mark with subtle modern containment */}
      <div
        className={`${iconSizeClasses[size]} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-b from-sky-50 to-white dark:from-slate-800 dark:to-slate-900 border border-sky-200/80 dark:border-teal-500/30 shadow-sm transition-transform duration-200 hover:scale-105`}
      >
        <ResQWaveIconMark className="w-full h-full" />
      </div>

      {shouldShowText && (
        <div className="min-w-0">
          <div className="font-bold font-heading tracking-tight flex items-center gap-1.5 leading-none">
            <span className="text-base sm:text-lg font-extrabold flex items-center tracking-tight">
              <span className="text-[#0284c7]">Res</span>
              <span className="text-[#ea580c]">Q</span>
              <span className="text-[#0d9488]">Wave</span>
            </span>
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100/80 text-sky-800 border border-sky-200 dark:bg-slate-800 dark:text-sky-300 dark:border-slate-700 uppercase font-semibold">
                {badge}
              </span>
            )}
          </div>
          {shouldShowTagline ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {tagline}
            </p>
          ) : (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider truncate mt-0.5">
              Disaster Response
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AppLogo;
