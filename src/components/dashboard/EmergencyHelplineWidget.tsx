import React, { useState } from 'react';
import { Phone, ShieldAlert, HeartHandshake, Info, LifeBuoy, AlertTriangle, Flame, Droplets, Activity, ChevronRight, Check } from 'lucide-react';

export function EmergencyHelplineWidget() {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hotlines' | 'guide' | 'safety'>('hotlines');

  const hotlines = [
    { number: '112', label: 'All-in-One National Emergency', desc: 'Police, Disaster, Search & Rescue', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
    { number: '108', label: 'Disaster Ambulance & Medical', desc: 'Critical Injury, Paramedics, Oxygen', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    { number: '101', label: 'Fire & Structural Rescue', desc: 'Trapped in rubble, Fire hazard, Collapse', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
    { number: '1070', label: 'State Disaster Management', desc: 'Flood relief, Evacuation, Safe shelter info', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' },
  ];

  const safetyTips = [
    {
      type: 'Flood & Rising Water',
      icon: <Droplets className="w-4 h-4 text-blue-400" />,
      tips: ['Move immediately to higher ground', 'Turn off electricity at the main breaker', 'Never drive or walk through moving water'],
    },
    {
      type: 'Fire & Smoke Hazard',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      tips: ['Crawl low under smoke to avoid toxic fumes', 'Feel doors with back of hand before opening', 'Signal your location from an open window'],
    },
    {
      type: 'Earthquake & Collapse',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      tips: ['Drop, Cover, and Hold On under sturdy furniture', 'Stay clear of exterior walls and windows', 'If trapped, tap on a pipe or wall to signal rescuers'],
    },
  ];

  const copyToClipboard = (num: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  };

  return (
    <div className="surface-z1 border border-[var(--border-subtle)] rounded-xl p-3.5 sm:p-4 space-y-3.5 shadow-sm text-xs bg-[#141611]/95">
      {/* Header with Segmented Switch */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-[#EBFC72]" />
          <h2 className="font-bold text-[var(--text-primary)] font-heading text-xs sm:text-sm">
            Emergency Help & Helplines
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('hotlines')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              activeTab === 'hotlines' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Hotlines
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              activeTab === 'guide' ? 'bg-teal-500/20 text-teal-300 font-bold' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              activeTab === 'safety' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Safety
          </button>
        </div>
      </div>

      {/* Tab 1: Emergency Helplines */}
      {activeTab === 'hotlines' && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Need urgent assistance? Tap any hotline below to dial immediately from your phone or mobile device:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {hotlines.map((hl) => (
              <div
                key={hl.number}
                className={`p-2.5 rounded-lg border ${hl.bg} flex items-center justify-between gap-2.5 transition-all hover:bg-black/30`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-base font-bold font-mono ${hl.color}`}>
                      {hl.number}
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                      {hl.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {hl.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hl.number)}
                    title="Copy phone number"
                    className="p-1 rounded bg-black/40 hover:bg-black/60 text-[var(--text-muted)] hover:text-white transition-colors"
                  >
                    {copiedNumber === hl.number ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-mono px-1">COPY</span>
                    )}
                  </button>
                  <a
                    href={`tel:${hl.number}`}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                  >
                    <Phone className="w-3 h-3" />
                    <span>CALL</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Plain English How-It-Works Guide */}
      {activeTab === 'guide' && (
        <div className="space-y-2.5 animate-fade-in text-[11px]">
          <div className="p-2.5 rounded-lg bg-black/30 border border-teal-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-teal-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">1</span>
              <span>Report in Plain Language or Voice</span>
            </div>
            <p className="text-[var(--text-muted)] pl-7">
              Speak or type what you see in any language (Hindi, Kannada, Tamil, English). GPS coordinates are automatically pinned.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-black/30 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">2</span>
              <span>Automated Life-Safety Triage</span>
            </div>
            <p className="text-[var(--text-muted)] pl-7">
              Emergencies with trapped individuals, infants, or elderly victims are automatically prioritized to the top of the queue.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-black/30 border border-rose-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-xs">3</span>
              <span>Fast Field Dispatch & Live Tracking</span>
            </div>
            <p className="text-[var(--text-muted)] pl-7">
              Boats, rescue helicopters, and ambulances are deployed with coordinates. Duplicate reports are linked to avoid wasted aid.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Vital Disaster Safety Instructions */}
      {activeTab === 'safety' && (
        <div className="space-y-2 animate-fade-in">
          {safetyTips.map((tip) => (
            <div key={tip.type} className="p-2.5 rounded-lg bg-black/30 border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)] text-[11px]">
                {tip.icon}
                <span>{tip.type}</span>
              </div>
              <ul className="pl-5 list-disc text-[10px] text-[var(--text-muted)] space-y-0.5">
                {tip.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
