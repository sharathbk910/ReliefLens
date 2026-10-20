export type UserRole = 'admin' | 'coordinator' | 'viewer';

export type ReportChannel =
  | 'phone_call'
  | 'sms'
  | 'social_media'
  | 'sensor'
  | 'field_volunteer'
  | 'other';

export type IncidentType =
  | 'flood'
  | 'earthquake'
  | 'landslide'
  | 'fire'
  | 'medical'
  | 'shelter_request'
  | 'other';

export type IncidentStatus =
  | 'new'
  | 'under_review'
  | 'confirmed'
  | 'resolved'
  | 'dismissed'
  | 'merged';

export type LocationPrecision = 'exact' | 'approximate' | 'unknown';

export type VerificationLevel =
  | 'unverified'
  | 'partially_corroborated'
  | 'corroborated'
  | 'coordinator_verified';

export type PriorityTier = 'critical' | 'high' | 'medium' | 'low';

export type DuplicateDecision = 'pending' | 'confirmed' | 'rejected';

export type VulnerabilityFlag =
  | 'children_present'
  | 'elderly_present'
  | 'medical_dependency'
  | 'isolated_remote';

export type UncertaintyFlag =
  | 'no_coordinates'
  | 'location_precision_unknown'
  | 'single_source'
  | 'people_at_risk_unknown'
  | 'conflicting_people_estimates'
  | 'stale_over_12h'
  | 'unverified_high_danger';

export interface ScoreFactors {
  immediate_danger: {
    points: number;
    max: number;
    source: 'flag' | 'keyword' | 'none';
    matched_keywords: string[];
  };
  people_at_risk: {
    points: number;
    max: number;
    input_value: number | null;
  };
  time_sensitivity: {
    points: number;
    max: number;
    hours_since_last_report: number;
  };
  vulnerability: {
    points: number;
    max: number;
    flags: VulnerabilityFlag[];
  };
  information_confidence: {
    points: number;
    max: number;
    verification_level: VerificationLevel;
  };
}

export interface ScoreBreakdown {
  ruleset_version: string;
  computed_score: number;
  floor_score: number;
  effective_score: number;
  priority_tier: PriorityTier;
  floor_applied: boolean;
  score_override: number | null;
  factors: ScoreFactors;
  uncertainty_flags: UncertaintyFlag[];
  computed_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

export interface Incident {
  id: string;
  title: string;
  incident_type: IncidentType;
  status: IncidentStatus;
  district: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: LocationPrecision;
  people_at_risk_estimate: number | null;
  vulnerability_flags: VulnerabilityFlag[];
  first_reported_at: string;
  last_reported_at: string;
  report_count: number;
  distinct_channel_count: number;
  verification_level: VerificationLevel;
  computed_score: number;
  score_override: number | null;
  effective_score: number;
  priority_tier: PriorityTier;
  score_breakdown: ScoreBreakdown;
  ruleset_version: string;
  uncertainty_flags: UncertaintyFlag[];
  merged_into_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  incident_id: string;
  channel: ReportChannel;
  incident_type: IncidentType;
  external_reference: string | null;
  description: string;
  reported_at: string;
  received_at: string;
  location_text: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: LocationPrecision;
  people_at_risk_estimate: number | null;
  immediate_danger: boolean;
  vulnerability_flags: VulnerabilityFlag[];
  created_by: string | null;
  created_at: string;
}

export interface ReportContact {
  report_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
}

export interface DuplicateCandidate {
  id: string;
  report_a_id: string;
  report_b_id: string;
  similarity_score: number;
  match_reasons: string[];
  decision: DuplicateDecision;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  // Joins
  report_a?: Report & { incident?: Incident };
  report_b?: Report & { incident?: Incident };
}

export interface PriorityOverride {
  id: string;
  incident_id: string;
  original_computed_score: number;
  override_score: number;
  reason: string;
  created_by: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}
