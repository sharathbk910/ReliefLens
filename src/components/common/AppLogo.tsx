import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  badge?: string;
}

export function AppLogo({
  className = '',
  size = 'md',
  showText = true,
  subtitle = 'Crisis Coordination',
  badge = 'v1.0',
}: AppLogoProps) {
  const iconSizeClasses = {
    xs: 'w-6 h-6 rounded-md',
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-12 h-12 rounded-xl',
    xl: 'w-24 h-24 rounded-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${iconSizeClasses[size]} overflow-hidden bg-white/95 border border-teal-500/30 shadow-md shadow-teal-950/20 shrink-0 flex items-center justify-center relative p-0.5 transition-transform duration-200 hover:scale-105`}
      >
        <img
          src="/logo.png"
          alt="ReliefLens Logo"
          className="w-full h-full object-cover object-[center_20%] rounded-[inherit]"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="min-w-0">
          <div className="font-bold text-[var(--text-primary)] text-sm tracking-tight font-heading flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent font-extrabold">
              ReliefLens
            </span>
            {badge && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--border-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-[var(--text-muted)] truncate">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
