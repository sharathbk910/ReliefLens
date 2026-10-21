import React, { useState } from 'react';
import {
  Sparkles,
  Languages,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  MapPin,
  Users,
  ShieldAlert,
  Edit3,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from './ui/Button.tsx';
import { Badge } from './ui/Badge.tsx';
import type { VoiceExtractionResult, IncidentType, VulnerabilityFlag } from '../shared/types.ts';

interface EditableExtractionPreviewProps {
  extraction: VoiceExtractionResult;
  onApply: (confirmedData: VoiceExtractionResult) => void;
  onDiscard: () => void;
}

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'flood', label: 'Flood' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'fire', label: 'Fire' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'shelter_request', label: 'Shelter Request' },
  { value: 'other', label: 'Other Hazard' },
];

const VULNERABILITY_OPTIONS: { id: VulnerabilityFlag; label: string }[] = [
  { id: 'children_present', label: 'Children Present' },
  { id: 'elderly_present', label: 'Elderly Present' },
  { id: 'medical_dependency', label: 'Medical Dependency' },
  { id: 'isolated_remote', label: 'Isolated / Cut Off' },
];

export function EditableExtractionPreview({
  extraction,
  onApply,
  onDiscard,
}: EditableExtractionPreviewProps) {
  const [formData, setFormData] = useState<VoiceExtractionResult>({
    ...extraction,
  });
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const copyTranscript = () => {
    if (formData.transcript) {
      navigator.clipboard.writeText(formData.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const toggleVulnerability = (flag: VulnerabilityFlag) => {
    setFormData((prev) => {
      const exists = prev.vulnerabilityFlags.includes(flag);
      return {
        ...prev,
        vulnerabilityFlags: exists
          ? prev.vulnerabilityFlags.filter((f) => f !== flag)
          : [...prev.vulnerabilityFlags, flag],
      };
    });
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-2xl space-y-5 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Analysed Incident Summary
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                Ready for Review
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Review and edit the analysed details below before applying to your report.
            </p>
          </div>
        </div>

        {/* Detected Language Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80 text-xs">
          <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-400">Detected Language:</span>
          <span className="font-semibold text-cyan-300">{formData.detectedLanguage || 'Auto-Detected'}</span>
        </div>
      </div>

      {/* Uncertainty & Missing Information Notices */}
      {((formData.missingInformation && formData.missingInformation.length > 0) ||
        (formData.uncertaintyNotes && formData.uncertaintyNotes.length > 0)) && (
        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-medium text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Uncertainties & Missing Details Identified</span>
          </div>
          {formData.missingInformation && formData.missingInformation.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-slate-400">Missing from recording:</span>
              {formData.missingInformation.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-700/50 text-[11px]"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          {formData.uncertaintyNotes && formData.uncertaintyNotes.length > 0 && (
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 pl-1 text-[11px]">
              {formData.uncertaintyNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Two Column Layout: Original Speech vs Normalized English Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Transcript */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Original Transcript ({formData.detectedLanguage || 'Original Script'})
            </label>
            <button
              type="button"
              onClick={copyTranscript}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {copiedTranscript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedTranscript ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="w-full min-h-[110px] p-3 text-xs rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 font-sans leading-relaxed select-text overflow-y-auto max-h-48">
            {formData.transcript || '(No speech detected)'}
          </div>
          <p className="text-[11px] text-slate-500">
            Faithful verbatim transcription preserved in its native script.
          </p>
        </div>

        {/* Editable Normalized English Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-medium text-slate-300 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              Normalized English Description (Editable)
            </label>
            <span className="text-[11px] text-slate-400">Required min 10 chars</span>
          </div>
          <textarea
            rows={4}
            value={formData.normalizedDescription}
            onChange={(e) => setFormData({ ...formData, normalizedDescription: e.target.value })}
            className="w-full min-h-[110px] p-3 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed resize-y"
            placeholder="Editable English-normalized emergency description..."
          />
          <p className="text-[11px] text-slate-500">
            You can modify this translation or summary before confirming.
          </p>
        </div>
      </div>

      {/* Structured Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Suggested Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Incident Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Incident Type</label>
          <select
            value={formData.incidentType}
            onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentType })}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">District / Region</label>
          <input
            type="text"
            value={formData.district || ''}
            onChange={(e) => setFormData({ ...formData, district: e.target.value || null })}
            placeholder="e.g. Udupi, Dakshina Kannada"
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Spoken Location Text */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            Spoken Location Landmark
          </label>
          <input
            type="text"
            value={formData.locationText || ''}
            onChange={(e) => setFormData({ ...formData, locationText: e.target.value || null })}
            placeholder="e.g. Near town bridge, 3rd cross"
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* People at risk */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            People at Risk (Estimated)
          </label>
          <input
            type="number"
            min={0}
            value={formData.peopleAtRiskEstimate ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                peopleAtRiskEstimate: e.target.value === '' ? null : parseInt(e.target.value, 10),
              })
            }
            placeholder="Leave blank if unknown"
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Immediate Danger Assessment */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            Immediate Danger
          </label>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, immediateDanger: true })}
              className={`flex-1 py-1.5 px-2 text-xs rounded-md border font-medium transition-all ${
                formData.immediateDanger === true
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Yes (Active Danger)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, immediateDanger: false })}
              className={`flex-1 py-1.5 px-2 text-xs rounded-md border font-medium transition-all ${
                formData.immediateDanger === false
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              No / Stable
            </button>
          </div>
          {formData.immediateDanger === null && (
            <p className="text-[11px] text-amber-400 flex items-center gap-1 pt-0.5">
              <HelpCircle className="w-3 h-3 shrink-0" />
              Ambiguous in speech. Please select Yes or No.
            </p>
          )}
        </div>
      </div>

      {/* Vulnerability Flags */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-medium text-slate-300">Vulnerability Flags Detected</label>
        <div className="flex flex-wrap gap-2">
          {VULNERABILITY_OPTIONS.map((opt) => {
            const isSelected = formData.vulnerabilityFlags.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleVulnerability(opt.id)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Human Review Reminder & Actions */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400 max-w-md">
          <strong className="text-slate-300">Human confirmation required:</strong> AI extraction does not automatically
          verify or submit the report. Applying this draft will fill the report form for final review.
        </p>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button variant="ghost" size="sm" onClick={onDiscard} className="text-slate-400 hover:text-slate-200 flex-1 sm:flex-initial">
            Discard AI Draft
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => onApply(formData)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex-1 sm:flex-initial"
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply to Report Form
          </Button>
        </div>
      </div>
    </div>
  );
}
