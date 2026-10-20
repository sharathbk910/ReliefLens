import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Eye,
  ShieldAlert,
  Mail,
  Key,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import type { UserRole } from '../shared/types.ts';

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
            toast.success('Sandbox Password Reset', 'In sandbox mode, use Quick Demo personas below.');
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
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 font-sans text-slate-100 selection:bg-rose-500/30">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-rose-950/40">
            🎯
          </div>
          <h1 className="text-2xl font-bold font-heading text-white tracking-tight">
            ReliefLens
          </h1>
          <p className="text-xs text-slate-400">
            Transparent Emergency Response Coordination & Incident Prioritization
          </p>
        </div>

        {/* Quick Demo Personas (Section 11 Role Model) */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 font-mono">
              <UserCheck className="w-4 h-4" />
              Quick Demo Personas
            </h2>
            <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
              Instant Switch
            </Badge>
          </div>

          <div className="space-y-2 pt-1">
            {/* Coordinator Persona */}
            <button
              onClick={() => handleQuickLogin('coordinator')}
              className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span>Coordinator Marco Chen</span>
                  <span className="text-[9px] font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-700/50 uppercase">
                    Coordinator
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Create reports, review duplicates, verify status, manage incidents.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Admin Persona */}
            <button
              onClick={() => handleQuickLogin('admin')}
              className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span>Chief Sarah Reynolds</span>
                  <span className="text-[9px] font-mono bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded border border-rose-700/50 uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Full system access: audit trails, role promotions, batch rescore.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Reporter Persona (Least-privileged citizen/volunteer) */}
            <button
              onClick={() => handleQuickLogin('reporter')}
              className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span>Citizen Reporter Priya Rao</span>
                  <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/50 uppercase">
                    Reporter
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Submit multilingual voice/manual reports as unverified; no coordinator access.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Viewer Persona */}
            <button
              onClick={() => handleQuickLogin('viewer')}
              className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span>Field Analyst Elena Rostova</span>
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700 uppercase">
                    Viewer
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Read-only view: dashboard, map, scoring breakdown, duplicate queue.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        </div>

        {/* Live Supabase Auth & Google OAuth Form */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">
              Supabase Authentication
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {isSupabaseConfigured ? '🟢 Supabase Active' : '⚪ Sandbox Mode'}
            </span>
          </div>

          {/* Google Sign-In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-sm"
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
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign In with Google'}</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Full Name / Agency Call Sign
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Officer Jane Doe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Official Agency / Reporter Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@emergency.gov"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {authMode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-400">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('reset')}
                      className="text-[11px] text-slate-400 hover:text-rose-400"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              {authMode === 'signin'
                ? 'Sign In to Workspace'
                : authMode === 'signup'
                ? 'Create Reporter Account'
                : 'Send Password Reset Email'}
            </Button>
          </form>

          {/* Toggle between Sign In / Sign Up / Cancel Reset */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            {authMode === 'reset' ? (
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-rose-400 hover:underline mx-auto"
              >
                Back to Sign In
              </button>
            ) : authMode === 'signin' ? (
              <>
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-rose-400 hover:underline font-semibold"
                >
                  Register as Reporter
                </button>
              </>
            ) : (
              <>
                <span>Already registered?</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-rose-400 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Informative Footer */}
        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          ReliefLens Prototype Edition • Transparent Emergency Incident Response
        </p>
      </div>
    </div>
  );
}
