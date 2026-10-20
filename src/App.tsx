import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { IncidentDetailPage } from './pages/IncidentDetailPage.tsx';
import { ReportFormPage } from './pages/ReportFormPage.tsx';
import { DuplicatesPage } from './pages/DuplicatesPage.tsx';
import { MapPage } from './pages/MapPage.tsx';
import { AuditPage } from './pages/AuditPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Shell */}
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
