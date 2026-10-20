import { supabase, isSupabaseConfigured } from './supabase.ts';
import type {
  AuditLogEntry,
  DuplicateCandidate,
  DuplicateDecision,
  Incident,
  IncidentStatus,
  IncidentType,
  PriorityTier,
  Profile,
  Report,
  ReportContact,
  UserRole,
  VerificationLevel,
  VoiceExtractionResult,
} from '../shared/types.ts';
import { calculateIncidentScore, getPriorityTier } from '../shared/scoring.ts';
import {
  evaluateDuplicatePair,
  findDuplicateSuggestions,
} from '../shared/duplicate.ts';
import { generateSeedDataset, SEED_PROFILES } from '../data/seedData.ts';
import type {
  OverridePriorityInput,
  ReportIngestionInput,
  ReviewDuplicateInput,
  UpdateIncidentStatusInput,
} from '../shared/schemas.ts';

const STORAGE_KEY = 'relieflens_sandbox_db_v1';

interface LocalDB {
  profiles: Profile[];
  incidents: Incident[];
  reports: Report[];
  contacts: ReportContact[];
  duplicateCandidates: DuplicateCandidate[];
  auditLogs: AuditLogEntry[];
  currentUserId: string;
}

function loadInitialDB(): LocalDB {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse cached local DB', e);
      }
    }
  }

  const seed = generateSeedDataset();
  const db: LocalDB = {
    profiles: seed.profiles,
    incidents: seed.incidents,
    reports: seed.reports,
    contacts: seed.contacts,
    duplicateCandidates: seed.duplicateCandidates,
    auditLogs: seed.auditLogs,
    currentUserId: seed.profiles[1].id, // Default to Coordinator for immediate productivity
  };

  saveDB(db);
  return db;
}

function saveDB(db: LocalDB) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

// In-memory working copy
let localDB: LocalDB = loadInitialDB();

