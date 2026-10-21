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
    <img
      src="/favicon.svg"
      alt="ResQWave Mark"
      className={`${className} object-contain select-none`}
      width={64}
      height={64}
      loading="eager"
      decoding="async"
    />
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
