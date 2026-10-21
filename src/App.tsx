import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { AuthCallback } from './pages/AuthCallback.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { IncidentDetailPage } from './pages/IncidentDetailPage.tsx';
import { ReportFormPage } from './pages/ReportFormPage.tsx';
import { DuplicatesPage } from './pages/DuplicatesPage.tsx';
import { MapPage } from './pages/MapPage.tsx';
import { AuditPage } from './pages/AuditPage.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

export function App() {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const geminiKey = urlParams.get('gemini_key');
        if (geminiKey && geminiKey.trim()) {
          localStorage.setItem('relieflens_gemini_key', geminiKey.trim());
          urlParams.delete('gemini_key');
          const newSearch = urlParams.toString();
          const newUrl =
            window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (e) {
        console.warn('Failed to parse URL params for gemini_key', e);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              {/* Landing Page with Obsidian & Lime System */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Authenticated Application Shell */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/incidents/:id" element={<IncidentDetailPage />} />
                <Route path="/reports/new" element={<ReportFormPage />} />
                <Route path="/duplicates" element={<DuplicatesPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
