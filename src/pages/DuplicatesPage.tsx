import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CopyCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  ArrowRight,
  GitMerge,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { Button } from '../components/ui/Button.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import type { DuplicateCandidate, DuplicateDecision } from '../shared/types.ts';

export function DuplicatesPage() {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [activeTab, setActiveTab] = useState<DuplicateDecision>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const toast = useToast();
  const currentUser = dataService.getCurrentUser();
  const isViewer = currentUser.role === 'viewer';

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getDuplicateCandidates(activeTab);
      setCandidates(data);
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleDecision = async (candidateId: string, decision: 'confirmed' | 'rejected') => {
    if (isViewer) {
      toast.warning('Access Restricted', 'Viewers cannot perform duplicate review decisions.');
      return;
    }

    setProcessingId(candidateId);
    try {
      const res = await dataService.reviewDuplicate({
        candidate_id: candidateId,
        decision,
      });

      if (decision === 'confirmed') {
        toast.success(
          'Duplicate Confirmed & Merged',
          `Reports consolidated into canonical incident ${res.canonical_incident_id?.slice(0, 8)}...`
        );
      } else {
        toast.info('Duplicate Rejected', 'Candidate marked as rejected. Pair will not be suggested again.');
      }

      await loadCandidates();
    } catch (err: any) {
      toast.error('Decision Failed', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <CopyCheck className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            Duplicate Incident Review Queue
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Human-in-the-loop review for potential duplicate emergency reports identified by deterministic matching.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 self-start">
          {(['pending', 'confirmed', 'rejected'] as DuplicateDecision[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Viewer Notice */}
      {isViewer && (
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <span>🔒 You are viewing duplicate suggestions in read-only mode. Confirmation or rejection requires coordinator privileges.</span>
        </div>
      )}

      {/* Candidates List */}
      {isLoading ? (
        <div className="p-12 text-center text-[var(--text-secondary)] surface-z1 border border-[var(--border-subtle)] rounded-xl animate-pulse">
          <p className="text-sm">Loading duplicate candidates...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center text-[var(--text-secondary)] surface-z1 border border-[var(--border-subtle)] rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            No {activeTab.toUpperCase()} Duplicate Suggestions
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {activeTab === 'pending'
              ? 'All candidate reports have been reviewed. No pending duplicate pairs require human confirmation.'
              : `No duplicate suggestions have been marked as ${activeTab}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((cand) => {
            const repA = cand.report_a;
            const repB = cand.report_b;
            const isProcessing = processingId === cand.id;

            return (
              <div
                key={cand.id}
                className="surface-z1 p-4 md:p-5 space-y-4 hover:border-[var(--border-strong)] transition-colors animate-spatial-enter"
              >
                {/* Top Match Metric & Reasons Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-md bg-[var(--border-subtle)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-mono font-bold flex items-center gap-1.5 tabular-nums">
                      <span className="text-[var(--text-muted)]">Similarity:</span>
                      <span className="text-sm text-rose-500">{Math.round(cand.similarity_score * 100)}%</span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Evaluated via Jaccard text + Haversine spatial + temporal decay
                    </span>
                  </div>

                  {/* Actions for Pending */}
                  {cand.decision === 'pending' ? (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        disabled={isViewer || isProcessing}
                        isLoading={isProcessing}
                        onClick={() => handleDecision(cand.id, 'rejected')}
                        className="flex-1 sm:flex-none justify-center"
                      >
                        Reject Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<GitMerge className="w-3.5 h-3.5" />}
                        disabled={isViewer || isProcessing}
                        isLoading={isProcessing}
                        onClick={() => handleDecision(cand.id, 'confirmed')}
                        className="flex-1 sm:flex-none justify-center"
                      >
                        Confirm & Merge Incidents
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded font-mono font-semibold uppercase ${
                          cand.decision === 'confirmed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        Decision: {cand.decision}
                      </span>
                    </div>
                  )}
                </div>

                {/* Match Reasons List */}
                {cand.match_reasons && cand.match_reasons.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-[var(--text-secondary)] font-medium">Matching Factors:</span>
                    {cand.match_reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                      >
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Side-by-Side Comparison of Both Reports */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Report A */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80 text-xs">
                        <span className="font-mono font-semibold text-rose-500 dark:text-rose-400">
                          Report A ({repA?.channel.replace('_', ' ')})
                        </span>
                        {repA?.incident_id && (
                          <Link
                            to={`/incidents/${repA.incident_id}`}
                            className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <span>Incident #{repA.incident_id.slice(0, 6)}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-2.5 leading-relaxed">
                        {repA?.description || 'Report description unavailable.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[11px] text-[var(--text-secondary)] space-y-1">
                      <div className="flex items-center gap-1 text-[var(--text-primary)]">
                        <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{repA?.location_text || repA?.district || 'No location text'}</span>
                        {repA?.latitude && (
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            ({repA.latitude.toFixed(4)}, {repA.longitude?.toFixed(4)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {repA?.reported_at ? new Date(repA.reported_at).toLocaleString() : ''}
                        </span>
                        {typeof repA?.people_at_risk_estimate === 'number' && (
                          <span>{repA.people_at_risk_estimate} people at risk</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Report B */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80 text-xs">
                        <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                          Report B ({repB?.channel.replace('_', ' ')})
                        </span>
                        {repB?.incident_id && (
                          <Link
                            to={`/incidents/${repB.incident_id}`}
                            className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <span>Incident #{repB.incident_id.slice(0, 6)}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-200 mt-2.5 leading-relaxed">
                        {repB?.description || 'Report description unavailable.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[11px] text-[var(--text-secondary)] space-y-1">
                      <div className="flex items-center gap-1 text-[var(--text-primary)]">
                        <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{repB?.location_text || repB?.district || 'No location text'}</span>
                        {repB?.latitude && (
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            ({repB.latitude.toFixed(4)}, {repB.longitude?.toFixed(4)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {repB?.reported_at ? new Date(repB.reported_at).toLocaleString() : ''}
                        </span>
                        {typeof repB?.people_at_risk_estimate === 'number' && (
                          <span>{repB.people_at_risk_estimate} people at risk</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
