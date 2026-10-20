import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { reportIngestionSchema, type ReportIngestionInput } from '../shared/schemas.ts';
import { dataService } from '../lib/dataService.ts';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import type { VulnerabilityFlag, VoiceExtractionResult } from '../shared/types.ts';
import { VoiceRecorder } from '../components/VoiceRecorder.tsx';
import { EditableExtractionPreview } from '../components/EditableExtractionPreview.tsx';
import { CurrentLocationControl, type DetectedLocation } from '../components/CurrentLocationControl.tsx';
import { LiveLocationControl } from '../components/LiveLocationControl.tsx';

export function ReportFormPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [reportingMode, setReportingMode] = useState<'voice' | 'manual'>('voice');
  const [voiceExtraction, setVoiceExtraction] = useState<VoiceExtractionResult | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = dataService.getCurrentUser();
  if (currentUser.role === 'viewer') {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl max-w-lg mx-auto">
        <AlertOctagon className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 mt-1">
          Viewer accounts have read-only privileges and cannot ingest new reports.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-xs text-rose-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Current ISO time for default reported_at
  const defaultTime = new Date().toISOString().slice(0, 16);

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

  const handleToggleFlag = (flag: VulnerabilityFlag) => {
    const current = new Set(watchFlags);
    if (current.has(flag)) {
      current.delete(flag);
    } else {
      current.add(flag);
    }
    setValue('vulnerability_flags', Array.from(current) as any);
  };

  // Location Handlers
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

  const handleLocationConfirmedChange = (confirmed: boolean) => {
    if (detectedLocation) {
      setDetectedLocation({ ...detectedLocation, isConfirmedIncidentLocation: confirmed });
    }
    setValue('user_confirmed_incident_location', confirmed);
  };

  // Voice Extraction Handlers
  const handleExtractionSuccess = (result: VoiceExtractionResult) => {
    setVoiceExtraction(result);
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
    setReportingMode('manual'); // Show filled form for final user review and confirmation
    toast.success(
      'AI Extraction Applied',
      `Language: ${data.detectedLanguage}. Please review all details and confirm location before submitting.`
    );
  };

  const handleDiscardExtraction = () => {
    setVoiceExtraction(null);
  };

  // Real-time advisories calculation (Section 9.2)
  const advisories: { type: 'warning' | 'info'; text: string }[] = [];

  const hasCoords =
    typeof watchLat === 'number' &&
    typeof watchLng === 'number' &&
    !isNaN(watchLat) &&
    !isNaN(watchLng);

  if (watchDanger && !hasCoords) {
    advisories.push({
      type: 'warning',
      text: 'Danger has been reported without coordinates. This incident will be flagged for review.',
    });
  }

  if (watchPeople === null || watchPeople === undefined) {
    advisories.push({
      type: 'info',
      text: 'The number of people potentially affected is unknown.',
    });
  }

  if (watchDanger) {
    advisories.push({
      type: 'warning',
      text: 'Immediate danger is reported, but the incident remains unverified. Review is required.',
    });
  }

  if (watchReportedAt) {
    const diffHours = (Date.now() - new Date(watchReportedAt).getTime()) / (1000 * 60 * 60);
    if (diffHours > 12) {
      advisories.push({
        type: 'warning',
        text: 'This report is more than 12 hours old. Check whether the information is still current.',
      });
    }
  }

  if (watchOriginalTranscript && watchDetectedLanguage) {
    advisories.push({
      type: 'info',
      text: `Voice report captured in ${watchDetectedLanguage}. Original script preserved with editable English normalization.`,
    });
  }

  const onSubmit = async (data: ReportIngestionInput) => {
    setIsSubmitting(true);
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
      toast.error('Submission Failed', err.message || 'Validation error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-xl md:text-2xl font-bold font-heading text-white tracking-tight mt-2">
          New Incident Observation Report
        </h1>
        <p className="text-xs text-slate-400">
          Submit emergency incident reports via Multilingual Voice or manual entry. Priority scoring and duplicate
          detection execute deterministically upon submission.
        </p>
      </div>

      {/* Input Mode Selector: [ Use Voice ] vs [ Type Manually ] */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-full sm:w-auto sm:inline-flex">
        <button
          type="button"
          onClick={() => setReportingMode('voice')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            reportingMode === 'voice'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          Use Voice
        </button>
        <button
          type="button"
          onClick={() => setReportingMode('manual')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            reportingMode === 'manual'
              ? 'bg-slate-800 text-white shadow-md shadow-slate-950/40 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Type Manually
        </button>
      </div>

      {/* VOICE REPORTING SECTION */}
      {reportingMode === 'voice' && !voiceExtraction && (
        <VoiceRecorder
          onExtractionSuccess={handleExtractionSuccess}
          onSwitchToManual={() => setReportingMode('manual')}
        />
      )}

      {/* EDITABLE GEMINI EXTRACTION PREVIEW */}
      {reportingMode === 'voice' && voiceExtraction && (
        <EditableExtractionPreview
          extraction={voiceExtraction}
          onApply={handleApplyExtraction}
          onDiscard={handleDiscardExtraction}
        />
      )}

      {/* Real-time Contextual Advisories */}
      {advisories.length > 0 && (
        <div className="space-y-2">
          {advisories.map((adv, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                adv.type === 'warning'
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  : 'bg-slate-900 border-slate-700/60 text-slate-300'
              }`}
            >
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{adv.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preserved Multilingual Voice Metadata Badge Banner (if populated from voice) */}
      {watchOriginalTranscript && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Voice Source Attached ({watchDetectedLanguage || 'Detected Language'})
            </span>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
              Original Transcript Preserved
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-sans italic bg-slate-950/60 p-2 rounded border border-slate-800">
            "{watchOriginalTranscript}"
          </p>
        </div>
      )}

      {/* REPORT SUBMISSION FORM (Active for manual entry and reviewing AI drafts) */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* GROUP 1: Incident Information */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                1. Incident & Channel Information
              </h2>
              <p className="text-[11px] text-slate-400">
                Source channel, disaster category, and incoming message text.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Report Channel *
              </label>
              <select
                {...register('channel')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="phone_call">Phone Call (Hotline)</option>
                <option value="sms">SMS Text Message</option>
                <option value="social_media">Social Media Feed</option>
                <option value="sensor">Sensor / Automated Monitor</option>
                <option value="field_volunteer">Field Volunteer Observation</option>
                <option value="other">Other Official Channel</option>
              </select>
              {errors.channel && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.channel.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Incident Type *
              </label>
              <select
                {...register('incident_type')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="flood">Flood (Flash Flood / Levee)</option>
                <option value="fire">Fire (Wildfire / Structural)</option>
                <option value="medical">Medical Emergency</option>
                <option value="landslide">Landslide / Mudslide</option>
                <option value="earthquake">Earthquake Tremor</option>
                <option value="shelter_request">Shelter Request / Evacuees</option>
                <option value="other">Other Incident</option>
              </select>
              {errors.incident_type && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.incident_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reported Timestamp *
              </label>
              <input
                type="datetime-local"
                defaultValue={defaultTime}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setValue('reported_at', new Date(val).toISOString());
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              {errors.reported_at && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.reported_at.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Normalized Incident Details * (10–5,000 characters)
            </label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Describe the incident, observable hazards, number of stranded victims, building conditions..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.description && (
              <p className="text-[10px] text-rose-400 mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* GROUP 2: Location and Impact Assessment */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              2. Location and Geolocation Controls
            </h2>
            <p className="text-[11px] text-slate-400">
              Attach device GPS location or enter coordinates manually. Live tracking is optional and opt-in.
            </p>
          </div>

          {/* Automatic Geolocation Controls */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Automatic Device Location
              </span>
              <LiveLocationControl
                onLocationUpdate={handleLocationDetected}
                onLiveSharingStopped={() => {}}
              />
            </div>

            <CurrentLocationControl
              location={detectedLocation}
              onLocationDetected={handleLocationDetected}
              onLocationCleared={handleLocationCleared}
              onLocationConfirmedChange={handleLocationConfirmedChange}
              spokenLocationText={watchLocationText}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Location Description / Landmark
              </label>
              <input
                type="text"
                {...register('location_text')}
                placeholder="e.g. Corner of 4th Ave & Riverside Dr"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                District / Sector
              </label>
              <input
                type="text"
                {...register('district')}
                placeholder="e.g. East River Basin"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                placeholder="e.g. 13.3408"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              {errors.latitude && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.latitude.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                placeholder="e.g. 74.7421"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              {errors.longitude && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.longitude.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Location Precision *
              </label>
              <select
                {...register('location_precision')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="approximate">Approximate</option>
                <option value="exact">Exact (GPS Verified)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estimated People at Risk (Leave blank if unknown)
              </label>
              <input
                type="number"
                min="0"
                max="100000"
                {...register('people_at_risk_estimate', {
                  setValueAs: (v) => (v === '' || isNaN(v) ? null : parseInt(v, 10)),
                })}
                placeholder="Headcount estimate..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('immediate_danger')}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs font-semibold text-rose-300">
                  Immediate Life-Threatening Danger Reported
                </span>
              </label>
            </div>
          </div>

          {/* Vulnerability Flags Multi-Select */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Vulnerability Flags (Field / AI Assessment):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'children_present', label: 'Children Present' },
                { id: 'elderly_present', label: 'Elderly / Seniors' },
                { id: 'medical_dependency', label: 'Medical Dependency' },
                { id: 'isolated_remote', label: 'Isolated / Remote' },
              ].map((flag) => {
                const isSelected = watchFlags.includes(flag.id as any);
                return (
                  <button
                    key={flag.id}
                    type="button"
                    onClick={() => handleToggleFlag(flag.id as any)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                      isSelected
                        ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {flag.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* GROUP 3: Additional Information (Collapsible) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setAdditionalOpen(!additionalOpen)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
          >
            <div>
              <span className="text-sm font-semibold text-white">
                3. Additional Metadata & Restricted Contact (Optional)
              </span>
              <p className="text-[11px] text-slate-400">
                External tracking IDs and caller contact details (restricted to coordinators/admins).
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${additionalOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {additionalOpen && (
            <div className="p-5 pt-0 space-y-4 border-t border-slate-800 animate-slide-down">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    External Reference ID
                  </label>
                  <input
                    type="text"
                    {...register('external_reference')}
                    placeholder="e.g. CAD-98214"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Name (Restricted)
                  </label>
                  <input
                    type="text"
                    {...register('contact_name')}
                    placeholder="Reporter name..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Phone (Restricted)
                  </label>
                  <input
                    type="text"
                    {...register('contact_phone')}
                    placeholder="e.g. +1-555-0199"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950/40"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirm & Submit Incident Report
          </Button>
        </div>
      </form>
    </div>
  );
}
