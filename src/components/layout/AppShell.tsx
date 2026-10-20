import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CopyCheck,
  MapPin,
  ShieldAlert,
  PlusCircle,
  Menu,
  X,
  AlertOctagon,
  UserCheck,
  LogOut,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { dataService } from '../../lib/dataService.ts';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';
import type { UserRole } from '../../shared/types.ts';

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const currentUser = dataService.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleRoleChange = (role: UserRole) => {
    const updated = dataService.setCurrentUserRole(role);
    setUserDropdownOpen(false);
    toast.info(`Switched Active Role`, `Now acting as ${updated.display_name} (${role.toUpperCase()})`);
    // If on /audit and switched to non-admin, redirect to /dashboard
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
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      to: '/duplicates',
      label: 'Duplicate Review',
      icon: <CopyCheck className="w-4 h-4" />,
    },
    {
      to: '/map',
      label: 'Geographic Map',
      icon: <MapPin className="w-4 h-4" />,
    },
    ...(currentUser.role === 'admin'
      ? [
          {
            to: '/audit',
            label: 'Audit Log',
            icon: <ShieldAlert className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* 1. Mandatory Safety Disclaimer Banner (Section 18) */}
      <div className="bg-amber-950/40 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200/90 flex items-center justify-between z-40 backdrop-blur-sm">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="leading-tight">
            <strong>Prototype:</strong> ReliefLens supports emergency coordination decisions but is not an official emergency-service system. Do not use it as the sole source for emergency triage.
          </span>
        </div>
        <button
          onClick={handleResetData}
          title="Reset simulated data"
          className="hidden md:flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-200 px-2 py-0.5 rounded bg-amber-900/30 border border-amber-600/30"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Seed Data</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-950/70 border-r border-slate-800 shrink-0">
          {/* Logo / Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-sm">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-tight font-heading flex items-center gap-1.5">
                ReliefLens
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Emergency Coordination</p>
            </div>
          </div>

          {/* Primary Action: New Report */}
          <div className="p-4 pb-2">
            {currentUser.role !== 'viewer' ? (
              <Button
                variant="primary"
                size="md"
                className="w-full justify-start shadow-md shadow-rose-950/20"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                onClick={() => navigate('/reports/new')}
              >
                New Incident Report
              </Button>
            ) : (
              <div
                title="Viewers have read-only access and cannot submit reports."
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center"
              >
                🔒 Read-Only Viewer Mode
              </div>
            )}
          </div>

          {/* Navigation Items (Section 6) */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Account / Role Switcher Menu */}
          <div className="p-3 border-t border-slate-800/80 relative">
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-rose-400 shrink-0">
                  {currentUser.display_name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.display_name}
                  </p>
                  <p className="text-[10px] uppercase font-mono text-slate-400">
                    Role: {currentUser.role}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            {/* Role Switcher Popover */}
            {userDropdownOpen && (
              <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 z-50 animate-slide-down">
                <p className="text-[10px] uppercase font-mono text-slate-400 px-2 py-1">
                  Switch Role Persona:
                </p>
                {(['admin', 'coordinator', 'viewer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                      currentUser.role === r
                        ? 'bg-rose-950/60 text-rose-200 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="capitalize">{r}</span>
                    {currentUser.role === r && <UserCheck className="w-3 h-3 text-rose-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 3. Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Mobile Topbar */}
          <header className="md:hidden flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-bold text-white text-sm font-heading">ReliefLens</span>
            </div>
            <div className="flex items-center gap-2">
              {currentUser.role !== 'viewer' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/reports/new')}
                >
                  New Report
                </Button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-2 z-30 animate-slide-down">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Active Role: <strong className="text-white capitalize">{currentUser.role}</strong></span>
                <button
                  onClick={() => handleRoleChange(currentUser.role === 'coordinator' ? 'admin' : currentUser.role === 'admin' ? 'viewer' : 'coordinator')}
                  className="text-xs text-rose-400 underline"
                >
                  Toggle Role
                </button>
              </div>
            </div>
          )}

          {/* Route Outlet */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
