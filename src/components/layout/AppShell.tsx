import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CopyCheck,
  MapPin,
  ShieldAlert,
  Plus,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  RefreshCw,
  Sun,
  Moon,
  Radio,
  Lock,
  User,
  SlidersHorizontal,
  Mic,
  LogOut,
  LogIn,
} from 'lucide-react';
import { dataService } from '../../lib/dataService.ts';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';
import { EmergencyVoiceFAB } from '../emergency/EmergencyVoiceFAB.tsx';
import { OfflineBanner } from '../offline/OfflineBanner.tsx';
import { AppLogo } from '../common/AppLogo.tsx';
import type { UserRole } from '../../shared/types.ts';

export function AppShell() {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const migrated = localStorage.getItem('resqwave-dark-default-v2');
      if (!migrated) {
        localStorage.setItem('resqwave-dark-default-v2', 'true');
        localStorage.setItem('resqwave-theme-mode', 'dark');
        localStorage.setItem('resqwave-theme', 'dark');
        return 'dark';
      }
      const saved = localStorage.getItem('resqwave-theme-mode');
      return saved === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });
  const currentUser = dataService.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Sync theme with HTML class
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('resqwave-dark-default-v2', 'true');
    localStorage.setItem('resqwave-theme-mode', next);
    localStorage.setItem('resqwave-theme', next);
    if (next === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  const handleRoleChange = (role: UserRole) => {
    const updated = dataService.setCurrentUserRole(role);
    setUserDropdownOpen(false);
    toast.info(`Switched Active Role`, `Now acting as ${updated.display_name} (${role.toUpperCase()})`);
    if (location.pathname === '/audit' && role !== 'admin') {
      navigate('/dashboard');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset local prototype database to default 60+ simulated reports and duplicate pairs?')) {
      dataService.resetSeedData();
      toast.success('Database Reset', 'Simulated emergency scenario restored.');
      window.location.reload();
    }
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" strokeWidth={1.5} />,
    },
    ...(currentUser.role !== 'viewer'
      ? [
          {
            to: '/reports/new',
            label: 'New Report',
            icon: <Plus className="w-5 h-5 shrink-0 text-sky-600 dark:text-sky-400" strokeWidth={2.5} />,
          },
        ]
      : []),
    {
      to: '/duplicates',
      label: 'Duplicate Review',
      icon: <CopyCheck className="w-5 h-5 shrink-0" strokeWidth={1.5} />,
    },
    {
      to: '/map',
      label: 'Geographic Map',
      icon: <MapPin className="w-5 h-5 shrink-0" strokeWidth={1.5} />,
    },
    ...(currentUser.role === 'admin'
      ? [
          {
            to: '/audit',
            label: 'Audit Log',
            icon: <ShieldAlert className="w-5 h-5 shrink-0" strokeWidth={1.5} />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans relative selection:bg-rose-500/20">
      {/* 1. Operational Topbar & Emergency Response Strip */}
      <header className="sticky top-0 z-40 px-3 md:px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-xs select-none shadow-xs">
        <div className="flex items-center justify-between gap-2.5 max-w-7xl mx-auto w-full flex-nowrap min-w-0">
          <div className="md:hidden shrink-0">
            <AppLogo size="xs" showText={false} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="emergency-pulse-dot"></span>
            <span className="font-mono text-[10px] sm:text-xs font-bold text-sky-700 dark:text-sky-300 tracking-wider uppercase hidden xs:inline">
              ACTIVE DISASTER RESPONSE ZONE
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0 flex-nowrap">
            {/* Direct Quick Account Link */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-sky-50 dark:text-slate-300 dark:hover:text-sky-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Go to Login / Account Settings"
            >
              <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Account & Roles</span>
            </button>

            {/* Functional Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
              )}
            </button>
            <button
              onClick={handleResetData}
              title="Reset simulated scenario data"
              className="hidden lg:flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-mono transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Connectivity & Offline Sync Status Banner */}
      <OfflineBanner />

      {/* Main Spatial Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 2. Floating Spatial Navigation Rail (Desktop & Tablet) - Sticky Viewport Docked */}
        <aside
          aria-label="Primary Navigation"
          className="hidden md:flex flex-col m-3 md:m-4 w-16 lg:w-60 surface-z2 shrink-0 transition-all duration-300 z-30 select-none rounded-xl sticky top-14 h-[calc(100vh-4.5rem)] self-start shadow-sm"
        >
          {/* Logo & Operational Status */}
          <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-center lg:justify-start">
            <AppLogo size="md" showText={false} className="lg:hidden" />
            <AppLogo size="md" showText={true} className="hidden lg:flex" />
          </div>

          {/* Navigation Links with Clean Modern Active Indicator */}
          <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {item.icon}
                <span className="hidden lg:inline truncate tracking-tight">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Account & Login Session Controls in Sidebar Bottom */}
          <div className="mt-auto p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 rounded-b-xl relative" ref={userDropdownRef}>
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-xs">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer hover:opacity-90 transition-opacity"
                title={`Logged in as ${currentUser.display_name}. Click to switch role.`}
              >
                <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 border border-sky-200 dark:border-sky-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser.display_name.charAt(0)}
                </div>
                <div className="hidden lg:block truncate min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {currentUser.display_name}
                  </p>
                  <p className="text-[10px] uppercase font-mono text-sky-600 dark:text-sky-400 font-bold">
                    {currentUser.role}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-500 hover:text-sky-700 hover:bg-sky-50 dark:text-slate-400 dark:hover:text-sky-300 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                title="Switch Account / Sign In"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            </div>

            {/* Persona Switcher Dropdown Popover */}
            {userDropdownOpen && (
              <div className="absolute left-2 bottom-full mb-2 w-56 z-[100] shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 animate-spatial-enter select-auto">
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700 mb-1">
                  <p className="text-[10px] font-mono text-slate-400 font-medium">Currently Active:</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser.display_name}</p>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 mt-1">
                    Role: {currentUser.role}
                  </span>
                </div>

                <p className="text-[10px] font-mono text-slate-400 px-2 py-1">Quick switch persona:</p>
                {(['admin', 'coordinator', 'reporter', 'viewer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      currentUser.role === r
                        ? 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="capitalize">{r}</span>
                    {currentUser.role === r && (
                      <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">ACTIVE</span>
                    )}
                  </button>
                ))}

                <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/login');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Go to Full Login Page</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 3. Main Content Canvas */}
        <main
          id="main-content"
          className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${
            location.pathname === '/reports/new' || location.pathname === '/map'
              ? 'pb-2 md:pb-4'
              : 'pb-20 md:pb-8'
          }`}
        >
          <div className="flex-1 p-2.5 sm:p-3.5 md:p-5 max-w-7xl mx-auto w-full animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 4. Mobile Floating Bottom Dock with Central Voice SOS (Never overlaps cards or controls) */}
      {location.pathname !== '/reports/new' && (
        <nav
          aria-label="Mobile Navigation Dock"
          className="md:hidden fixed bottom-2 left-2 right-2 z-50 surface-z2 px-2 py-1.5 flex items-center justify-around shadow-2xl border border-[var(--border-subtle)] rounded-2xl"
          style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
                isActive ? 'text-amber-300 font-bold' : 'text-[var(--text-muted)]'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
                isActive ? 'text-amber-300 font-bold' : 'text-[var(--text-muted)]'
              }`
            }
          >
            <MapPin className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
            <span>Map</span>
          </NavLink>

          {/* Central Raised Voice SOS Action */}
          {currentUser.role !== 'viewer' && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-emergency-voice-modal'))}
              className="flex flex-col items-center justify-center -mt-5 group focus:outline-none cursor-pointer"
              title="Speak emergency complaint via voice"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 group-hover:from-rose-500 group-hover:to-amber-400 border-2 border-white/20 flex items-center justify-center shadow-xl shadow-rose-950/70 transition-transform active:scale-90 relative">
                <span className="absolute -inset-1 rounded-full bg-rose-500/35 animate-ping pointer-events-none" />
                <Mic className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold text-amber-300 mt-0.5 font-mono">VOICE SOS</span>
            </button>
          )}

          <NavLink
            to="/duplicates"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
                isActive ? 'text-amber-300 font-bold' : 'text-[var(--text-muted)]'
              }`
            }
          >
            <CopyCheck className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
            <span>Duplicates</span>
          </NavLink>

          {currentUser.role !== 'viewer' ? (
            <button
              onClick={() => navigate('/reports/new')}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] text-teal-400 font-semibold cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mb-0.5">
                <Plus className="w-3.5 h-3.5 text-teal-300" strokeWidth={2} />
              </div>
              <span>Report</span>
            </button>
          ) : (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] text-[var(--text-muted)] cursor-pointer"
            >
              <User className="w-4 h-4 mb-0.5" strokeWidth={1.5} />
              <span>Role</span>
            </button>
          )}
        </nav>
      )}

      {/* 5. Persistent Emergency Quick Voice Action Modal */}
      {currentUser.role !== 'viewer' && <EmergencyVoiceFAB />}
    </div>
  );
}
