import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  User,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { AppLogo } from '../components/common/AppLogo.tsx';
import type { UserRole } from '../shared/types.ts';

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Quick Demo Login for instant testing of role permissions
  const handleQuickLogin = (role: UserRole) => {
    const profile = dataService.setCurrentUserRole(role);
    toast.success(`Signed In as ${profile.display_name}`, `Active Role: ${role.toUpperCase()}`);
    navigate('/dashboard');
  };

  // Google OAuth Sign-In via Supabase Auth
  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.warning(
        'Google Sign-In Requires Supabase Setup',
        'Configure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and Google OAuth in Supabase dashboard to enable live Google Sign-In.'
      );
      return;
    }

    try {
      setIsGoogleLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error('Google Sign-In Error', error.message);
      }
    } catch (err: any) {
      toast.error('Google Sign-In Failed', err.message || 'OAuth initialization failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Email & Password Auth (SignIn / SignUp / Reset)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.warning('Input Required', 'Please provide an email address.');
      return;
    }

    if (authMode !== 'reset' && !password) {
      toast.warning('Input Required', 'Please provide a password.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        if (authMode === 'reset') {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`,
          });
          if (error) throw error;
          toast.success('Password Reset Sent', 'Check your email for the recovery link.');
          setAuthMode('signin');
        } else if (authMode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName || email.split('@')[0],
                role: 'reporter', // Least-privileged role for new registrants
              },
            },
          });
          if (error) throw error;
          toast.success(
            'Registration Submitted',
            data.session
              ? 'Account created and authenticated!'
              : 'Please check your email to confirm your registration.'
          );
          if (data.session) {
            dataService.setCurrentUserRole('reporter');
            navigate('/dashboard');
          }
        } else {
          // Standard Sign In
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          toast.success('Signed In', `Welcome back, ${data.user?.email}`);
          navigate('/dashboard');
        }
      } else {
        // Local sandbox simulation when Supabase credentials are not connected
        setTimeout(() => {
          if (authMode === 'reset') {
            toast.success('Sandbox Password Reset', 'In sandbox mode, use Quick Demo personas.');
            setAuthMode('signin');
          } else {
            const profile = dataService.setCurrentUserRole('reporter');
            toast.success('Sandbox Login Successful', `Welcome, ${profile.display_name}`);
            navigate('/dashboard');
          }
          setIsLoading(false);
        }, 400);
        return;
      }
    } catch (err: any) {
      toast.error('Authentication Error', err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--canvas)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans text-[var(--text-primary)] selection:bg-sky-500/30 relative overflow-x-hidden">
      {/* Ambient background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-10 w-[500px] h-[350px] rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-[100px]"
      />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 shrink-0 py-1">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Return to operational dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Operations Dashboard</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          Active Incident Coordination Network
        </span>
      </header>

      {/* Main Centered Content Grid */}
      <main className="w-full max-w-5xl mx-auto my-auto py-4 z-10 space-y-6 animate-spatial-enter">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <AppLogo size="xl" showText={false} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight flex items-center justify-center gap-0.5">
              <span className="text-[#0284c7]">Res</span>
              <span className="text-[#ea580c]">Q</span>
              <span className="text-[#0d9488]">Wave</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Connecting Emergencies to Action • Incident Coordination Portal
            </p>
          </div>
        </div>

        {/* Dual-Column Layout: Auth Form on Left, Quick Demo Personas on Right (Side-by-side on md+, stacked on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-stretch">
          {/* Column 1: Supabase Authentication Form */}
          <section
            aria-label="Account Authentication"
            className="p-5 sm:p-6 surface-z2 rounded-2xl shadow-xl flex flex-col justify-between border border-[var(--border-subtle)] space-y-4"
          >
            <div>
              {/* Card Header */}
              <div className="border-b border-[var(--border-subtle)] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] font-heading">
                      {authMode === 'signin'
                        ? 'Sign In to Portal'
                        : authMode === 'signup'
                        ? 'Create Reporter Account'
                        : 'Reset Password'}
                    </h2>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] text-slate-600 dark:text-slate-300 border-[var(--border-strong)] flex items-center gap-1.5"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isSupabaseConfigured ? 'Supabase Active' : 'Sandbox Mode'}</span>
                </Badge>
              </div>

              {/* Welcome text */}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-4">
                {authMode === 'signin'
                  ? 'Sign in with your verified emergency credentials or Google SSO.'
                  : authMode === 'signup'
                  ? 'Register as an official disaster responder or citizen reporter.'
                  : 'Enter your account email to receive a recovery link.'}
              </p>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full h-10 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? 'Connecting to Google SSO...' : 'Sign In with Google SSO'}</span>
              </button>

              {/* Clear Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative px-3 bg-[var(--surface-2-solid)] text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400">
                  or continue with email
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Full Name / Agency Call Sign
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-slate-400 pointer-events-none">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Officer Jane Doe"
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Official Agency / Reporter Email
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="coordinator@emergency.gov"
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                {authMode !== 'reset' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-10 pl-9 pr-10 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me and Forgot Password Options Row */}
                {authMode === 'signin' && (
                  <div className="flex items-center justify-between pt-0.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500/30 dark:bg-slate-900 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('reset')}
                      className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Action Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-10 rounded-xl mt-1"
                  isLoading={isLoading}
                >
                  {authMode === 'signin'
                    ? 'Sign In to Workspace'
                    : authMode === 'signup'
                    ? 'Create Reporter Account'
                    : 'Send Password Reset Email'}
                </Button>
              </form>
            </div>

            {/* Mode Switcher Toggle Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              {authMode === 'reset' ? (
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
              ) : authMode === 'signin' ? (
                <div className="flex items-center gap-1.5">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                  >
                    Register as Reporter
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Already registered?</span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Column 2: Quick Demo Personas (Section 11 Role Model) */}
          <section
            aria-label="Demo Personas"
            className="p-5 sm:p-6 surface-z2 rounded-2xl shadow-xl flex flex-col justify-between border border-[var(--border-subtle)] space-y-4"
          >
            <div>
              {/* Card Header */}
              <div className="border-b border-[var(--border-subtle)] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 font-mono">
                      Quick Demo Personas
                    </h2>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] text-[var(--text-muted)] border-[var(--border-strong)]"
                >
                  Instant Switch
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 mb-3">
                Test role-based access control (RBAC) instantly without entering credentials:
              </p>

              {/* Persona Buttons List */}
              <div className="space-y-2.5">
                {/* Coordinator Persona */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('coordinator')}
                  className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-950/70 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors flex items-center gap-2 flex-wrap">
                      <span>Coordinator Marco Chen</span>
                      <span className="text-[9px] font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-700/50 uppercase font-bold">
                        Coordinator
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Create reports, review duplicates, verify status, manage incidents.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* Admin Persona */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-950/70 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors flex items-center gap-2 flex-wrap">
                      <span>Chief Sarah Reynolds</span>
                      <span className="text-[9px] font-mono bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-700/50 uppercase font-bold">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Full system access: audit trails, role promotions, batch rescore.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* Reporter Persona */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('reporter')}
                  className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-950/70 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-2 flex-wrap">
                      <span>Citizen Reporter Priya Rao</span>
                      <span className="text-[9px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-700/50 uppercase font-bold">
                        Reporter
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Submit multilingual voice/manual reports as unverified; no coordinator access.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* Viewer Persona */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('viewer')}
                  className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-950/70 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex items-center gap-2 flex-wrap">
                      <span>Field Analyst Elena Rostova</span>
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase font-bold">
                        Viewer
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Read-only view: dashboard, map, scoring breakdown, duplicate queue.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              </div>
            </div>

            {/* Quick Demo Footer Note */}
            <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Role permissions are enforced via RBAC with auditable action trails.
            </div>
          </section>
        </div>
      </main>

      {/* Informative Platform Footer */}
      <footer className="w-full max-w-5xl mx-auto py-2 z-10 shrink-0">
        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          ResQWave • Connecting Emergencies to Action • Incident Coordination Platform
        </p>
      </footer>
    </div>
  );
}
