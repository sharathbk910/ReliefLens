import React from 'react';
import { X, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';
import type { Incident } from '../../shared/types.ts';
import { Button } from '../ui/Button.tsx';

interface DispatchExportModalProps {
  incidents: Incident[];
  isOpen: boolean;
  onClose: () => void;
}

export function DispatchExportModal({
  incidents,
  isOpen,
  onClose,
}: DispatchExportModalProps) {
  if (!isOpen) return null;

  const exportCSV = () => {
    const headers = [
      'Incident ID',
      'Title',
      'Type',
      'Priority Tier',
      'Priority Score',
      'Status',
      'District',
      'Location Description',
      'Latitude',
      'Longitude',
      'People at Risk',
      'Immediate Danger',
      'Created At',
    ];

    const rows = incidents.map((inc) => [
      `"${inc.id}"`,
      `"${(inc.title || '').replace(/"/g, '""')}"`,
      `"${inc.incident_type}"`,
      `"${inc.priority_tier.toUpperCase()}"`,
      inc.effective_score,
      `"${inc.status}"`,
      `"${(inc.district || '').replace(/"/g, '""')}"`,
      `"${(inc.location_text || '').replace(/"/g, '""')}"`,
      inc.latitude ?? '',
      inc.longitude ?? '',
      inc.people_at_risk_estimate ?? '',
      (inc.score_breakdown?.factors?.immediate_danger?.points ?? 0) > 0 ? 'YES' : 'NO',
      `"${new Date(inc.first_reported_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `ResQWave_Dispatch_Manifest_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printManifest = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:backdrop-blur-none">
      <div className="w-full max-w-4xl surface-z3 rounded-2xl border border-[var(--border-strong)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Header (Hidden when printing) */}
        <div className="p-4 md:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-1)] print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                Export Field Dispatch Manifest
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {incidents.length} active emergency incident(s) selected for deployment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={printManifest}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Print Sheet
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={exportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs bg-rose-600 hover:bg-rose-500"
            >
              Download CSV
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Manifest Preview */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900/60 print:bg-white print:text-black print:p-0">
          <div className="mb-4 pb-4 border-b border-[var(--border-subtle)] print:border-black flex justify-between items-start">
            <div>
              <h2 className="text-base font-bold font-heading text-[var(--text-primary)] print:text-black">
                ResQWave Emergency Operations — Dispatch Manifest
              </h2>
              <p className="text-xs text-[var(--text-muted)] print:text-gray-700 mt-0.5">
                Generated: {new Date().toLocaleString()} • Priority-sorted for field crew deployment
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-[var(--text-secondary)] print:text-black">
              Total Incidents: {incidents.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] print:border-black text-[var(--text-secondary)] print:text-black font-semibold">
                  <th className="py-2 px-2">Priority</th>
                  <th className="py-2 px-2">Incident Title</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2">District / Coordinates</th>
                  <th className="py-2 px-2 text-right">People at Risk</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] print:divide-gray-300">
                {incidents.slice(0, 100).map((inc) => (
                  <tr key={inc.id} className="hover:bg-[var(--border-subtle)]/40 print:hover:bg-transparent">
                    <td className="py-2.5 px-2 font-mono font-bold text-rose-400 print:text-black">
                      {inc.priority_tier.toUpperCase()} ({inc.effective_score})
                    </td>
                    <td className="py-2.5 px-2 font-medium text-[var(--text-primary)] print:text-black">
                      {inc.title}
                      {(inc.score_breakdown?.factors?.immediate_danger?.points ?? 0) > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-400 print:border print:border-red-600 print:text-red-700">
                          IMMEDIATE DANGER
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 capitalize text-[var(--text-secondary)] print:text-black">
                      {inc.incident_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-2 text-[var(--text-secondary)] print:text-black">
                      <div>{inc.district || inc.location_text || 'Unspecified'}</div>
                      {inc.latitude && inc.longitude && (
                        <div className="text-[10px] font-mono opacity-80">
                          {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-[var(--text-primary)] print:text-black">
                      {inc.people_at_risk_estimate ?? '-'}
                    </td>
                    <td className="py-2.5 px-2 uppercase font-mono text-[10px] text-[var(--text-muted)] print:text-black">
                      {inc.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Printable Signature Section */}
          <div className="hidden print:grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-black text-xs text-black">
            <div>
              <div className="font-semibold mb-6">Dispatch Officer Signature:</div>
              <div className="border-b border-black"></div>
            </div>
            <div>
              <div className="font-semibold mb-6">Lead Responders Assigned:</div>
              <div className="border-b border-black"></div>
            </div>
            <div>
              <div className="font-semibold mb-6">Departure Timestamp:</div>
              <div className="border-b border-black"></div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden when printing) */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] flex items-center justify-between text-xs text-[var(--text-muted)] print:hidden">
          <span>Formatted for field clipboard & CAD/GIS import</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
