import React, { useState } from 'react';
import {
  Waves,
  Mountain,
  Zap,
  Building2,
  Tent,
  AlertTriangle,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import type { IncidentType, VulnerabilityFlag } from '../../shared/types.ts';

export interface RealisticTemplate {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  incidentType: IncidentType;
  badgeText: string;
  badgeClass: string;
  description: string;
  originalTranscript: string;
  locationText: string;
  district: string;
  peopleAtRiskEstimate: number;
  immediateDanger: boolean;
  vulnerabilityFlags: VulnerabilityFlag[];
  contactName: string;
  contactPhone: string;
  latOffset: number;
  lngOffset: number;
}

export const REALISTIC_TEMPLATES: RealisticTemplate[] = [
  {
    id: 'flash_flood_elderly',
    title: 'Flash Flood & Trapped Elderly',
    subtitle: 'Stormwater overflow, 8 stranded on 1st-floor balcony',
    icon: <Waves className="w-4 h-4 text-blue-400" />,
    incidentType: 'flood',
    badgeText: 'CRITICAL',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    description:
      'Breach in northern stormwater canal. Water level is at chest height inside residential buildings along 3rd Cross. 8 residents including 2 elderly citizens unable to walk and an infant are stranded on the first-floor balcony. Main electrical transformer sparking nearby before tripping. Urgent boat rescue needed.',
    originalTranscript:
      'Water has entered our homes up to chest height! We have two senior citizens who cannot move and a 6-month-old baby on the balcony. Power lines fell into the water nearby. Please dispatch a rescue boat immediately to 3rd Cross Junction!',
    locationText: 'Main Bypass Road & 3rd Cross Junction',
    district: 'River Valley Sector',
    peopleAtRiskEstimate: 8,
    immediateDanger: true,
    vulnerabilityFlags: ['elderly_present', 'children_present'],
    contactName: 'Ramesh Sharma',
    contactPhone: '+91-98450-12845',
    latOffset: 0.003,
    lngOffset: -0.002,
  },
  {
    id: 'landslide_bus_trapped',
    title: 'Hillside Landslide & Stranded Bus',
    subtitle: 'Highway severed by mudflow, 42 passengers trapped',
    icon: <Mountain className="w-4 h-4 text-amber-400" />,
    incidentType: 'landslide',
    badgeText: 'HIGH URGENCY',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    description:
      'Heavy torrential rain triggered massive soil slip and boulders across both lanes of the mountain bypass. State passenger bus and light commercial van pinned between two mud slips. Boulders continuing to roll down from upper slope. Passengers unable to evacuate uphill safely.',
    originalTranscript:
      'This is Driver Anand reporting from Ghat Road KM 34. A massive landslide just came down right in front of the bus, and another slip fell behind us. We have 42 passengers inside, slope above is still sliding down. Need earthmovers and rescue team immediately!',
    locationText: 'Ghat Road KM 34, Viewpoint Curve',
    district: 'Northern Ridge',
    peopleAtRiskEstimate: 42,
    immediateDanger: true,
    vulnerabilityFlags: ['isolated_remote'],
    contactName: 'Inspector Anand Varma',
    contactPhone: '+91-98450-44912',
    latOffset: 0.012,
    lngOffset: 0.008,
  },
  {
    id: 'hospital_icu_generator',
    title: 'Hospital ICU Emergency Power Failure',
    subtitle: 'Basement flooded, 14 critical care patients on backup UPS',
    icon: <Zap className="w-4 h-4 text-yellow-400" />,
    incidentType: 'power_outage',
    badgeText: 'LIFE CRITICAL',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    description:
      'Basement diesel generator plant completely submerged following retaining wall collapse. Primary municipal grid and emergency backup diesel generator lost. 14 critical care ICU patients currently on battery backup with less than 40 minutes remaining runtime. High-capacity dewatering pump and mobile generator truck required.',
    originalTranscript:
      'Emergency call from General Hospital Chief Medical Officer. Our basement generator room is completely flooded. 14 patients on invasive ventilators are running on dying UPS batteries. We need emergency mobile generators and submersible dewatering pumps within the hour!',
    locationText: 'District General Hospital, South Emergency Wing',
    district: 'Central Medical District',
    peopleAtRiskEstimate: 14,
    immediateDanger: true,
    vulnerabilityFlags: ['medical_dependency', 'elderly_present'],
    contactName: 'Dr. Sunita Kulkarni (CMO)',
    contactPhone: '+91-98450-77319',
    latOffset: -0.005,
    lngOffset: 0.004,
  },
  {
    id: 'building_shear_cracks',
    title: 'Multi-Storey Complex Structural Cracks',
    subtitle: 'Load-bearing pillars cracked, LPG gas leak odor',
    icon: <Building2 className="w-4 h-4 text-emerald-400" />,
    incidentType: 'structure_collapse',
    badgeText: 'HIGH DANGER',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    description:
      'Significant structural displacement and vertical shear fractures observed on primary support pillars of a 4-storey commercial-residential complex following seismic vibrations. Chunks of masonry falling. Strong odor of commercial LPG detected from ground floor restaurant kitchen. 35 occupants evacuated to perimeter street.',
    originalTranscript:
      'Deep diagonal cracks opened up in the pillar of our apartment building after the shake. Plaster is falling down and we can smell LPG gas leaking from the ground floor shop. 35 people are out on the road, structural engineer and fire team required to cordon off the area.',
    locationText: 'Market Commercial Complex, 12 Station Road',
    district: 'Downtown Core',
    peopleAtRiskEstimate: 35,
    immediateDanger: true,
    vulnerabilityFlags: ['trapped_individuals'],
    contactName: 'Vikram Patel',
    contactPhone: '+91-98450-99201',
    latOffset: -0.002,
    lngOffset: -0.006,
  },
  {
    id: 'cyclone_relief_shelter',
    title: 'Relief Camp Clean Water & Ration Shortage',
    subtitle: '55 displaced families evacuated, drinking water depleted',
    icon: <Tent className="w-4 h-4 text-teal-400" />,
    incidentType: 'shelter_request',
    badgeText: 'RELIEF AID',
    badgeClass: 'bg-teal-950/80 text-teal-300 border-teal-700/60',
    description:
      'Coastal storm surge breached flood embankments, displacing 55 fishing families into Government Higher Secondary School relief shelter. Drinking water tanks depleted and local borewell contaminated with saline water. Immediate demand for clean drinking water tankers, baby milk formula, oral rehydration packets, and blankets.',
    originalTranscript:
      'Over 55 evacuated families have arrived at the Government High School relief camp. We have run out of potable drinking water and baby formula. Local wells are salty and undrinkable. Urgently request water tanker dispatch and emergency medical rations.',
    locationText: 'Government High School Relief Camp, Coastal Road',
    district: 'Coastal Sector',
    peopleAtRiskEstimate: 55,
    immediateDanger: false,
    vulnerabilityFlags: ['children_present', 'hospital_or_school_affected'],
    contactName: 'Mary Fernandez (Camp In-Charge)',
    contactPhone: '+91-98450-33510',
    latOffset: 0.008,
    lngOffset: -0.011,
  },
  {
    id: 'hazmat_chemical_spill',
    title: 'Chemical Tanker Rollover & Toxic Fumes',
    subtitle: 'Pungent vapor plume drifting toward residential colony',
    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
    incidentType: 'hazardous_material',
    badgeText: 'HAZMAT',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    description:
      'Industrial chemical tanker carrying chlorinated solvent overturned near bypass highway underpass. Pungent yellowish vapor cloud spreading downwind into surrounding residential colony. Residents reporting respiratory irritation and eye burning. Wind blowing eastward toward residential ward.',
    originalTranscript:
      'A chemical tanker truck flipped over at the bypass highway underpass. Yellow gas is leaking and blowing into homes. People are coughing and eyes are burning. Need Hazmat response unit and traffic diversion immediately!',
    locationText: 'National Highway Bypass, Underpass Pillar 14',
    district: 'Industrial Corridor',
    peopleAtRiskEstimate: 50,
    immediateDanger: true,
    vulnerabilityFlags: ['children_present', 'trapped_individuals'],
    contactName: 'Sub-Inspector K. Gowda',
    contactPhone: '+91-98450-66441',
    latOffset: 0.006,
    lngOffset: 0.014,
  },
];

interface RealisticScenarioTemplatesProps {
  onSelectTemplate: (template: RealisticTemplate) => void;
}

export function RealisticScenarioTemplates({ onSelectTemplate }: RealisticScenarioTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="surface-z1 rounded-xl border border-teal-500/30 overflow-hidden shadow-md">
      {/* Accordion / Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-slate-900 flex items-center justify-between text-left hover:bg-teal-950/60 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-teal-300 transition-colors flex items-center gap-2">
              <span>Use Real Emergency Scenario Template</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                6 Real Scenarios
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Click any template to auto-populate the form with authentic disaster logs and live GPS coords.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
          <span className="hidden sm:inline">{isOpen ? 'Hide Templates' : 'Choose Template'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Templates Grid */}
      {isOpen && (
        <div className="p-3 bg-[var(--surface-2-solid)] border-t border-[var(--border-subtle)] space-y-2 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {REALISTIC_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  onSelectTemplate(tmpl);
                  setIsOpen(false);
                }}
                className="p-3 rounded-lg bg-[var(--surface-1-solid)] hover:bg-slate-800/90 border border-[var(--border-subtle)] hover:border-teal-500/60 text-left transition-all duration-200 group flex flex-col justify-between hover:shadow-lg hover:shadow-teal-950/20 relative cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-slate-900/80 border border-slate-700/60 shrink-0">
                        {tmpl.icon}
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-teal-300 transition-colors">
                        {tmpl.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${tmpl.badgeClass}`}
                    >
                      {tmpl.badgeText}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-rose-300">
                      <Users className="w-3 h-3" />
                      {tmpl.peopleAtRiskEstimate} at risk
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[130px]">{tmpl.district}</span>
                  </div>
                  <span className="text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Load <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
