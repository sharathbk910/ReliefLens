import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { dataService } from '../lib/dataService.ts';
import { Button } from '../components/ui/Button.tsx';

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthRedirect() {
      // Check for error parameters in query or hash fragment
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash
      );

      const error = params.get('error') || hashParams.get('error');
      const errorDescription =
        params.get('error_description') ||
        hashParams.get('error_description') ||
        params.get('error_message');

      if (error || errorDescription) {
        setStatus('error');
        setErrorMessage(
          errorDescription || error || 'Authentication was denied or encountered an error.'
        );
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        setStatus('error');
        setErrorMessage(
          'Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
        );
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (data.session) {
          setStatus('success');
          // Ingest/update profile or set current role
          dataService.setCurrentUserRole('reporter');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 800);
        } else {
          // Listen for auth state change if session is still settling
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                setStatus('success');
                dataService.setCurrentUserRole('reporter');
                setTimeout(() => {
                  navigate('/dashboard', { replace: true });
                }, 800);
              }
            }
          );

          // Fallback timeout
          setTimeout(() => {
            if (status === 'processing') {
              setStatus('error');
              setErrorMessage('Authentication session timed out. Please try logging in again.');
            }
          }, 6000);
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred during authentication callback.');
      }
    }

    handleAuthRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        {status === 'processing' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h2 className="text-base font-semibold text-white">Completing Sign-In</h2>
            <p className="text-xs text-slate-400">
              Validating authentication credentials and restoring your session...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-emerald-300">Authentication Successful</h2>
            <p className="text-xs text-slate-400">
              Welcome to ResQWave. Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-rose-300">Sign-In Failed</h2>
            <p className="text-xs text-slate-300 leading-relaxed bg-rose-950/30 p-3 rounded-lg border border-rose-800/40">
              {errorMessage}
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}