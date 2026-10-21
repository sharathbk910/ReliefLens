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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

  // Initialize theme from system or saved preference (defaults to clean modern light theme)
  useEffect(() => {
    const saved = localStorage.getItem('resqwave-theme') || localStorage.getItem('relieflens-theme');
    if (saved === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('resqwave-theme', next);
    localStorage.setItem('relieflens-theme', next);
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
      <header className="sticky top-0 z-40 px-3 md:px-6 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-1-solid)]/95 backdrop-blur-md text-xs select-none shadow-sm">
        <div className="flex items-center justify-between gap-2.5 max-w-7xl mx-auto w-full flex-nowrap min-w-0">
          <div className="md:hidden shrink-0">
            <AppLogo size="xs" showText={false} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="emergency-pulse-dot"></span>
            <span className="font-mono text-[10px] sm:text-xs font-bold text-amber-400 tracking-wider uppercase hidden xs:inline">
              ACTIVE DISASTER RESPONSE ZONE
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0 flex-nowrap">
            {/* FIXED LOGGED-IN DETAILS PILL & PERSONA SWITCHER */}
            <div className="relative shrink-0" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2-solid)] hover:bg-[var(--border-subtle)] border border-amber-400/40 hover:border-amber-400 transition-all cursor-pointer shadow-sm"
                title={`Logged in as ${currentUser.display_name} (${currentUser.role}). Tap to switch persona.`}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                  {currentUser.display_name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block max-w-[180px] md:max-w-[220px]">
                  <p className="text-xs font-bold text-[var(--text-primary)] leading-tight whitespace-nowrap">
                    {currentUser.display_name}
                  </p>
                  <p className="text-xs uppercase font-mono text-amber-400 font-bold leading-none">
                    {currentUser.role}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
              </button>

              {/* Persona Switcher Dropdown Popover */}
              {userDropdownOpen && (
                <div className="!absolute right-0 top-full mt-1.5 w-60 z-[100] shadow-xl bg-[var(--surface-1-solid)] backdrop-blur-xl border border-[var(--border-strong)] rounded-xl p-2.5 animate-spatial-enter select-auto">
                  <div className="px-2 py-1.5 border-b border-[var(--border-subtle)] mb-1">
                    <p className="text-xs font-mono text-[var(--text-muted)] font-medium">
                      Currently logged in:
                    </p>
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {currentUser.display_name}
                    </p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400/20 text-amber-300 mt-1 border border-amber-400/30">
                      Role: {currentUser.role}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[var(--text-muted)] px-2 py-1">
                    Switch active persona:
                  </p>
                  {(['admin', 'coordinator', 'reporter', 'viewer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                        currentUser.role === r
                          ? 'bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/30'
                          : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--border-subtle)]'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {currentUser.role === r && (
                        <span className="text-[10px] font-mono font-bold text-amber-400">ACTIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Functional Divider separating user identity from system utilities */}
            <div className="h-5 w-px bg-[var(--border-subtle)] mx-1 hidden sm:block" />

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
              ) : (
                <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
            </button>
            <button
              onClick={handleResetData}
              title="Reset simulated scenario data"
              className="hidden lg:flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 font-mono transition-colors"
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
        {/* 2. Floating Spatial Navigation Rail (Desktop & Tablet) */}
        <aside
          aria-label="Primary Navigation"
          className="hidden md:flex flex-col m-3 md:m-4 w-16 lg:w-60 surface-z2 shrink-0 transition-all duration-300 z-30 select-none rounded-xl"
        >
          {/* Logo & Operational Status */}
          <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-center lg:justify-start">
            <AppLogo size="md" showText={false} className="lg:hidden" />
            <AppLogo size="md" showText={true} className="hidden lg:flex" />
          </div>

          {/* New Report Secondary Action (Preserves dominance of hero emergency trigger) */}
          <div className="p-2.5">
            {currentUser.role !== 'viewer' ? (
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center lg:justify-start px-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-mono font-medium tracking-wide border border-slate-700 rounded-lg shadow-sm"
                leftIcon={<Plus className="w-4 h-4 shrink-0 text-amber-400" strokeWidth={2} />}
                onClick={() => navigate('/reports/new')}
                title="Create New Incident Report"
              >
                <span className="hidden lg:inline text-xs">New Report</span>
              </Button>
            ) : (
              <div
                title="Viewers have read-only access and cannot submit reports."
                className="p-2 rounded-lg bg-[var(--border-subtle)] text-xs text-[var(--text-muted)] text-center flex items-center justify-center font-mono"
              >
                <Lock className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden lg:inline ml-1.5 text-xs">Read-Only</span>
              </div>
            )}
          </div>

          {/* Navigation Links with Tactical Highlight */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-amber-400/10 text-amber-300 border border-amber-400/40 shadow-sm font-bold'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--border-subtle)]'
                  }`
                }
              >
                {item.icon}
                <span className="hidden lg:inline truncate tracking-tight">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Quick Crisis Hotline Card in Sidebar */}
          <div className="hidden lg:block mx-2.5 mb-2 p-2.5 rounded-xl bg-black/40 border border-rose-500/25 space-y-2 select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-rose-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                24/7 Crisis Helpline
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">TOLL-FREE</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <a
                href="tel:112"
                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-center font-mono font-bold text-xs text-rose-200 hover:text-white transition-colors"
                title="Dial 112 National Emergency"
              >
                112
              </a>
              <a
                href="tel:108"
                className="p-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-center font-mono font-bold text-xs text-amber-200 hover:text-white transition-colors"
                title="Dial 108 Disaster Ambulance"
              >
                108
              </a>
              <a
                href="tel:101"
                className="p-1 rounded bg-orange-950/60 hover:bg-orange-900 border border-orange-500/30 text-center font-mono font-bold text-xs text-orange-200 hover:text-white transition-colors"
                title="Dial 101 Fire & Rescue"
              >
                101
              </a>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-normal text-center">
              Direct live emergency response line
            </p>
          </div>

          {/* User Account / Active Identity Display in Sidebar Bottom (Clean status, no duplicate dropdown) */}
          <div className="mt-auto bg-[var(--surface-1-solid)] p-2.5 border-t border-[var(--border-subtle)] rounded-b-xl">
            <div
              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-[var(--surface-1-solid)] border border-[var(--border-subtle)]"
              title={`Logged in as ${currentUser.display_name}. Use top-right profile to change persona.`}
            >
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                {currentUser.display_name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left truncate min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {currentUser.display_name}
                </p>
                <p className="text-[10px] uppercase font-mono text-amber-400 font-bold">
                  {currentUser.role}
                </p>
              </div>
            </div>
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
