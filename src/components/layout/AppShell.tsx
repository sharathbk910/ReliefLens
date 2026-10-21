import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { dataService } from '../../lib/dataService.ts';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';
import { EmergencyVoiceFAB } from '../emergency/EmergencyVoiceFAB.tsx';
import { OfflineBanner } from '../offline/OfflineBanner.tsx';
import type { UserRole } from '../../shared/types.ts';

export function AppShell() {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const currentUser = dataService.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Initialize theme from system or saved preference
  useEffect(() => {
    const saved = localStorage.getItem('relieflens-theme');
    if (saved === 'light' || (!saved && window.matchMedia('(prefers-color-scheme: light)').matches)) {
      setTheme('light');
      document.documentElement.classList.add('light');
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('relieflens-theme', next);
    if (next === 'light') {
      document.documentElement.classList.add('light');
    } else {
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
    <div className="min-h-screen flex flex-col font-sans relative bg-[#0c0c0c] text-[#ebebeb] selection:bg-[#ccff00] selection:text-black overflow-x-hidden">
      {/* Background Grid Pattern & Ambient Glows */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#ccff00]/5 blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#10b981]/5 blur-[140px] pointer-events-none z-0" />

      {/* 1. Mandatory Safety Disclaimer Banner (Spatial Topbar) */}
      <header className="z-40 px-3 md:px-6 py-2 border-b border-white/10 bg-[#0c0c0c]/80 backdrop-blur-xl text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <AlertTriangle className="w-3.5 h-3.5 text-[#ccff00] shrink-0" strokeWidth={2} />
          <span className="leading-tight text-white/60 text-[10px] sm:text-xs truncate sm:whitespace-normal font-mono">
            <strong className="text-[#ccff00] font-bold">PROTOTYPE // 0x01:</strong> <span className="hidden sm:inline">ReliefLens provides decision support for emergency coordination.</span> Not for 911 dispatch.
          </span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" strokeWidth={1.8} />
              ) : (
                <Moon className="w-3.5 h-3.5" strokeWidth={1.8} />
              )}
            </button>
            <button
              onClick={handleResetData}
              title="Reset simulated scenario data"
              className="hidden sm:flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#ccff00] hover:text-black px-2.5 py-1 rounded-full border border-[#ccff00]/40 hover:bg-[#ccff00] transition-colors"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={2} />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Connectivity & Offline Sync Status Banner */}
      <OfflineBanner />

      {/* Main Spatial Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* 2. Floating Spatial Navigation Rail (Desktop & Tablet) */}
        <aside
          aria-label="Primary Navigation"
          className="hidden md:flex flex-col m-3 md:m-4 w-16 lg:w-60 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shrink-0 transition-all duration-300 z-30 select-none overflow-hidden"
        >
          {/* Logo & Operational Status */}
          <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center gap-2.5">
            <button
              onClick={() => navigate('/')}
              title="Return to System Overview"
              className="w-8 h-8 rounded-lg bg-[#ccff00] text-black font-bold flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-105 transition-transform"
            >
              <Radio className="w-4 h-4 text-black" strokeWidth={2.2} />
            </button>
            <div className="hidden lg:block min-w-0">
              <div className="font-bold text-[var(--text-primary)] text-sm tracking-tight font-heading flex items-center gap-1.5">
                <span>ReliefLens</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] truncate font-mono uppercase tracking-wider">
                Industrial_Core
              </p>
            </div>
          </div>

          {/* New Report Primary Action */}
          <div className="p-2.5">
            {currentUser.role !== 'viewer' ? (
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center lg:justify-start shadow-md px-2.5"
                leftIcon={<Plus className="w-4 h-4 shrink-0" strokeWidth={2} />}
                onClick={() => navigate('/reports/new')}
                title="Create New Emergency Report"
              >
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider font-mono">New Report</span>
              </Button>
            ) : (
              <div
                title="Viewers have read-only access and cannot submit reports."
                className="p-2 rounded-lg bg-[var(--border-subtle)] text-xs text-[var(--text-muted)] text-center flex items-center justify-center font-mono"
              >
                <Lock className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden lg:inline ml-1.5 text-[11px]">Read-Only</span>
              </div>
            )}
          </div>

          {/* Navigation Links with Spatial Transform Highlight */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 shadow-[0_0_15px_rgba(204,255,0,0.15)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
                  }`
                }
              >
                {item.icon}
                <span className="hidden lg:inline truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Account / Role Switcher Popover */}
          <div className="p-2.5 border-t border-[var(--border-subtle)] relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-label="User Account and Persona Menu"
              className="w-full flex items-center justify-between p-1.5 lg:p-2 rounded-lg hover:bg-[var(--border-subtle)] transition-colors border border-transparent hover:border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#ccff00]/15 border border-[#ccff00]/40 flex items-center justify-center text-xs font-bold text-[#ccff00] shrink-0 font-mono">
                  {currentUser.display_name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left truncate min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {currentUser.display_name}
                  </p>
                  <p className="text-[10px] uppercase font-mono text-[var(--text-muted)]">
                    {currentUser.role}
                  </p>
                </div>
              </div>
              <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
            </button>

            {/* Role Switcher Menu */}
            {userDropdownOpen && (
              <div className="absolute bottom-16 left-2 right-2 md:left-full md:bottom-2 md:ml-2 md:w-56 md:right-auto lg:left-2 lg:ml-0 lg:w-56 lg:bottom-16 surface-z2 p-2 z-50 animate-spatial-enter shadow-2xl">
                <p className="text-[10px] uppercase font-mono text-[var(--text-muted)] px-2 py-1">
                  Active Persona:
                </p>
                {(['admin', 'coordinator', 'reporter', 'viewer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors font-mono ${
                      currentUser.role === r
                        ? 'bg-[#ccff00]/15 text-[#ccff00] font-semibold border border-[#ccff00]/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
                    }`}
                  >
                    <span className="capitalize">{r}</span>
                    {currentUser.role === r && <UserCheck className="w-3.5 h-3.5 text-[#ccff00]" strokeWidth={1.5} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 3. Main Content Canvas */}
        <main
          id="main-content"
          className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${
            location.pathname === '/reports/new' || location.pathname === '/map'
              ? 'pb-4 md:pb-6'
              : 'pb-32 md:pb-16'
          }`}
        >
          <div className="flex-1 p-3 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 4. Mobile Floating Bottom Dock (Section D - 4 or fewer items, safe area padding) */}
      {location.pathname !== '/reports/new' && (
        <nav
          aria-label="Mobile Navigation Dock"
          className="md:hidden fixed bottom-2 left-2 right-2 z-50 surface-z2 px-2 py-1.5 flex items-center justify-around shadow-2xl border border-white/10"
          style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] transition-colors ${
                isActive ? 'text-[#ccff00] font-semibold' : 'text-[var(--text-muted)]'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" strokeWidth={1.5} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/duplicates"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] transition-colors ${
                isActive ? 'text-[#ccff00] font-semibold' : 'text-[var(--text-muted)]'
              }`
            }
          >
            <CopyCheck className="w-5 h-5 mb-0.5" strokeWidth={1.5} />
            <span>Duplicates</span>
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] transition-colors ${
                isActive ? 'text-[#ccff00] font-semibold' : 'text-[var(--text-muted)]'
              }`
            }
          >
            <MapPin className="w-5 h-5 mb-0.5" strokeWidth={1.5} />
            <span>Map</span>
          </NavLink>

          {currentUser.role !== 'viewer' ? (
            <button
              onClick={() => navigate('/reports/new')}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] text-[#ccff00] font-semibold"
            >
              <div className="w-6 h-6 rounded-full bg-[#ccff00] text-black flex items-center justify-center mb-0.5 shadow-[0_0_10px_rgba(204,255,0,0.4)]">
                <Plus className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <span>Report</span>
            </button>
          ) : (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] text-[var(--text-muted)]"
            >
              <User className="w-5 h-5 mb-0.5" strokeWidth={1.5} />
              <span>Role</span>
            </button>
          )}
        </nav>
      )}

      {/* 5. Persistent Emergency Quick Voice Action Button */}
      {currentUser.role !== 'viewer' && <EmergencyVoiceFAB />}
    </div>
  );
}
