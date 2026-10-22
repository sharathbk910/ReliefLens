import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  User,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { Button } from '../components/ui/Button.tsx';
import { Dialog } from '../components/ui/Dialog.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import type { AuditLogEntry } from '../shared/types.ts';

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRescoring, setIsRescoring] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const toast = useToast();
  const navigate = useNavigate();
  const currentUser = dataService.getCurrentUser();

  const loadLogs = useCallback(async () => {
    if (currentUser.role !== 'admin') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await dataService.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      toast.error('Failed to load audit logs', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentUser.role]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Role Protection: Only Admins can view audit logs (Section 4.9 & 11.7)
  if (currentUser.role !== 'admin') {
    return (
      <div className="surface-z1 border border-[var(--border-subtle)] p-8 text-center rounded-2xl max-w-lg mx-auto my-8 space-y-2">
        <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          The audit history log is restricted to authorized administrative personnel.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs text-rose-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Admin Batch Rescore (Section 12.6)
  const handleBatchRescore = async () => {
    if (!window.confirm('Run deterministic batch rescore across all active incidents using Ruleset v1.0.0?')) {
      return;
    }

    setIsRescoring(true);
    try {
      const res = await dataService.rescoreAllIncidents();
      toast.success(
        'Batch Rescore Complete',
        `Successfully recalculated priority scores for ${res.rescored_count} incidents.`
      );
      await loadLogs();
    } catch (err: any) {
      toast.error('Rescore Failed', err.message);
    } finally {
      setIsRescoring(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(search.toLowerCase()) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Audit History & Compliance Trail
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Immutable log of all operational mutations: report ingestion, duplicate decisions, overrides, and status updates.
          </p>
        </div>

        {/* Batch Rescore Button (Admin only) */}
        <Button
          size="sm"
          variant="secondary"
          isLoading={isRescoring}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-sky-400" />}
          onClick={handleBatchRescore}
        >
          Batch Rescore Active Incidents
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 surface-z1 border border-[var(--border-subtle)] rounded-xl p-3 shadow-xs">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor, or entity ID..."
            className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-auto bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs cursor-pointer"
        >
          <option value="all">Action: All Types</option>
          <option value="report_ingested">Report Ingested</option>
          <option value="duplicate_confirmed">Duplicate Confirmed (Merge)</option>
          <option value="duplicate_rejected">Duplicate Rejected</option>
          <option value="priority_overridden">Priority Overridden</option>
          <option value="priority_override_cleared">Priority Override Cleared</option>
          <option value="incident_status_updated">Status / Verification Updated</option>
          <option value="incidents_rescored">Batch Rescore Executed</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="surface-z1 overflow-hidden shadow-sm animate-fade-in rounded-xl border border-[var(--border-subtle)]">
        <div className="w-full max-w-full overflow-x-auto table-scroll-container">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--border-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-[11px] tabular-nums">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)] font-sans">
                    Loading audit events...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)] font-sans">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)]">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-primary)] font-sans">
                      {entry.actor_name || entry.actor_id?.slice(0, 8) || 'System Engine'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-slate-800 text-rose-700 dark:text-rose-300 font-bold">
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] capitalize font-sans">
                      {entry.entity_type}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">
                      {entry.entity_id ? entry.entity_id.slice(0, 8) : 'N/A'}...
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 underline cursor-pointer"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details JSON Modal */}
      <Dialog
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        title={`Audit Event: ${selectedEntry?.action || ''}`}
        description={`Recorded at ${selectedEntry ? new Date(selectedEntry.created_at).toLocaleString() : ''}`}
      >
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1">
            <p>
              <strong className="text-[var(--text-secondary)]">Actor:</strong>{' '}
              <span className="text-[var(--text-primary)]">
                {selectedEntry?.actor_name || selectedEntry?.actor_id || 'System Engine'}
              </span>
            </p>
            <p>
              <strong className="text-[var(--text-secondary)]">Target Entity:</strong>{' '}
              <span className="text-[var(--text-primary)]">
                {selectedEntry?.entity_type} ({selectedEntry?.entity_id})
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Metadata Payload (JSONB):
            </label>
            <pre className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-60">
              {JSON.stringify(selectedEntry?.details || {}, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="secondary" onClick={() => setSelectedEntry(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