export const dataService = {
  // Reset seed data
  resetSeedData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    localDB = loadInitialDB();
  },

  // Auth & Roles
  getCurrentUser(): Profile {
    const user =
      localDB.profiles.find((p) => p.id === localDB.currentUserId) ||
      localDB.profiles[1];
    return user;
  },

  setCurrentUserRole(role: UserRole): Profile {
    const found = localDB.profiles.find((p) => p.role === role);
    if (found) {
      localDB.currentUserId = found.id;
      saveDB(localDB);
      return found;
    }
    localDB.currentUserId = localDB.profiles[1].id;
    saveDB(localDB);
    return localDB.profiles[1];
  },

  getAvailableProfiles(): Profile[] {
    return localDB.profiles;
  },

  // 1. Fetch Incidents with filters and pagination
  async getIncidents(params: {
    search?: string;
    status?: IncidentStatus | 'all';
    incidentType?: IncidentType | 'all';
    priorityTier?: PriorityTier | 'all';
    district?: string | 'all';
    hasUncertainty?: boolean;
    sortBy?: 'effective_score' | 'last_reported_at';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ incidents: Incident[]; total: number; page: number; pageSize: number }> {
    const {
      search = '',
      status = 'all',
      incidentType = 'all',
      priorityTier = 'all',
      district = 'all',
      hasUncertainty = false,
      sortBy = 'effective_score',
      sortOrder = 'desc',
      page = 1,
      pageSize = 25,
    } = params;

    let items = [...localDB.incidents];

    // Filter out merged incidents by default unless searched
    if (status !== 'merged') {
      items = items.filter((i) => i.status !== 'merged');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.district && i.district.toLowerCase().includes(q)) ||
          (i.location_text && i.location_text.toLowerCase().includes(q)) ||
          i.incident_type.toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      items = items.filter((i) => i.status === status);
    }

    if (incidentType !== 'all') {
      items = items.filter((i) => i.incident_type === incidentType);
    }

    if (priorityTier !== 'all') {
      items = items.filter((i) => i.priority_tier === priorityTier);
    }

    if (district !== 'all') {
      items = items.filter((i) => i.district === district);
    }

    if (hasUncertainty) {
      items = items.filter((i) => i.uncertainty_flags && i.uncertainty_flags.length > 0);
    }

    // Sort
    items.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'last_reported_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (sortOrder === 'desc') {
        return valB > valA ? 1 : valB < valA ? -1 : 0;
      } else {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
    });

    const total = items.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = items.slice(startIndex, startIndex + pageSize);

    return {
      incidents: paginated,
      total,
      page,
      pageSize,
    };
  },

  // 2. Fetch Single Incident with reports and candidate review indicators
  async getIncidentById(id: string): Promise<{
    incident: Incident | null;
    reports: Report[];
    hasPendingDuplicates: boolean;
    overridesHistory: any[];
  }> {
    const incident = localDB.incidents.find((i) => i.id === id) || null;
    if (!incident) {
      return {
        incident: null,
        reports: [],
        hasPendingDuplicates: false,
        overridesHistory: [],
      };
    }

    const reports = localDB.reports
      .filter((r) => r.incident_id === id)
      .sort(
        (a, b) =>
          new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
      );

    const reportIds = new Set(reports.map((r) => r.id));
    const hasPendingDuplicates = localDB.duplicateCandidates.some(
      (c) =>
        c.decision === 'pending' &&
        (reportIds.has(c.report_a_id) || reportIds.has(c.report_b_id))
    );

    return {
      incident,
      reports,
      hasPendingDuplicates,
      overridesHistory: [],
    };
  },

  // 3. Restricted Report Contacts (coordinators and admins only)
  async getReportContact(reportId: string): Promise<ReportContact | null> {
    const user = this.getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'coordinator') {
      return null;
    }
    return localDB.contacts.find((c) => c.report_id === reportId) || null;
  },

  // 4. Duplicate Review Queue
  async getDuplicateCandidates(
    decision: DuplicateDecision = 'pending'
  ): Promise<DuplicateCandidate[]> {
    const list = localDB.duplicateCandidates.filter((c) => c.decision === decision);

    // Hydrate joined reports and incidents
    return list.map((c) => {
      const repA = localDB.reports.find((r) => r.id === c.report_a_id);
      const repB = localDB.reports.find((r) => r.id === c.report_b_id);
      const incA = repA
        ? localDB.incidents.find((i) => i.id === repA.incident_id)
        : undefined;
      const incB = repB
        ? localDB.incidents.find((i) => i.id === repB.incident_id)
        : undefined;

      return {
        ...c,
        report_a: repA ? { ...repA, incident: incA } : undefined,
        report_b: repB ? { ...repB, incident: incB } : undefined,
      };
    });
  },

  // 5. Ingest Report (Transactional create report + incident + scoring + duplicate detection + audit)
  async ingestReport(input: ReportIngestionInput): Promise<{
    report_id: string;
    incident_id: string;
    computed_score: number;
    effective_score: number;
    priority_tier: PriorityTier;
    ruleset_version: string;
    uncertainty_flags: string[];
    duplicate_suggestions_count: number;
  }> {
    const user = this.getCurrentUser();
    if (user.role === 'viewer') {
      throw new Error('Forbidden: Viewers cannot create reports.');
    }

    const reportId = crypto.randomUUID();
    const incidentId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const initialReport: Report = {
      id: reportId,
      incident_id: incidentId,
      channel: input.channel,
      incident_type: input.incident_type,
      external_reference: input.external_reference || null,
      description: input.description,
      reported_at: input.reported_at,
      received_at: nowIso,
      location_text: input.location_text || null,
      district: input.district || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_precision: input.location_precision,
      people_at_risk_estimate: input.people_at_risk_estimate ?? null,
      immediate_danger: input.immediate_danger,
      vulnerability_flags: input.vulnerability_flags,
      original_transcript: input.original_transcript ?? null,
      detected_language: input.detected_language ?? null,
      normalized_description: input.normalized_description ?? null,
      location_source: input.location_source ?? null,
      location_accuracy: input.location_accuracy ?? null,
      location_captured_at: input.location_captured_at ?? null,
      user_confirmed_incident_location: input.user_confirmed_incident_location ?? false,
      created_by: user.id,
      created_at: nowIso,
    };

    // Calculate deterministic score
    const scoreResult = calculateIncidentScore({
      reports: [initialReport],
      verificationLevel: 'unverified',
    });

    const title = `${input.incident_type.toUpperCase()} in ${input.district || input.location_text || 'Reported Area'}: ${input.location_text || input.district || 'Location details pending'}`;

    const incident: Incident = {
      id: incidentId,
      title,
      incident_type: input.incident_type,
      status: 'new',
      district: input.district || null,
      location_text: input.location_text || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_precision: input.location_precision,
      location_source: input.location_source ?? null,
      location_accuracy: input.location_accuracy ?? null,
      user_confirmed_incident_location: input.user_confirmed_incident_location ?? false,
      people_at_risk_estimate: input.people_at_risk_estimate ?? null,
      vulnerability_flags: input.vulnerability_flags,
      first_reported_at: input.reported_at,
      last_reported_at: input.reported_at,
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
      created_by: user.id,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Duplicate detection
    const existingReportsWithIncidents = localDB.reports.map((r) => ({
      ...r,
      incident: localDB.incidents.find((i) => i.id === r.incident_id),
    }));

    const suggestions = findDuplicateSuggestions(
      initialReport,
      existingReportsWithIncidents
    );

    for (const sugg of suggestions) {
      const [idA, idB] = [initialReport.id, sugg.candidateReport.id].sort();
      const candidate: DuplicateCandidate = {
        id: crypto.randomUUID(),
        report_a_id: idA,
        report_b_id: idB,
        similarity_score: sugg.matchResult.similarityScore,
        match_reasons: sugg.matchResult.reasons,
        decision: 'pending',
        decided_by: null,
        decided_at: null,
        created_at: nowIso,
      };
      localDB.duplicateCandidates.unshift(candidate);
    }

    // Persist contact if restricted info provided
    if (input.contact_name || input.contact_phone) {
      localDB.contacts.push({
        report_id: reportId,
        contact_name: input.contact_name || null,
        contact_phone: input.contact_phone || null,
        created_at: nowIso,
      });
    }

    localDB.incidents.unshift(incident);
    localDB.reports.unshift(initialReport);

    // Audit log
    localDB.auditLogs.unshift({
      id: crypto.randomUUID(),
      actor_id: user.id,
      actor_name: user.display_name,
      action: 'report_ingested',
      entity_type: 'report',
      entity_id: reportId,
      details: {
        incident_id: incidentId,
        title: incident.title,
        computed_score: scoreResult.computed_score,
        tier: scoreResult.priority_tier,
        duplicates_suggested: suggestions.length,
      },
      created_at: nowIso,
    });

    saveDB(localDB);

    return {
      report_id: reportId,
      incident_id: incidentId,
      computed_score: scoreResult.computed_score,
      effective_score: scoreResult.effective_score,
      priority_tier: scoreResult.priority_tier,
      ruleset_version: scoreResult.ruleset_version,
      uncertainty_flags: scoreResult.uncertainty_flags,
      duplicate_suggestions_count: suggestions.length,
    };
  },

  // 6. Review Duplicate (Transactional Merge or Reject)
  async reviewDuplicate(input: ReviewDuplicateInput): Promise<{
    success: boolean;
    canonical_incident_id?: string;
    source_incident_id?: string;
  }> {
    const user = this.getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'coordinator') {
      throw new Error('Forbidden: Only coordinators and administrators can review duplicates.');
    }

    const candidate = localDB.duplicateCandidates.find(
      (c) => c.id === input.candidate_id
    );
    if (!candidate) {
      throw new Error('Duplicate candidate not found.');
    }

    if (candidate.decision !== 'pending') {
      throw new Error(`Candidate already decided: ${candidate.decision}`);
    }

    const nowIso = new Date().toISOString();

    if (input.decision === 'rejected') {
      candidate.decision = 'rejected';
      candidate.decided_by = user.id;
      candidate.decided_at = nowIso;

      localDB.auditLogs.unshift({
        id: crypto.randomUUID(),
        actor_id: user.id,
        actor_name: user.display_name,
        action: 'duplicate_rejected',
        entity_type: 'duplicate_candidate',
        entity_id: candidate.id,
        details: {
          candidate_id: candidate.id,
          report_a_id: candidate.report_a_id,
          report_b_id: candidate.report_b_id,
        },
        created_at: nowIso,
      });

      saveDB(localDB);
      return { success: true };
    }

    // Confirmed Duplicate: Transactional Merge
    const repA = localDB.reports.find((r) => r.id === candidate.report_a_id);
    const repB = localDB.reports.find((r) => r.id === candidate.report_b_id);

    if (!repA || !repB) {
      throw new Error('Associated reports not found for merge.');
    }

    if (repA.incident_id === repB.incident_id) {
      throw new Error('Reports already belong to the same incident.');
    }

    const incA = localDB.incidents.find((i) => i.id === repA.incident_id);
    const incB = localDB.incidents.find((i) => i.id === repB.incident_id);

    if (!incA || !incB) {
      throw new Error('Associated incidents not found for merge.');
    }

    // Canonical incident is the older one
    const canonical =
      new Date(incA.first_reported_at) <= new Date(incB.first_reported_at)
        ? incA
        : incB;
    const source = canonical.id === incA.id ? incB : incA;

    // 1. Move all reports from source incident to canonical incident
    localDB.reports.forEach((r) => {
      if (r.incident_id === source.id) {
        r.incident_id = canonical.id;
      }
    });

    // 2. Mark source incident as merged
    source.status = 'merged';
    source.merged_into_id = canonical.id;
    source.updated_at = nowIso;

    // 3. Mark candidate as confirmed
    candidate.decision = 'confirmed';
    candidate.decided_by = user.id;
    candidate.decided_at = nowIso;

    // 4. Recalculate target canonical incident
    const canonicalReports = localDB.reports.filter(
      (r) => r.incident_id === canonical.id
    );

    const scoreResult = calculateIncidentScore({
      reports: canonicalReports,
      verificationLevel: canonical.verification_level,
      scoreOverride: canonical.score_override,
    });

    canonical.report_count = canonicalReports.length;
    canonical.distinct_channel_count = new Set(
      canonicalReports.map((r) => r.channel)
    ).size;
    canonical.computed_score = scoreResult.computed_score;
    canonical.effective_score = scoreResult.effective_score;
    canonical.priority_tier = scoreResult.priority_tier;
    canonical.score_breakdown = scoreResult;
    canonical.uncertainty_flags = scoreResult.uncertainty_flags;
    canonical.updated_at = nowIso;

    // 5. Audit Log
    localDB.auditLogs.unshift({
      id: crypto.randomUUID(),
      actor_id: user.id,
      actor_name: user.display_name,
      action: 'duplicate_confirmed',
      entity_type: 'incident',
      entity_id: canonical.id,
      details: {
        candidate_id: candidate.id,
        merged_source_incident_id: source.id,
        canonical_incident_id: canonical.id,
        consolidated_reports_count: canonicalReports.length,
        new_effective_score: canonical.effective_score,
      },
      created_at: nowIso,
    });

    saveDB(localDB);

    return {
      success: true,
      canonical_incident_id: canonical.id,
      source_incident_id: source.id,
    };
  },

  // 7. Priority Override
  async overridePriority(input: OverridePriorityInput): Promise<{
    computed_score: number;
    effective_score: number;
    priority_tier: PriorityTier;
  }> {
    const user = this.getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'coordinator') {
      throw new Error('Forbidden: Only coordinators and administrators can override priority.');
    }

    const incident = localDB.incidents.find((i) => i.id === input.incident_id);
    if (!incident) {
      throw new Error('Incident not found.');
    }

    const nowIso = new Date().toISOString();
    const floorScore = incident.score_breakdown.floor_score;
    const effectiveScore =
      input.override_score !== null ? input.override_score : floorScore;
    const tier = getPriorityTier(effectiveScore);

    const previousEffective = incident.effective_score;
    incident.score_override = input.override_score;
    incident.effective_score = effectiveScore;
    incident.priority_tier = tier;
    incident.score_breakdown.score_override = input.override_score;
    incident.score_breakdown.effective_score = effectiveScore;
    incident.score_breakdown.priority_tier = tier;
    incident.updated_at = nowIso;

    localDB.auditLogs.unshift({
      id: crypto.randomUUID(),
      actor_id: user.id,
      actor_name: user.display_name,
      action:
        input.override_score !== null
          ? 'priority_overridden'
          : 'priority_override_cleared',
      entity_type: 'incident',
      entity_id: incident.id,
      details: {
        original_computed_score: incident.computed_score,
        previous_effective_score: previousEffective,
        new_override: input.override_score,
        new_effective_score: effectiveScore,
        reason: input.reason,
      },
      created_at: nowIso,
    });

    saveDB(localDB);

    return {
      computed_score: incident.computed_score,
      effective_score: effectiveScore,
      priority_tier: tier,
    };
  },

  // 8. Update Incident Status & Verification
  async updateIncidentStatus(input: UpdateIncidentStatusInput): Promise<Incident> {
    const user = this.getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'coordinator') {
      throw new Error('Forbidden: Only coordinators and administrators can modify incident status.');
    }

    const incident = localDB.incidents.find((i) => i.id === input.incident_id);
    if (!incident) {
      throw new Error('Incident not found.');
    }

    if (incident.status === 'merged') {
      throw new Error(
        'Merged incidents cannot have their status updated directly.'
      );
    }

    const isTerminal =
      incident.status === 'resolved' || incident.status === 'dismissed';
    if (isTerminal && input.status !== incident.status && user.role !== 'admin') {
      throw new Error('Only administrators can reopen terminal incidents.');
    }

    const nowIso = new Date().toISOString();
    const prevStatus = incident.status;
    const prevVerification = incident.verification_level;
    const newVerification = input.verification_level || incident.verification_level;

    incident.status = input.status;
    incident.verification_level = newVerification;

    // Recalculate score with new verification level
    const reports = localDB.reports.filter((r) => r.incident_id === incident.id);
    const scoreResult = calculateIncidentScore({
      reports,
      verificationLevel: newVerification,
      scoreOverride: incident.score_override,
    });

    incident.computed_score = scoreResult.computed_score;
    incident.effective_score = scoreResult.effective_score;
    incident.priority_tier = scoreResult.priority_tier;
    incident.score_breakdown = scoreResult;
    incident.uncertainty_flags = scoreResult.uncertainty_flags;
    incident.updated_at = nowIso;

    localDB.auditLogs.unshift({
      id: crypto.randomUUID(),
      actor_id: user.id,
      actor_name: user.display_name,
      action: 'incident_status_updated',
      entity_type: 'incident',
      entity_id: incident.id,
      details: {
        previous_status: prevStatus,
        new_status: input.status,
        previous_verification: prevVerification,
        new_verification: newVerification,
        reason: input.verification_reason || null,
      },
      created_at: nowIso,
    });

    saveDB(localDB);
    return incident;
  },

  // 9. Batch Rescore Incidents (Admin only)
  async rescoreAllIncidents(): Promise<{ rescored_count: number }> {
    const user = this.getCurrentUser();
    if (user.role !== 'admin') {
      throw new Error('Forbidden: Only administrators can rescore incidents.');
    }

    const now = new Date();
    let count = 0;

    localDB.incidents.forEach((inc) => {
      if (inc.status === 'merged') return;
      const reports = localDB.reports.filter((r) => r.incident_id === inc.id);
      const scoreResult = calculateIncidentScore({
        reports,
        verificationLevel: inc.verification_level,
        scoreOverride: inc.score_override,
        asOf: now,
      });

      inc.computed_score = scoreResult.computed_score;
      inc.effective_score = scoreResult.effective_score;
      inc.priority_tier = scoreResult.priority_tier;
      inc.score_breakdown = scoreResult;
      inc.uncertainty_flags = scoreResult.uncertainty_flags;
      inc.ruleset_version = scoreResult.ruleset_version;
      inc.updated_at = now.toISOString();
      count++;
    });

    localDB.auditLogs.unshift({
      id: crypto.randomUUID(),
      actor_id: user.id,
      actor_name: user.display_name,
      action: 'incidents_rescored',
      entity_type: 'system',
      entity_id: 'batch_rescore',
      details: {
        rescored_count: count,
        executed_at: now.toISOString(),
      },
      created_at: now.toISOString(),
    });

    saveDB(localDB);
    return { rescored_count: count };
  },

  // 10. Audit Log Inspection (Admin only)
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const user = this.getCurrentUser();
    if (user.role !== 'admin') {
      throw new Error('Forbidden: Only administrators can view audit logs.');
    }
    return localDB.auditLogs;
  },

  // Summary counts for Dashboard (Open, Critical/High, Unresolved Uncertainty, Duplicate Review)
  async getDashboardSummary(): Promise<{
    openIncidents: number;
    criticalHigh: number;
    unresolvedUncertainty: number;
    pendingDuplicates: number;
  }> {
    const active = localDB.incidents.filter((i) => i.status !== 'merged');
    const open = active.filter(
      (i) => i.status === 'new' || i.status === 'under_review' || i.status === 'confirmed'
    ).length;

    const criticalHigh = active.filter(
      (i) =>
        (i.status === 'new' || i.status === 'under_review' || i.status === 'confirmed') &&
        (i.priority_tier === 'critical' || i.priority_tier === 'high')
    ).length;

    const unresolvedUncertainty = active.filter(
      (i) =>
        (i.status === 'new' || i.status === 'under_review' || i.status === 'confirmed') &&
        i.uncertainty_flags &&
        i.uncertainty_flags.length > 0
    ).length;

    const pendingDuplicates = localDB.duplicateCandidates.filter(
      (c) => c.decision === 'pending'
    ).length;

    return {
      openIncidents: open,
      criticalHigh,
      unresolvedUncertainty,
      pendingDuplicates,
    };
  },

  // 11. Multilingual Voice Report Analysis (Gemini via Supabase Edge Function)
  async analyzeVoiceReport(audioBlob: Blob): Promise<VoiceExtractionResult> {
    const user = this.getCurrentUser();
    if (user.role === 'viewer') {
      throw new Error('Forbidden: Viewers cannot create or analyze reports.');
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Cannot analyze empty audio recording.');
    }

    const MAX_BYTES = 8 * 1024 * 1024; // 8 MB limit
    if (audioBlob.size > MAX_BYTES) {
      throw new Error('Audio file exceeds the 8 MB maximum upload limit.');
    }

    // Convert Blob to base64 in browser
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/*;base64, prefix
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read audio blob'));
      reader.readAsDataURL(audioBlob);
    });

    const mimeType = audioBlob.type || 'audio/webm';

    // If Supabase is configured, invoke the secure server-side Edge Function
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.functions.invoke('analyze-voice-report', {
        body: { audioBase64, mimeType },
      });

      if (error) {
        throw new Error(error.message || 'Edge Function error during voice analysis.');
      }

      if (data?.error) {
        throw new Error(data.error.message || 'Gemini voice analysis failed.');
      }

      if (!data?.data) {
        throw new Error('No structured extraction data returned from Gemini voice analysis.');
      }

      return data.data as VoiceExtractionResult;
    }

    // When backend / Edge Function is not configured
    throw new Error(
      'Supabase Edge Function is not configured with GEMINI_API_KEY. Please deploy Edge Functions with GEMINI_API_KEY or switch to "Type Manually".'
    );
  },
};

