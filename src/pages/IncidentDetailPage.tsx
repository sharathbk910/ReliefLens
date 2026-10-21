import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Edit3,
  CheckCircle2,
  Phone,
  FileText,
  AlertCircle,
  CopyCheck,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { Button } from '../components/ui/Button.tsx';
import { Dialog } from '../components/ui/Dialog.tsx';
import {
  PriorityBadge,
  StatusBadge,
  VerificationBadge,
  UncertaintyBadge,
} from '../components/ui/Badge.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import type {
  Incident,
  IncidentStatus,
  Report,
  VerificationLevel,
} from '../shared/types.ts';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = dataService.getCurrentUser();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [hasPendingDuplicates, setHasPendingDuplicates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Override Dialog State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState<number>(75);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Status & Verification Dialog State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    'new' | 'under_review' | 'confirmed' | 'resolved' | 'dismissed'
  >('under_review');
  const [selectedVerification, setSelectedVerification] = useState<VerificationLevel>('unverified');
  const [verificationReason, setVerificationReason] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Contacts cache
  const [contacts, setContacts] = useState<Record<string, { name: string | null; phone: string | null }>>({});

  const loadIncident = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await dataService.getIncidentById(id);
      if (!data.incident) {
        toast.error('Incident Not Found', `ID ${id} does not exist.`);
        navigate('/dashboard');
        return;
      }
      setIncident(data.incident);
      setReports(data.reports);
      setHasPendingDuplicates(data.hasPendingDuplicates);
      if (data.incident.status !== 'merged') {
        setSelectedStatus(data.incident.status);
      }
      setSelectedVerification(data.incident.verification_level);
      setOverrideScore(
        data.incident.score_override !== null
          ? data.incident.score_override
          : data.incident.effective_score
      );

      // Load restricted contacts for coordinator/admin
      if (currentUser.role !== 'viewer') {
        const contactMap: Record<string, any> = {};
        for (const rep of data.reports) {
          const contact = await dataService.getReportContact(rep.id);
          if (contact) {
            contactMap[rep.id] = {
              name: contact.contact_name,
              phone: contact.contact_phone,
            };
          }
        }
        setContacts(contactMap);
      }
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, toast, currentUser.role]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  // Handle Priority Override Submission
  const handleSaveOverride = async () => {
    if (!incident) return;
    if (overrideReason.trim().length < 10) {
      toast.warning('Validation Warning', 'Reason must contain at least 10 characters.');
      return;
    }

    setIsSubmittingOverride(true);
    try {
      await dataService.overridePriority({
        incident_id: incident.id,
        override_score: overrideScore,
        reason: overrideReason.trim(),
      });
      toast.success('Priority Overridden', `Incident effective score updated to ${overrideScore}.`);
      setOverrideModalOpen(false);
      setOverrideReason('');
      await loadIncident();
    } catch (err: any) {
      toast.error('Override Failed', err.message);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Handle Clearing Priority Override
  const handleClearOverride = async () => {
    if (!incident) return;
    if (overrideReason.trim().length < 10) {
      toast.warning('Validation Warning', 'Please provide a reason (10+ characters) to clear the override.');
      return;
    }

    setIsSubmittingOverride(true);
    try {
      await dataService.overridePriority({
        incident_id: incident.id,
        override_score: null,
        reason: overrideReason.trim(),
      });
      toast.success('Override Cleared', 'Incident reverted to system-calculated score.');
      setOverrideModalOpen(false);
      setOverrideReason('');
      await loadIncident();
    } catch (err: any) {
      toast.error('Operation Failed', err.message);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Handle Status & Verification Transition
  const handleSaveStatus = async () => {
    if (!incident) return;
    if (
      selectedVerification === 'coordinator_verified' &&
      verificationReason.trim().length < 10
    ) {
      toast.warning(
        'Reason Required',
        'Coordinator verification requires a documented reason of at least 10 characters.'
      );
      return;
    }

    setIsSubmittingStatus(true);
    try {
      await dataService.updateIncidentStatus({
        incident_id: incident.id,
        status: selectedStatus,
        verification_level: selectedVerification,
        verification_reason: verificationReason.trim() || undefined,
      });
      toast.success('Incident Updated', 'Status and verification changes persisted.');
      setStatusModalOpen(false);
      setVerificationReason('');
      await loadIncident();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  if (isLoading || !incident) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        <p className="text-sm">Loading incident details and scoring factors...</p>
      </div>
    );
  }

  const breakdown = incident.score_breakdown;
  const isViewer = currentUser.role === 'viewer';

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {hasPendingDuplicates && (
          <Link
            to="/duplicates"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-500/50 text-purple-200 hover:bg-purple-900 transition-colors"
          >
            <CopyCheck className="w-3.5 h-3.5" />
            <span>Duplicate Review Pending</span>
          </Link>
        )}
      </div>

      {/* Incident Header (Tactical Inversa Aesthetic) */}
      <div className="corner-cross bg-[#141611]/90 border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge
                tier={incident.priority_tier}
                score={incident.effective_score}
              />
              <StatusBadge status={incident.status} />
              <VerificationBadge level={incident.verification_level} />
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                {incident.incident_type}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold font-heading text-white tracking-tight">
              {incident.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <strong>{incident.district || 'Unassigned'}</strong> (
                {incident.location_text || 'No location text'})
              </span>
              {incident.latitude !== null && incident.longitude !== null && (
                <span className="font-mono text-[11px] text-slate-400">
                  📍 {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)} ({incident.location_precision})
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                First reported {new Date(incident.first_reported_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons for Authorized Coordinators/Admins */}
          {!isViewer && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5 text-purple-400" />}
                onClick={() => setOverrideModalOpen(true)}
              >
                {incident.score_override !== null ? 'Edit Override' : 'Override Priority'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                onClick={() => setStatusModalOpen(true)}
              >
                Update Status / Verify
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Uncertainty Alerts Bar if any uncertainty flags active */}
      {incident.uncertainty_flags && incident.uncertainty_flags.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-amber-200">
                Uncertainty & Verification Flags Active ({incident.uncertainty_flags.length})
              </h3>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Information regarding this incident has incomplete or conflicting factors. Inspect flags before dispatch:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {incident.uncertainty_flags.map((flag) => (
                  <UncertaintyBadge key={flag} flag={flag} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Explanation & Factor Breakdown Card (Section 4.5 & 15.1) */}
      <div className="surface-z1 p-4 md:p-5 shadow-sm animate-spatial-enter">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-subtle)] gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              Explainable Priority Score Breakdown
              <span className="font-mono text-xs font-normal text-[var(--text-muted)] bg-[var(--border-subtle)] px-2 py-0.5 rounded">
                Ruleset v{breakdown?.ruleset_version || '1.0.0'}
              </span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Deterministic, transparent calculation derived from underlying evidence.
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono tabular-nums">
            <div>
              <span className="text-[10px] uppercase text-[var(--text-muted)] block">Computed</span>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {incident.computed_score}
                <span className="text-xs text-[var(--text-muted)]">/100</span>
              </span>
            </div>
            {breakdown?.floor_applied && (
              <div>
                <span className="text-[10px] uppercase text-amber-500 block">Safety Floor</span>
                <span className="text-lg font-bold text-amber-400">
                  {breakdown.floor_score}
                  <span className="text-xs text-amber-500/80">/100</span>
                </span>
              </div>
            )}
            {incident.score_override !== null && (
              <div>
                <span className="text-[10px] uppercase text-rose-400 block">Manual Override</span>
                <span className="text-lg font-bold text-rose-300">
                  {incident.score_override}
                  <span className="text-xs text-rose-400/80">/100</span>
                </span>
              </div>
            )}
            <div className="pl-2 border-l border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase text-rose-500 block">Effective Score</span>
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {incident.effective_score}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Scoring Factors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {/* Factor 1: Immediate Danger */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">Immediate Danger</span>
                <span className="font-mono text-xs font-bold text-rose-400">
                  {breakdown?.factors?.immediate_danger?.points || 0}/30
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Source: <strong>{breakdown?.factors?.immediate_danger?.source || 'none'}</strong>
              </p>
              {breakdown?.factors?.immediate_danger?.matched_keywords?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {breakdown.factors.immediate_danger.matched_keywords.map((kw: string) => (
                    <span key={kw} className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/40 px-1 rounded">
                      "{kw}"
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{
                  width: `${((breakdown?.factors?.immediate_danger?.points || 0) / 30) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Factor 2: People at Risk */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">People at Risk</span>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {breakdown?.factors?.people_at_risk?.points || 0}/25
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Input: <strong>{breakdown?.factors?.people_at_risk?.input_value !== null ? `${breakdown?.factors?.people_at_risk?.input_value} people` : 'Unknown'}</strong>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Highest estimate considered
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${((breakdown?.factors?.people_at_risk?.points || 0) / 25) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Factor 3: Time Sensitivity */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">Time Sensitivity</span>
                <span className="font-mono text-xs font-bold text-sky-400">
                  {breakdown?.factors?.time_sensitivity?.points || 0}/20
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Age: <strong>{breakdown?.factors?.time_sensitivity?.hours_since_last_report} hrs ago</strong>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Fresher reports prioritize urgency
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all"
                style={{
                  width: `${((breakdown?.factors?.time_sensitivity?.points || 0) / 20) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Factor 4: Vulnerability */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">Vulnerabilities</span>
                <span className="font-mono text-xs font-bold text-purple-400">
                  {breakdown?.factors?.vulnerability?.points || 0}/15
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Flags: <strong>{breakdown?.factors?.vulnerability?.flags?.length || 0} active</strong>
              </p>
              {breakdown?.factors?.vulnerability?.flags?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {breakdown.factors.vulnerability.flags.map((fl: string) => (
                    <span key={fl} className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40 px-1 rounded">
                      {fl.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{
                  width: `${((breakdown?.factors?.vulnerability?.points || 0) / 15) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Factor 5: Confidence */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-300">Confidence</span>
                <span className="font-mono text-xs font-bold text-teal-400">
                  {breakdown?.factors?.information_confidence?.points || 0}/10
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Level: <strong>{breakdown?.factors?.information_confidence?.verification_level}</strong>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Corroboration bonus points
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all"
                style={{
                  width: `${((breakdown?.factors?.information_confidence?.points || 0) / 10) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Associated Reports Timeline (Section 4.3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              Associated Incoming Reports ({reports.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All raw observations and communication records are preserved after aggregation or merge.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {reports.map((report, idx) => {
            const contact = contacts[report.id];

            return (
              <div
                key={report.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-400">
                      Report #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] uppercase">
                      Channel: {report.channel.replace('_', ' ')}
                    </span>
                    {report.immediate_danger && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                        ⚠️ Immediate Danger
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Reported: {new Date(report.reported_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {report.description}
                  </p>
                </div>

                {/* Metadata & restricted contact */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    {report.location_text && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {report.location_text}
                      </span>
                    )}
                    {typeof report.people_at_risk_estimate === 'number' && (
                      <span>
                        Impact Estimate: <strong>{report.people_at_risk_estimate} people</strong>
                      </span>
                    )}
                    {report.vulnerability_flags?.length > 0 && (
                      <span className="text-purple-300">
                        Flags: {report.vulnerability_flags.join(', ')}
                      </span>
                    )}
                  </div>

                  {contact && (contact.name || contact.phone) && (
                    <div className="flex items-center gap-2 text-[11px] bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-amber-200">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>Contact (Restricted):</span>
                      <strong>{contact.name || 'Anonymous'}</strong>
                      {contact.phone && <span>({contact.phone})</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Override Dialog (Section 9.3) */}
      <Dialog
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Override Incident Priority Score"
        description="Authorized coordinators and admins can set an explicit priority score. The original computed score remains preserved."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Original System Score</span>
              <span className="text-lg font-bold text-slate-200 font-mono">
                {incident.computed_score}/100
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Safety Floor Score</span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {breakdown?.floor_score || incident.computed_score}/100
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Current Effective</span>
              <span className="text-lg font-bold text-rose-300 font-mono">
                {incident.effective_score}/100
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              New Manual Score (0 to 100):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={overrideScore}
                onChange={(e) => setOverrideScore(parseInt(e.target.value, 10))}
                className="flex-1 accent-rose-500"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={overrideScore}
                onChange={(e) => setOverrideScore(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-white"
              />
            </div>
          </div>

          {/* Safety floor override warning if lowering below 45 */}
          {breakdown?.uncertainty_flags?.includes('unverified_high_danger') &&
            overrideScore < 45 && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="text-[11px]">
                  <strong>High Danger Warning:</strong> This incident reports immediate danger and is unverified. Lowering below the 45 safety floor requires explicit written justification in your reason.
                </div>
              </div>
            )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Documented Justification / Reason (Required, 10–500 characters):
            </label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Explain the specific field ground assessment or operational decision..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <span className="text-[10px] text-slate-400">
              {overrideReason.length}/500 characters (minimum 10 required)
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {incident.score_override !== null ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearOverride}
                isLoading={isSubmittingOverride}
              >
                Clear Override
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOverrideModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveOverride}
                isLoading={isSubmittingOverride}
              >
                Apply Override
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Status & Verification Transition Dialog (Section 12.5) */}
      <Dialog
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Status & Verification Level"
        description="Transition incident lifecycle status and apply coordinator verification."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Operational Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="new">New (Awaiting Initial Action)</option>
              <option value="under_review">Under Review (Team Assessing)</option>
              <option value="confirmed">Confirmed (Dispatched or In Progress)</option>
              <option value="resolved">Resolved (Completed Rescue/Relief)</option>
              <option value="dismissed">Dismissed (False Alarm or Inactive)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Verification Level:
            </label>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value as VerificationLevel)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="unverified">Unverified</option>
              <option value="partially_corroborated">Partially Corroborated</option>
              <option value="corroborated">Corroborated (Multi-Channel Evidence)</option>
              <option value="coordinator_verified">Coordinator Verified (Ground Call / Direct Contact)</option>
            </select>
          </div>

          {selectedVerification === 'coordinator_verified' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Coordinator Verification Reason (Required for coordinator level):
              </label>
              <textarea
                rows={2}
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
                placeholder="Confirmed directly via callback with shift supervisor or ground volunteer..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-400"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveStatus}
              isLoading={isSubmittingStatus}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
