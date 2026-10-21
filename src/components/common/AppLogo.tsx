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

export function ResQWaveIconMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="ResQWave Logo"
      className={`${className} object-contain select-none drop-shadow-sm transition-transform duration-200`}
      width={128}
      height={128}
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
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const shouldShowText = variant !== 'icon' && showText;
  const shouldShowTagline = variant === 'full' && showTagline;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Mark with crisp modern presentation */}
      <div
        className={`${iconSizeClasses[size]} shrink-0 flex items-center justify-center transition-transform duration-200 hover:scale-105`}
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
