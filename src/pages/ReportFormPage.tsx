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
} from 'lucide-react';
import { reportIngestionSchema, type ReportIngestionInput } from '../shared/schemas.ts';
import { dataService } from '../lib/dataService.ts';
import { Button } from '../components/ui/Button.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import type { VulnerabilityFlag } from '../shared/types.ts';

export function ReportFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
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

  const handleToggleFlag = (flag: VulnerabilityFlag) => {
    const current = new Set(watchFlags);
    if (current.has(flag)) {
      current.delete(flag);
    } else {
      current.add(flag);
    }
    setValue('vulnerability_flags', Array.from(current) as any);
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
      {/* Top Breadcrumb */}
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
          Enter validated emergency incoming report information. Priority scoring and duplicate detection will execute deterministically upon submission.
        </p>
      </div>

      {/* Real-time Contextual Advisories (Section 9.2) */}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* GROUP 1: Incident Information */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              1. Incident & Channel Information
            </h2>
            <p className="text-[11px] text-slate-400">
              Source channel, disaster category, and incoming message text.
            </p>
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
                <option value="phone_call">Phone Call (911 / Hotline)</option>
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
              Description / Observation Text * (10–5,000 characters)
            </label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Describe the incident, observable hazards, number of stranded victims, building conditions..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            {errors.description && (
              <p className="text-[10px] text-rose-400 mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* GROUP 2: Location and Impact */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              2. Location and Impact Assessment
            </h2>
            <p className="text-[11px] text-slate-400">
              Geographic coordinates, casualties/risk, immediate danger indicator, and vulnerable populations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="e.g. 37.7749"
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
                placeholder="e.g. -122.4194"
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
              Vulnerability Flags (Manual Field Assessment):
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
          >
            Submit Incident Report
          </Button>
        </div>
      </form>
    </div>
  );
}
