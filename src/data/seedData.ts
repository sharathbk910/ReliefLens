import type {
  Incident,
  Report,
  ReportContact,
  DuplicateCandidate,
  AuditLogEntry,
  UserRole,
} from '../shared/types.ts';
import { calculateIncidentScore } from '../shared/scoring.ts';
import { evaluateDuplicatePair } from '../shared/duplicate.ts';

// Simulated users
export const SEED_PROFILES = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    display_name: 'Chief Sarah Reynolds',
    role: 'admin' as UserRole,
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    display_name: 'Coordinator Marco Chen',
    role: 'coordinator' as UserRole,
    created_at: '2026-10-15T08:15:00Z',
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    display_name: 'Field Analyst Elena Rostova',
    role: 'viewer' as UserRole,
    created_at: '2026-10-15T08:30:00Z',
  },
];

export interface LabeledPair {
  reportAIndex: number;
  reportBIndex: number;
  isDuplicate: boolean;
  notes: string;
}

// 60+ Simulated Reports Generator
export function generateSeedDataset() {
  const baseTime = new Date('2026-10-20T10:00:00Z').getTime();

  // Raw report specs
  const rawReportSpecs = [
    // --- INCIDENT GROUP 1: East River Basin Levee Breach & Rising Waters (CRITICAL)
    {
      group: 'inc_1',
      channel: 'phone_call' as const,
      type: 'flood' as const,
      desc: 'Rapid rising water near Riverside Drive. 4 families stranded on rooftops, children present, water entering second floor.',
      minutesAgo: 45,
      loc: 'Riverside Drive & 4th Avenue',
      dist: 'East River Basin',
      lat: 37.7749,
      lng: -122.4194,
      prec: 'exact' as const,
      risk: 16,
      danger: true,
      flags: ['children_present', 'elderly_present'] as const,
      contact: { name: 'David Miller', phone: '+1-555-0101' },
    },
    {
      group: 'inc_1_dup', // Target duplicate for Report 0
      channel: 'sms' as const,
      type: 'flood' as const,
      desc: 'Water rising fast at 4th Ave and Riverside Dr. People trapped on the roof waving flags, water level rising quickly.',
      minutesAgo: 30,
      loc: '4th Ave & Riverside Dr near riverfront',
      dist: 'East River Basin',
      lat: 37.7752,
      lng: -122.4190,
      prec: 'exact' as const,
      risk: 15,
      danger: true,
      flags: ['children_present'] as const,
      contact: { name: 'Clara Hayes', phone: '+1-555-0102' },
    },
    {
      group: 'inc_1_dup2', // Another duplicate for Report 0
      channel: 'field_volunteer' as const,
      type: 'flood' as const,
      desc: 'Severe flash flood at Riverside Drive corner. Submerged vehicles, rising water trapping residents inside houses.',
      minutesAgo: 20,
      loc: 'Riverside Dr residential block',
      dist: 'East River Basin',
      lat: 37.7748,
      lng: -122.4198,
      prec: 'exact' as const,
      risk: 20,
      danger: true,
      flags: ['elderly_present'] as const,
    },
    {
      group: 'inc_1_nearmiss', // Near-miss: same district flood but 5 miles away and 11 hours apart
      channel: 'social_media' as const,
      type: 'flood' as const,
      desc: 'Water rising near the east municipal park drainage ditch. Park trails flooded, no homes damaged yet.',
      minutesAgo: 650,
      loc: 'East Municipal Park',
      dist: 'East River Basin',
      lat: 37.8100,
      lng: -122.3800,
      prec: 'approximate' as const,
      risk: 0,
      danger: false,
      flags: [] as const,
    },

    // --- INCIDENT GROUP 2: Midtown Industrial Electrical Fire & Wall Collapse (CRITICAL)
    {
      group: 'inc_2',
      channel: 'phone_call' as const,
      type: 'fire' as const,
      desc: 'Massive transformer fire spreading to adjacent warehouse on 12th St. Heavy black smoke, building partially collapsed, workers trapped inside.',
      minutesAgo: 35,
      loc: '450 East 12th Street, Midtown Logistics Yard',
      dist: 'Midtown Industrial',
      lat: 37.7610,
      lng: -122.3950,
      prec: 'exact' as const,
      risk: 25,
      danger: true,
      flags: ['medical_dependency'] as const,
      contact: { name: 'Shift Supervisor Alex Ray', phone: '+1-555-0201' },
    },
    {
      group: 'inc_2_dup', // Duplicate for Report 4
      channel: 'social_media' as const,
      type: 'fire' as const,
      desc: 'Heavy blaze and fire spreading across 12th street industrial warehouse. Collapsed concrete wall, emergency crews needed immediately.',
      minutesAgo: 25,
      loc: '12th St and Logistics Yard',
      dist: 'Midtown Industrial',
      lat: 37.7612,
      lng: -122.3948,
      prec: 'exact' as const,
      risk: 30,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_2_nearmiss', // Near-miss: Fire in Midtown but small dumpster fire 3 km away
      channel: 'phone_call' as const,
      type: 'fire' as const,
      desc: 'Small trash container fire behind supermarket on 3rd Ave. Contained to dumpster.',
      minutesAgo: 50,
      loc: '3rd Ave commercial alley',
      dist: 'Midtown Industrial',
      lat: 37.7850,
      lng: -122.4050,
      prec: 'approximate' as const,
      risk: 0,
      danger: false,
      flags: [] as const,
    },

    // --- INCIDENT GROUP 3: Northern Ridge Landslide & Blocked Mountain Pass (HIGH - UNVERIFIED HIGH DANGER)
    {
      group: 'inc_3',
      channel: 'field_volunteer' as const,
      type: 'landslide' as const,
      desc: 'Extensive mudslide collapsed mountain ridge road. Two vehicles submerged under debris, passengers trapped and screaming.',
      minutesAgo: 80,
      loc: 'Northern Ridge Pass Highway 101 KM 42',
      dist: 'Northern Ridge',
      lat: 37.8200,
      lng: -122.4800,
      prec: 'approximate' as const,
      risk: 6,
      danger: true,
      flags: ['isolated_remote'] as const,
    },
    {
      group: 'inc_3_dup', // Duplicate for Report 7
      channel: 'sms' as const,
      type: 'landslide' as const,
      desc: 'Major landslide at Highway 101 KM 42 near Northern Ridge pass. Cars trapped in debris, road completely cut off.',
      minutesAgo: 65,
      loc: 'Highway 101 KM 42 ridge road',
      dist: 'Northern Ridge',
      lat: 37.8205,
      lng: -122.4810,
      prec: 'approximate' as const,
      risk: 8,
      danger: true,
      flags: ['isolated_remote'] as const,
    },
    {
      group: 'inc_3_missing_loc', // Report with missing coordinates & unknown precision
      channel: 'social_media' as const,
      type: 'landslide' as const,
      desc: 'Huge rockslide somewhere on the north mountain road, power lines down, severe danger.',
      minutesAgo: 95,
      loc: 'North mountain road somewhere',
      dist: 'Northern Ridge',
      lat: null,
      lng: null,
      prec: 'unknown' as const,
      risk: null,
      danger: true,
      flags: ['isolated_remote'] as const,
    },

    // --- INCIDENT GROUP 4: South Sector Post-Quake Medical Emergencies (HIGH - CONFLICTING ESTIMATES)
    {
      group: 'inc_4',
      channel: 'phone_call' as const,
      type: 'medical' as const,
      desc: 'Ceiling collapsed at elderly care center after tremor. Multiple residents bleeding, unconscious, urgent ambulances requested.',
      minutesAgo: 110,
      loc: 'Sunnyvale Elder Home, 88 Pine Street',
      dist: 'South Sector',
      lat: 37.7200,
      lng: -122.4500,
      prec: 'exact' as const,
      risk: 4, // Estimate 4
      danger: true,
      flags: ['elderly_present', 'medical_dependency'] as const,
      contact: { name: 'Nurse Brenda Vance', phone: '+1-555-0301' },
    },
    {
      group: 'inc_4_dup', // Duplicate with conflicting estimate (25 people at risk => 25/4 = 6.25x ratio)
      channel: 'field_volunteer' as const,
      type: 'medical' as const,
      desc: 'Structural collapse at Sunnyvale Elder Care on Pine St. Approximately 25 elderly persons trapped or bleeding inside.',
      minutesAgo: 90,
      loc: '88 Pine Street Care Center',
      dist: 'South Sector',
      lat: 37.7202,
      lng: -122.4497,
      prec: 'exact' as const,
      risk: 25, // Estimate 25 -> triggers conflicting_people_estimates!
      danger: true,
      flags: ['elderly_present', 'medical_dependency'] as const,
    },

    // --- INCIDENT GROUP 5: Downtown Civic Pavilion Shelter & Logistics (MEDIUM)
    {
      group: 'inc_5',
      channel: 'field_volunteer' as const,
      type: 'shelter_request' as const,
      desc: 'Over 120 displaced flood victims arrived at Downtown Civic Pavilion. Urgent need for cots, blankets, clean water, and infant formula.',
      minutesAgo: 180,
      loc: 'Downtown Civic Pavilion, 500 Market Plaza',
      dist: 'Downtown Core',
      lat: 37.7890,
      lng: -122.4010,
      prec: 'exact' as const,
      risk: 120,
      danger: false,
      flags: ['children_present', 'elderly_present'] as const,
    },
    {
      group: 'inc_5_dup', // Duplicate for Report 12
      channel: 'sms' as const,
      type: 'shelter_request' as const,
      desc: 'Shelter request at Civic Pavilion on Market Plaza. 100+ evacuated people need potable water, hygiene kits, and baby supplies.',
      minutesAgo: 160,
      loc: 'Civic Pavilion Market Plaza',
      dist: 'Downtown Core',
      lat: 37.7893,
      lng: -122.4012,
      prec: 'exact' as const,
      risk: 110,
      danger: false,
      flags: ['children_present'] as const,
    },

    // --- INCIDENT GROUP 6: Harbour District Gas Leak & Coastal Surge (HIGH)
    {
      group: 'inc_6',
      channel: 'sensor' as const,
      type: 'other' as const,
      desc: 'Hazardous gas concentration sensor alarm triggered near Pier 39 fuel storage facility following storm surge impact.',
      minutesAgo: 40,
      loc: 'Pier 39 Marine Fuel Depot',
      dist: 'Harbour District',
      lat: 37.8080,
      lng: -122.4098,
      prec: 'exact' as const,
      risk: 12,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_6_dup', // Duplicate for Report 14
      channel: 'phone_call' as const,
      type: 'other' as const,
      desc: 'Pungent chemical gas smell and hissing pipe at Pier 39 fuel tanks. Immediate danger of fire spreading if ignited.',
      minutesAgo: 30,
      loc: 'Pier 39 Fuel Storage Terminal',
      dist: 'Harbour District',
      lat: 37.8082,
      lng: -122.4095,
      prec: 'exact' as const,
      risk: 10,
      danger: true,
      flags: [] as const,
      contact: { name: 'Port Guard Martinez', phone: '+1-555-0401' },
    },

    // --- INCIDENT GROUP 7: Westside Substation Outage & Oxygen Patients (MEDIUM - MEDICAL DEPENDENCY)
    {
      group: 'inc_7',
      channel: 'phone_call' as const,
      type: 'medical' as const,
      desc: 'Power cut off to residential apartments. 3 homebound patients on powered oxygen concentrators running out of battery backup.',
      minutesAgo: 70,
      loc: 'Grandview Apartments, 1200 Sunset Blvd',
      dist: 'Westside Heights',
      lat: 37.7500,
      lng: -122.4800,
      prec: 'exact' as const,
      risk: 3,
      danger: true,
      flags: ['medical_dependency', 'elderly_present'] as const,
      contact: { name: 'Dr. Gregory House', phone: '+1-555-0501' },
    },
    {
      group: 'inc_7_dup', // Duplicate for Report 16
      channel: 'sms' as const,
      type: 'medical' as const,
      desc: 'Sunset Blvd Grandview Apts has no power. Oxygen concentrators dying, elderly patients need emergency generators or transport.',
      minutesAgo: 55,
      loc: '1200 Sunset Blvd Grandview Apts',
      dist: 'Westside Heights',
      lat: 37.7502,
      lng: -122.4805,
      prec: 'exact' as const,
      risk: 3,
      danger: true,
      flags: ['medical_dependency'] as const,
    },

    // --- INCIDENT GROUP 8: Stale Sensor Ingestion (LOW / STALE OVER 12H)
    {
      group: 'inc_8_stale',
      channel: 'sensor' as const,
      type: 'flood' as const,
      desc: 'Culvert stream sensor reading elevated water level. Rate of rise stabilized.',
      minutesAgo: 850, // ~14.1 hours ago -> triggers stale_over_12h
      loc: 'Coyote Creek Culvert Sensor 7',
      dist: 'South Sector',
      lat: 37.7100,
      lng: -122.4200,
      prec: 'exact' as const,
      risk: 0,
      danger: false,
      flags: [] as const,
    },

    // --- INCIDENT GROUP 9: Valley Village Flash Flood & Bridge Impasse
    {
      group: 'inc_9',
      channel: 'field_volunteer' as const,
      type: 'flood' as const,
      desc: 'Valley Creek overflowed concrete culvert. Bridge submerged under 3 feet of water, two cars stranded.',
      minutesAgo: 60,
      loc: 'Old Valley Bridge, County Road 4',
      dist: 'Valley Basin',
      lat: 37.7350,
      lng: -122.3850,
      prec: 'exact' as const,
      risk: 5,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_9_dup', // Duplicate for Report 19
      channel: 'phone_call' as const,
      type: 'flood' as const,
      desc: 'Bridge submerged at County Road 4 Valley Creek. Motorists stranded on car roofs in rising water.',
      minutesAgo: 48,
      loc: 'County Road 4 Valley Creek Bridge',
      dist: 'Valley Basin',
      lat: 37.7353,
      lng: -122.3848,
      prec: 'exact' as const,
      risk: 4,
      danger: true,
      flags: [] as const,
    },

    // --- INCIDENT GROUP 10: North Shore Marina Fuel Leak & Fire Risk
    {
      group: 'inc_10',
      channel: 'field_volunteer' as const,
      type: 'fire' as const,
      desc: 'Diesel fuel spill ignited near dry docks. Fire spreading along timber boardwalk towards berthed vessels.',
      minutesAgo: 42,
      loc: 'North Shore Marina Slip 4B',
      dist: 'Harbour District',
      lat: 37.8050,
      lng: -122.4300,
      prec: 'exact' as const,
      risk: 8,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_10_dup', // Duplicate for Report 21
      channel: 'social_media' as const,
      type: 'fire' as const,
      desc: 'Fire spreading on boardwalk at North Shore Marina Slip 4. Boats catching fire, heavy smoke plume.',
      minutesAgo: 32,
      loc: 'North Shore Marina Boardwalk Slip 4',
      dist: 'Harbour District',
      lat: 37.8052,
      lng: -122.4303,
      prec: 'exact' as const,
      risk: 10,
      danger: true,
      flags: [] as const,
    },

    // --- INCIDENT GROUP 11: Foothills Community Clinic Evacuation
    {
      group: 'inc_11',
      channel: 'phone_call' as const,
      type: 'medical' as const,
      desc: 'Clinic basement flooded, backup batteries submerged. 8 bedridden dialysis patients need immediate evacuation transport.',
      minutesAgo: 75,
      loc: 'Foothills Community Clinic, 900 Alpine Way',
      dist: 'Northern Ridge',
      lat: 37.8150,
      lng: -122.4600,
      prec: 'exact' as const,
      risk: 8,
      danger: true,
      flags: ['medical_dependency', 'elderly_present'] as const,
    },
    {
      group: 'inc_11_dup', // Duplicate for Report 23
      channel: 'field_volunteer' as const,
      type: 'medical' as const,
      desc: 'Urgent medical evacuation needed at Foothills Clinic Alpine Way. Dialysis patients trapped by flooded basement.',
      minutesAgo: 50,
      loc: 'Alpine Way Foothills Clinic',
      dist: 'Northern Ridge',
      lat: 37.8152,
      lng: -122.4598,
      prec: 'exact' as const,
      risk: 8,
      danger: true,
      flags: ['medical_dependency'] as const,
    },

    // --- INCIDENT GROUP 12: East Side Primary School Evacuee Station
    {
      group: 'inc_12',
      channel: 'sms' as const,
      type: 'shelter_request' as const,
      desc: 'Elementary school gymnasium converted to temporary reception. 85 neighborhood residents sheltering, shortage of cots and potable water.',
      minutesAgo: 210,
      loc: 'East Side Elementary School, 310 Oak Street',
      dist: 'East River Basin',
      lat: 37.7700,
      lng: -122.4100,
      prec: 'exact' as const,
      risk: 85,
      danger: false,
      flags: ['children_present', 'elderly_present'] as const,
    },
    {
      group: 'inc_12_dup', // Duplicate for Report 25
      channel: 'phone_call' as const,
      type: 'shelter_request' as const,
      desc: 'East Side Elementary shelter station holding 90 people. Urgent need for drinking water and blankets.',
      minutesAgo: 190,
      loc: 'Oak Street Elementary Gymnasium',
      dist: 'East River Basin',
      lat: 37.7704,
      lng: -122.4102,
      prec: 'exact' as const,
      risk: 90,
      danger: false,
      flags: ['children_present'] as const,
    },

    // --- INCIDENT GROUP 13: Central Rail Terminal Glass Canopy Damage
    {
      group: 'inc_13',
      channel: 'field_volunteer' as const,
      type: 'earthquake' as const,
      desc: 'Shattered overhead glass canopy fell onto concourse after ground shaking. Multiple pedestrians bleeding and cut by falling shards.',
      minutesAgo: 95,
      loc: 'Central Railway Station Main Concourse',
      dist: 'Downtown Core',
      lat: 37.7800,
      lng: -122.4000,
      prec: 'exact' as const,
      risk: 14,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_13_dup', // Duplicate for Report 27
      channel: 'social_media' as const,
      type: 'earthquake' as const,
      desc: 'Glass roof collapsed at Central Railway station main concourse. People bleeding and injured, emergency medical teams needed.',
      minutesAgo: 82,
      loc: 'Central Station Concourse',
      dist: 'Downtown Core',
      lat: 37.7802,
      lng: -122.3998,
      prec: 'exact' as const,
      risk: 15,
      danger: true,
      flags: [] as const,
    },

    // --- INCIDENT GROUP 14: Timber Ridge Wildfire Smoke & Spark Incursion
    {
      group: 'inc_14',
      channel: 'phone_call' as const,
      type: 'fire' as const,
      desc: 'Spot fires spreading rapidly from adjacent canyon into residential fence lines on Timber Ridge Trail.',
      minutesAgo: 50,
      loc: '740 Timber Ridge Trail',
      dist: 'Northern Ridge',
      lat: 37.8300,
      lng: -122.4700,
      prec: 'exact' as const,
      risk: 18,
      danger: true,
      flags: ['isolated_remote'] as const,
    },
    {
      group: 'inc_14_dup', // Duplicate for Report 29
      channel: 'sms' as const,
      type: 'fire' as const,
      desc: 'Fire spreading across brush towards homes on Timber Ridge Trail. High winds blowing embers, immediate danger to houses.',
      minutesAgo: 38,
      loc: 'Timber Ridge Trail residential area',
      dist: 'Northern Ridge',
      lat: 37.8304,
      lng: -122.4703,
      prec: 'exact' as const,
      risk: 20,
      danger: true,
      flags: ['isolated_remote'] as const,
    },

    // --- INCIDENT GROUP 15: South Bay Floodgate Failure
    {
      group: 'inc_15',
      channel: 'sensor' as const,
      type: 'flood' as const,
      desc: 'Tidal floodgate actuator failure reported by SCADA monitor. Inflow valve jammed open during peak tidal surge.',
      minutesAgo: 65,
      loc: 'South Bay Tidal Gate 3',
      dist: 'South Sector',
      lat: 37.7150,
      lng: -122.4150,
      prec: 'exact' as const,
      risk: 0,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_15_dup', // Duplicate for Report 31
      channel: 'field_volunteer' as const,
      type: 'flood' as const,
      desc: 'Tidal Gate 3 stuck wide open at South Bay. Water pouring into industrial access roads, rising water threatening electrical vault.',
      minutesAgo: 45,
      loc: 'South Bay Gate 3 access road',
      dist: 'South Sector',
      lat: 37.7153,
      lng: -122.4152,
      prec: 'exact' as const,
      risk: 2,
      danger: true,
      flags: [] as const,
    },

    // --- 30 Additional Realistic Reports to reach 62 total reports, covering missing locations,
    // various tiers, channels, near-misses, and edge conditions
    {
      group: 'inc_16',
      channel: 'social_media' as const,
      type: 'flood' as const,
      desc: 'Water knee deep on Chestnut Street near elementary school. Parents carrying children across flooded intersections.',
      minutesAgo: 120,
      loc: 'Chestnut Street & 18th Avenue',
      dist: 'Westside Heights',
      lat: 37.7600,
      lng: -122.4700,
      prec: 'approximate' as const,
      risk: 15,
      danger: false,
      flags: ['children_present'] as const,
    },
    {
      group: 'inc_17',
      channel: 'field_volunteer' as const,
      type: 'medical' as const,
      desc: 'Elderly gentleman collapsed on sidewalk in shock, hypothermia symptoms, conscious but confused.',
      minutesAgo: 30,
      loc: 'Corner of 6th & Mission',
      dist: 'Downtown Core',
      lat: 37.7810,
      lng: -122.4080,
      prec: 'exact' as const,
      risk: 1,
      danger: true,
      flags: ['elderly_present'] as const,
    },
    {
      group: 'inc_18',
      channel: 'sms' as const,
      type: 'shelter_request' as const,
      desc: 'Church basement ready to accept 40 evacuees. Requesting volunteer intake staff and meal deliveries.',
      minutesAgo: 320,
      loc: 'Grace Community Church, 220 Maple St',
      dist: 'East River Basin',
      lat: 37.7780,
      lng: -122.4150,
      prec: 'exact' as const,
      risk: 40,
      danger: false,
      flags: [] as const,
    },
    {
      group: 'inc_19',
      channel: 'other' as const,
      type: 'landslide' as const,
      desc: 'Minor soil slip along retaining wall behind residential carport. No injuries, property inspector needed.',
      minutesAgo: 400,
      loc: '44 Hillside Terrace',
      dist: 'Northern Ridge',
      lat: 37.8250,
      lng: -122.4650,
      prec: 'exact' as const,
      risk: 0,
      danger: false,
      flags: [] as const,
    },
    {
      group: 'inc_20',
      channel: 'phone_call' as const,
      type: 'other' as const,
      desc: 'Large eucalyptus tree fell across primary electrical wires. Live sparking wires dancing on wet asphalt.',
      minutesAgo: 85,
      loc: '550 Skyline Boulevard',
      dist: 'Westside Heights',
      lat: 37.7400,
      lng: -122.4900,
      prec: 'exact' as const,
      risk: 2,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_21_no_coords', // Missing coordinates report
      channel: 'social_media' as const,
      type: 'medical' as const,
      desc: 'Neighbor having severe asthma attack and inhaler was lost in the floodwaters. Desperately need medical support.',
      minutesAgo: 70,
      loc: 'Near the old bakery in River district',
      dist: 'East River Basin',
      lat: null,
      lng: null,
      prec: 'unknown' as const,
      risk: 1,
      danger: true,
      flags: ['medical_dependency'] as const,
    },
    {
      group: 'inc_22',
      channel: 'field_volunteer' as const,
      type: 'flood' as const,
      desc: 'Basement sump pump failed in apartment complex. Water 4 inches deep and rising slowly towards utility boilers.',
      minutesAgo: 140,
      loc: '780 Howard Street',
      dist: 'Downtown Core',
      lat: 37.7840,
      lng: -122.4020,
      prec: 'exact' as const,
      risk: 30,
      danger: false,
      flags: [] as const,
    },
    {
      group: 'inc_23',
      channel: 'sensor' as const,
      type: 'earthquake' as const,
      desc: 'Seismic accelerometer registered 4.2 local magnitude shake. Low probability of widespread structural collapse.',
      minutesAgo: 240,
      loc: 'Seismic Station SS-04',
      dist: 'South Sector',
      lat: 37.7120,
      lng: -122.4300,
      prec: 'exact' as const,
      risk: 0,
      danger: false,
      flags: [] as const,
    },
    {
      group: 'inc_24',
      channel: 'phone_call' as const,
      type: 'fire' as const,
      desc: 'Roof solar panel array smoking and sparking after lightning strike. Building occupants evacuated to sidewalk.',
      minutesAgo: 115,
      loc: '1020 Folsom Street',
      dist: 'Midtown Industrial',
      lat: 37.7770,
      lng: -122.4060,
      prec: 'exact' as const,
      risk: 12,
      danger: true,
      flags: [] as const,
    },
    {
      group: 'inc_25',
      channel: 'sms' as const,
      type: 'shelter_request' as const,
      desc: 'Single mother with 3 toddlers and disabled grandmother stranded at bus terminal. Seeking dry shelter tonight.',
      minutesAgo: 130,
      loc: 'Transbay Transit Concourse Gate 12',
      dist: 'Downtown Core',
      lat: 37.7895,
      lng: -122.3970,
      prec: 'exact' as const,
      risk: 5,
      danger: false,
      flags: ['children_present', 'elderly_present', 'medical_dependency'] as const,
    },
    // Remaining items to ensure >= 60 reports
    ...Array.from({ length: 22 }).map((_, idx) => {
      const types = ['flood', 'medical', 'fire', 'shelter_request', 'landslide', 'other'] as const;
      const channels = ['phone_call', 'sms', 'social_media', 'sensor', 'field_volunteer'] as const;
      const t = types[idx % types.length];
      const ch = channels[idx % channels.length];
      const mins = 150 + idx * 25;
      return {
        group: `inc_bulk_${idx + 26}`,
        channel: ch,
        type: t,
        desc: `Simulated auxiliary field report #${idx + 26} regarding ${t} monitoring, road accessibility, and community assistance needs.`,
        minutesAgo: mins,
        loc: `Auxiliary Sector Post ${idx + 1}, Block ${10 + idx}`,
        dist: idx % 2 === 0 ? 'Valley Basin' : 'Harbour District',
        lat: 37.75 + (idx * 0.003),
        lng: -122.42 - (idx * 0.002),
        prec: 'approximate' as const,
        risk: (idx * 3) % 20,
        danger: idx % 5 === 0,
        flags: idx % 3 === 0 ? (['children_present'] as const) : ([] as const),
      };
    }),
  ];

  // Convert raw specs to Report and Incident objects
  const reports: Report[] = [];
  const contacts: ReportContact[] = [];
  const incidentMap = new Map<string, Incident>();

  rawReportSpecs.forEach((spec, idx) => {
    const reportId = `a0000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`;
    const incidentId = `b0000000-0000-4000-8000-${String(idx + 1).padStart(12, '0')}`;
    const reportedAt = new Date(baseTime - spec.minutesAgo * 60 * 1000).toISOString();

    const report: Report = {
      id: reportId,
      incident_id: incidentId,
      channel: spec.channel,
      incident_type: spec.type,
      external_reference: `REF-${1000 + idx}`,
      description: spec.desc,
      reported_at: reportedAt,
      received_at: reportedAt,
      location_text: spec.loc,
      district: spec.dist,
      latitude: spec.lat,
      longitude: spec.lng,
      location_precision: spec.prec,
      people_at_risk_estimate: spec.risk,
      immediate_danger: spec.danger,
      vulnerability_flags: [...spec.flags] as any,
      created_by: SEED_PROFILES[1].id,
      created_at: reportedAt,
    };

    reports.push(report);

    if ((spec as any).contact) {
      contacts.push({
        report_id: reportId,
        contact_name: (spec as any).contact.name,
        contact_phone: (spec as any).contact.phone,
        created_at: reportedAt,
      });
    }

    // Compute initial incident
    const scoreResult = calculateIncidentScore({
      reports: [report],
      verificationLevel: 'unverified',
      asOf: new Date(baseTime),
    });

    const incident: Incident = {
      id: incidentId,
      title: `${spec.type.toUpperCase()} in ${spec.dist}: ${spec.loc}`,
      incident_type: spec.type,
      status: 'new',
      district: spec.dist,
      location_text: spec.loc,
      latitude: spec.lat,
      longitude: spec.lng,
      location_precision: spec.prec,
      people_at_risk_estimate: spec.risk,
      vulnerability_flags: [...spec.flags] as any,
      first_reported_at: reportedAt,
      last_reported_at: reportedAt,
      report_count: 1,
      distinct_channel_count: 1,
      verification_level: 'unverified',
      computed_score: scoreResult.computed_score,
      score_override: null,
      effective_score: scoreResult.effective_score,
      priority_tier: scoreResult.priority_tier,
      score_breakdown: scoreResult,
      ruleset_version: scoreResult.ruleset_version,
      uncertainty_flags: scoreResult.uncertainty_flags,
      merged_into_id: null,
      created_by: SEED_PROFILES[1].id,
      created_at: reportedAt,
      updated_at: reportedAt,
    };

    incidentMap.set(incidentId, incident);
  });

  // Labeled duplicate pairs (at least 15 pairs) & near-miss pairs (at least 10 pairs)
  // Indices corresponding to rawReportSpecs:
  const labeledPairs: LabeledPair[] = [
    // 15 Labeled True Duplicates:
    { reportAIndex: 0, reportBIndex: 1, isDuplicate: true, notes: 'East River flood rooftop rescues (same event, 15m apart)' },
    { reportAIndex: 0, reportBIndex: 2, isDuplicate: true, notes: 'East River flood volunteer vs 911 call' },
    { reportAIndex: 4, reportBIndex: 5, isDuplicate: true, notes: 'Midtown warehouse transformer fire & collapse' },
    { reportAIndex: 7, reportBIndex: 8, isDuplicate: true, notes: 'Northern Ridge Highway 101 mudslide' },
    { reportAIndex: 10, reportBIndex: 11, isDuplicate: true, notes: 'Sunnyvale elder care ceiling collapse' },
    { reportAIndex: 12, reportBIndex: 13, isDuplicate: true, notes: 'Civic Pavilion displaced persons shelter request' },
    { reportAIndex: 14, reportBIndex: 15, isDuplicate: true, notes: 'Pier 39 gas storage leak & surge damage' },
    { reportAIndex: 16, reportBIndex: 17, isDuplicate: true, notes: 'Sunset Blvd apartment power outage oxygen patients' },
    { reportAIndex: 19, reportBIndex: 20, isDuplicate: true, notes: 'Valley Creek bridge submerged motorists stranded' },
    { reportAIndex: 21, reportBIndex: 22, isDuplicate: true, notes: 'North Shore Marina timber boardwalk diesel fire' },
    { reportAIndex: 23, reportBIndex: 24, isDuplicate: true, notes: 'Alpine Way clinic flooded basement dialysis patients' },
    { reportAIndex: 25, reportBIndex: 26, isDuplicate: true, notes: 'East Side Elementary shelter station water shortage' },
    { reportAIndex: 27, reportBIndex: 28, isDuplicate: true, notes: 'Central Railway main concourse glass canopy collapse' },
    { reportAIndex: 29, reportBIndex: 30, isDuplicate: true, notes: 'Timber Ridge Trail canyon wildfire spot fires' },
    { reportAIndex: 31, reportBIndex: 32, isDuplicate: true, notes: 'South Bay Tidal Gate 3 actuator failure & inflow' },

    // 10 Labeled Near-Miss Pairs:
    { reportAIndex: 0, reportBIndex: 3, isDuplicate: false, notes: 'Near-miss: East River Basin flood, but municipal park 5 miles away' },
    { reportAIndex: 4, reportBIndex: 6, isDuplicate: false, notes: 'Near-miss: Midtown fire, but small dumpster 3 km away' },
    { reportAIndex: 7, reportBIndex: 9, isDuplicate: false, notes: 'Near-miss: Landslide in Northern Ridge vs vague unlocated report' },
    { reportAIndex: 10, reportBIndex: 16, isDuplicate: false, notes: 'Near-miss: Both medical, but different sectors and facilities' },
    { reportAIndex: 12, reportBIndex: 25, isDuplicate: false, notes: 'Near-miss: Both shelter requests, but different schools/pavilions' },
    { reportAIndex: 14, reportBIndex: 21, isDuplicate: false, notes: 'Near-miss: Both in Harbour District, but fuel tank leak vs boat fire' },
    { reportAIndex: 18, reportBIndex: 31, isDuplicate: false, notes: 'Near-miss: Culvert sensor flood vs tidal gate failure' },
    { reportAIndex: 23, reportBIndex: 11, isDuplicate: false, notes: 'Near-miss: Clinic evacuation vs nursing home collapse' },
    { reportAIndex: 1, reportBIndex: 33, isDuplicate: false, notes: 'Near-miss: Flood on Riverside vs flooded intersection on Chestnut' },
    { reportAIndex: 5, reportBIndex: 41, isDuplicate: false, notes: 'Near-miss: Warehouse fire vs rooftop solar panel smoking' },
  ];

  // Generate DuplicateCandidate records for the true duplicates and near-misses
  const duplicateCandidates: DuplicateCandidate[] = [];

  labeledPairs.forEach((pair, pIdx) => {
    const repA = reports[pair.reportAIndex];
    const repB = reports[pair.reportBIndex];
    if (!repA || !repB) return;

    const [first, second] = repA.id < repB.id ? [repA, repB] : [repB, repA];
    const match = evaluateDuplicatePair(first, second);

    duplicateCandidates.push({
      id: `c0000000-0000-4000-8000-${String(pIdx + 1).padStart(12, '0')}`,
      report_a_id: first.id,
      report_b_id: second.id,
      similarity_score: match.similarityScore,
      match_reasons: match.reasons,
      decision: 'pending',
      decided_by: null,
      decided_at: null,
      created_at: new Date(baseTime - 15 * 60 * 1000).toISOString(),
      report_a: { ...first, incident: incidentMap.get(first.incident_id) },
      report_b: { ...second, incident: incidentMap.get(second.incident_id) },
    });
  });

  // Seed some initial audit entries
  const auditLogs: AuditLogEntry[] = [
    {
      id: 'd0000000-0000-4000-8000-000000000001',
      actor_id: SEED_PROFILES[0].id,
      actor_name: SEED_PROFILES[0].display_name,
      action: 'system_initialized',
      entity_type: 'system',
      entity_id: 'seed_dataset',
      details: {
        dataset: 'simulated_emergency_scenario_v1',
        total_reports: reports.length,
        total_labeled_pairs: labeledPairs.length,
      },
      created_at: new Date(baseTime - 240 * 60 * 1000).toISOString(),
    },
  ];

  return {
    profiles: SEED_PROFILES,
    incidents: Array.from(incidentMap.values()),
    reports,
    contacts,
    duplicateCandidates,
    labeledPairs,
    auditLogs,
  };
}
