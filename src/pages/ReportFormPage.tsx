import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  AlertOctagon,
  MapPin,
  Users,
  ShieldAlert,
  ChevronDown,
  Info,
  Clock,
  Phone,
  Mic,
  FileText,
  Sparkles,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react';
import { reportIngestionSchema, type ReportIngestionInput } from '../shared/schemas.ts';
import { dataService } from '../lib/dataService.ts';
import { offlineSyncService } from '../lib/offlineSyncService.ts';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import type { VulnerabilityFlag, VoiceExtractionResult } from '../shared/types.ts';
import { VoiceRecorder } from '../components/VoiceRecorder.tsx';
import { EditableExtractionPreview } from '../components/EditableExtractionPreview.tsx';
import { CurrentLocationControl, type DetectedLocation } from '../components/CurrentLocationControl.tsx';
import { LiveLocationControl } from '../components/LiveLocationControl.tsx';

type FormStep = 'input' | 'review' | 'location' | 'confirm';

export function ReportFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [activeStep, setActiveStep] = useState<FormStep>('input');
  const [reportingMode, setReportingMode] = useState<'voice' | 'manual'>('voice');
  const [voiceExtraction, setVoiceExtraction] = useState<VoiceExtractionResult | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If navigated with prefilled voice extraction from EmergencyVoiceFAB
  useEffect(() => {
    const prefilled = (location.state as { prefilledVoiceExtraction?: VoiceExtractionResult })
      ?.prefilledVoiceExtraction;
    if (prefilled) {
      setVoiceExtraction(prefilled);
      setActiveStep('review');
    }
  }, [location.state]);

  const currentUser = dataService.getCurrentUser();
  if (currentUser.role === 'viewer') {
    return (
      <div className="surface-z2 p-8 text-center rounded-2xl max-w-lg mx-auto my-8">
        <AlertOctagon className="w-8 h-8 text-rose-500 mx-auto mb-2" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-[var(--text-primary)]">Access Restricted</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Viewer accounts have read-only privileges and cannot ingest new reports.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs text-rose-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReportIngestionInput>({
    resolver: zodResolver(reportIngestionSchema),
    defaultValues: {
      channel: 'phone_call',
      incident_type: 'flood',
      description: '',
      reported_at: new Date().toISOString(),
      location_text: '',
      district: '',
      latitude: null,
      longitude: null,
      location_precision: 'approximate',
      location_source: null,
      location_accuracy: null,
      location_captured_at: null,
      user_confirmed_incident_location: true,
      original_transcript: null,
      detected_language: null,
      normalized_description: null,
      people_at_risk_estimate: null,
      immediate_danger: false,
      vulnerability_flags: [],
      external_reference: '',
      contact_name: '',
      contact_phone: '',
    },
  });

  const watchDanger = watch('immediate_danger');
  const watchPrecision = watch('location_precision');
  const watchLat = watch('latitude');
  const watchLng = watch('longitude');
  const watchPeople = watch('people_at_risk_estimate');
  const watchReportedAt = watch('reported_at');
  const watchFlags = watch('vulnerability_flags') || [];
  const watchOriginalTranscript = watch('original_transcript');
  const watchDetectedLanguage = watch('detected_language');
  const watchLocationText = watch('location_text');
  const watchDescription = watch('description');
  const watchIncidentType = watch('incident_type');
  const watchDistrict = watch('district');

  const handleToggleFlag = (flag: VulnerabilityFlag) => {
    const current = new Set(watchFlags);
    if (current.has(flag)) {
      current.delete(flag);
    } else {
      current.add(flag);
    }
    setValue('vulnerability_flags', Array.from(current) as any);
  };

  const handleLocationDetected = (loc: DetectedLocation) => {
    setDetectedLocation(loc);
    setValue('latitude', loc.latitude);
    setValue('longitude', loc.longitude);
    setValue('location_accuracy', loc.accuracy);
    setValue('location_captured_at', loc.capturedAt);
    setValue('location_source', 'gps');
    setValue('user_confirmed_incident_location', loc.isConfirmedIncidentLocation);
    setValue('location_precision', loc.accuracy && loc.accuracy <= 40 ? 'exact' : 'approximate');
  };

  const handleLocationCleared = () => {
    setDetectedLocation(null);
    setValue('latitude', null);
    setValue('longitude', null);
    setValue('location_accuracy', null);
    setValue('location_captured_at', null);
    setValue('location_source', null);
    setValue('user_confirmed_incident_location', true);
  };

  const handleExtractionSuccess = (extraction: VoiceExtractionResult) => {
    setVoiceExtraction(extraction);
    setActiveStep('review');
  };

  const handleApplyExtraction = (data: VoiceExtractionResult) => {
    setValue('description', data.normalizedDescription || data.transcript);
    setValue('incident_type', data.incidentType);
    setValue('location_text', data.locationText || '');
    setValue('district', data.district || '');
    setValue('people_at_risk_estimate', data.peopleAtRiskEstimate);
    setValue('immediate_danger', data.immediateDanger === true);
    setValue('vulnerability_flags', data.vulnerabilityFlags);
    setValue('original_transcript', data.transcript);
    setValue('detected_language', data.detectedLanguage);
    setValue('normalized_description', data.normalizedDescription);

    if (data.latitude && data.longitude) {
      setValue('latitude', data.latitude);
      setValue('longitude', data.longitude);
      setValue('location_precision', data.locationPrecision);
      setValue('location_source', 'voice');
    }

    setVoiceExtraction(null);
    setActiveStep('location');
    toast.success(
      'AI Extraction Applied',
      `Language: ${data.detectedLanguage}. Please verify coordinates and location details.`
    );
  };

  const handleDiscardExtraction = () => {
    setVoiceExtraction(null);
    setReportingMode('manual');
  };

  const onSubmit = async (data: ReportIngestionInput) => {
    setIsSubmitting(true);

    // If client is currently offline, queue report locally
    if (!offlineSyncService.isOnline()) {
      offlineSyncService.enqueueReport(data);
      toast.warning(
        'Report Saved in Offline Queue',
        'Device is offline. Your report has been saved locally and will auto-sync when network returns.'
      );
      setIsSubmitting(false);
      navigate('/dashboard');
      return;
    }

    try {
      const res = await dataService.ingestReport(data);
      toast.success(
        'Report Ingested',
        `Incident created with score ${res.effective_score} (${res.priority_tier.toUpperCase()}).`
      );

      if (res.duplicate_suggestions_count > 0) {
        toast.warning(
          'Potential Duplicate Detected',
          `${res.duplicate_suggestions_count} potential duplicate report(s) flagged for review.`
        );
      }

      navigate(`/incidents/${res.incident_id}`);
    } catch (err: any) {
      // Check if failure is network related
      if (!navigator.onLine || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
        offlineSyncService.enqueueReport(data);
        toast.warning(
          'Network Error — Saved to Offline Queue',
          'Failed to reach server. Report stored locally and will auto-sync once connection stabilizes.'
        );
        navigate('/dashboard');
      } else {
        toast.error('Submission Failed', err.message || 'Validation error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { id: FormStep; label: string }[] = [
    { id: 'input', label: '1. Input' },
    { id: 'review', label: '2. Review' },
    { id: 'location', label: '3. Location' },
    { id: 'confirm', label: '4. Confirm' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-2 md:my-6 animate-spatial-enter">
      {/* Presentation: Centered Sheet (Surface-Z2, max-w-640px) */}
      <div className="surface-z2 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[580px]">
        {/* Header with Close / Cancel */}
        <div className="p-4 md:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h1 className="text-base md:text-lg font-bold font-heading text-[var(--text-primary)]">
              New Incident Observation Report
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Submit disaster observations via voice or manual entry.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="Cancel and Close Report Form"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Step Navigation: Segmented Control (Section D) */}
        <div className="p-3 bg-[var(--surface-1)] border-b border-[var(--border-subtle)] select-none">
          <div className="grid grid-cols-4 gap-1 bg-[var(--surface-2-solid)] p-1 rounded-xl border border-[var(--border-subtle)]">
            {steps.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(s.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  activeStep === s.id
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body (Scrollable with max-height 90dvh safeguard) */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
            {/* STEP 1: INPUT */}
            {activeStep === 'input' && (
              <div className="space-y-4 animate-spatial-enter">
                {/* Method Switcher */}
                <div className="flex items-center gap-2 p-1 bg-[var(--surface-1-solid)] border border-[var(--border-subtle)] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setReportingMode('voice')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      reportingMode === 'voice'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Mic className="w-4 h-4" strokeWidth={1.5} />
                    Voice Recording
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportingMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      reportingMode === 'manual'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <FileText className="w-4 h-4" strokeWidth={1.5} />
                    Type Manually
                  </button>
                </div>

                {reportingMode === 'voice' && !voiceExtraction && (
                  <VoiceRecorder
                    onExtractionSuccess={handleExtractionSuccess}
                    onSwitchToManual={() => setReportingMode('manual')}
                  />
                )}

                {reportingMode === 'voice' && voiceExtraction && (
                  <EditableExtractionPreview
                    extraction={voiceExtraction}
                    onApply={handleApplyExtraction}
                    onDiscard={handleDiscardExtraction}
                  />
                )}

                {reportingMode === 'manual' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        Incident Classification *
                      </label>
                      <select
                        {...register('incident_type')}
                        className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus-visible:ring-1"
                      >
                        <option value="flood">Flood</option>
                        <option value="structure_collapse">Structure Collapse</option>
                        <option value="fire">Fire</option>
                        <option value="medical_emergency">Medical Emergency</option>
                        <option value="shelter_request">Shelter Request</option>
                        <option value="water_shortage">Water Shortage</option>
                        <option value="food_shortage">Food Shortage</option>
                        <option value="power_outage">Power Outage</option>
                        <option value="road_blocked">Road Blocked</option>
                        <option value="hazardous_material">Hazardous Material</option>
                        <option value="other">Other Emergency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        Incident Observation Description *
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        placeholder="Describe what occurred, immediate hazards, trapped persons, or critical needs..."
                        className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus-visible:ring-1"
                      />
                      {errors.description && (
                        <p className="text-[11px] text-rose-500 mt-1">{errors.description.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: REVIEW (Editable Details & Hazards) */}
            {activeStep === 'review' && (
              <div className="space-y-4 animate-spatial-enter">
                {watchOriginalTranscript && (
                  <div className="p-3 rounded-xl bg-[var(--surface-1-solid)] border border-rose-500/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Spoken Language: {watchDetectedLanguage || 'Detected'}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Original Script</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] italic bg-[var(--border-subtle)] p-2 rounded">
                      "{watchOriginalTranscript}"
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Normalized Incident Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus-visible:ring-1"
                  />
                  {errors.description && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Estimated People at Risk
                    </label>
                    <input
                      type="number"
                      min={0}
                      {...register('people_at_risk_estimate', { valueAsNumber: true })}
                      placeholder="e.g. 15 (leave empty if unknown)"
                      className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] tabular-nums"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="immediate_danger"
                      {...register('immediate_danger')}
                      className="rounded border-[var(--border-strong)] text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <label htmlFor="immediate_danger" className="text-xs font-medium text-rose-400 cursor-pointer">
                      Immediate Threat to Life Reported
                    </label>
                  </div>
                </div>

                {/* Vulnerability Flags */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Vulnerability Flags Present
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { id: 'children_present', label: 'Children Present' },
                      { id: 'elderly_present', label: 'Elderly Present' },
                      { id: 'medical_dependency', label: 'Medical Dependency' },
                      { id: 'trapped_individuals', label: 'Trapped Individuals' },
                      { id: 'disability_support_needed', label: 'Disability Support' },
                      { id: 'hospital_or_school_affected', label: 'Hospital/School Affected' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleToggleFlag(f.id as any)}
                        className={`p-2 rounded-lg border text-left text-xs font-medium transition-colors ${
                          watchFlags.includes(f.id as any)
                            ? 'bg-rose-500/15 border-rose-500 text-rose-300'
                            : 'bg-[var(--surface-1-solid)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                        }`}
                      >
                        {watchFlags.includes(f.id as any) ? '✓ ' : '+ '}
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION (Current GPS + Live Location + Text) */}
            {activeStep === 'location' && (
              <div className="space-y-4 animate-spatial-enter">
                <CurrentLocationControl
                  location={detectedLocation}
                  onLocationDetected={handleLocationDetected}
                  onLocationCleared={handleLocationCleared}
                  onLocationConfirmedChange={(c: boolean) => setValue('user_confirmed_incident_location', c)}
                  spokenLocationText={watchLocationText}
                />

                <LiveLocationControl
                  onLocationUpdate={(loc) => {
                    handleLocationDetected(loc);
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      District / Zone
                    </label>
                    <input
                      type="text"
                      {...register('district')}
                      placeholder="e.g. Downtown, Mission, Marina"
                      className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Landmark / Cross Street Description
                    </label>
                    <input
                      type="text"
                      {...register('location_text')}
                      placeholder="e.g. Corner of 4th & Market St"
                      className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRM (Summary Review) */}
            {activeStep === 'confirm' && (
              <div className="space-y-3 animate-spatial-enter">
                <div className="p-3.5 rounded-xl bg-[var(--surface-1-solid)] border border-[var(--border-subtle)] space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]">
                    <span className="font-semibold text-[var(--text-primary)]">Incident Classification:</span>
                    <span className="uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--border-subtle)] text-rose-400">
                      {watchIncidentType}
                    </span>
                  </div>

                  <div>
                    <span className="text-[var(--text-muted)] block text-[11px]">Description:</span>
                    <p className="text-[var(--text-primary)] font-medium mt-0.5">{watchDescription || 'No description entered'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-subtle)]">
                    <div>
                      <span className="text-[var(--text-muted)] text-[11px]">Location:</span>
                      <p className="text-[var(--text-primary)] font-medium truncate">{watchLocationText || watchDistrict || 'Unspecified'}</p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] text-[11px]">Coordinates:</span>
                      <p className="font-mono text-[11px] text-[var(--text-primary)] tabular-nums">
                        {typeof watchLat === 'number' && typeof watchLng === 'number'
                          ? `${watchLat.toFixed(4)}, ${watchLng.toFixed(4)}`
                          : 'No GPS coordinates'}
                      </p>
                    </div>
                  </div>

                  {watchDanger && (
                    <div className="p-2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                      <span>Immediate Threat to Life Reported (Safety floor eligible)</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                  💡 Submitting executes deterministic ruleset scoring and automated duplicate detection in real-time.
                </div>
              </div>
            )}
          </div>

          {/* Sticky Action Bar (Section D: Cancel and Confirm & Submit) */}
          <div className="sticky bottom-0 p-3 md:p-4 bg-[var(--surface-2-solid)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 shadow-lg">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {activeStep !== 'input' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prevStep = activeStep === 'confirm' ? 'location' : activeStep === 'location' ? 'review' : 'input';
                    setActiveStep(prevStep);
                  }}
                  className="text-xs"
                >
                  Previous
                </Button>
              )}

              {activeStep !== 'confirm' ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const nextStep = activeStep === 'input' ? 'review' : activeStep === 'review' ? 'location' : 'confirm';
                    setActiveStep(nextStep);
                  }}
                  className="text-xs gap-1 bg-rose-600 hover:bg-rose-500"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-500 shadow-md font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  <span>Confirm & Submit</span>
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
