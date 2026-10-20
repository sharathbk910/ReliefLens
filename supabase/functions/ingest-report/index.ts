import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getAuthenticatedUser, jsonResponse } from '../_shared/auth.ts';
import { reportIngestionSchema } from '../../src/shared/schemas.ts';
import { calculateIncidentScore } from '../../src/shared/scoring.ts';
import { findDuplicateSuggestions } from '../../src/shared/duplicate.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  try {
    const { user, role, client, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return jsonResponse({ error: { code: 'UNAUTHORIZED', message: authError || 'Not authenticated' } }, 401);
    }

    if (role !== 'coordinator' && role !== 'admin') {
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Only coordinators and admins can create reports.' } }, 403);
    }

    const body = await req.json();
    const parseResult = reportIngestionSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid report data',
          fields: parseResult.error.flatten().fieldErrors,
        },
      }, 400);
    }

    const data = parseResult.data;

    // 1. Create consolidated incident
    const initialTitle = `${data.incident_type.toUpperCase()} reported at ${data.district || data.location_text || 'Unknown Location'}`;
    
    // Calculate initial deterministic score
    const scoreResult = calculateIncidentScore({
      reports: [{
        description: data.description,
        reported_at: data.reported_at,
        immediate_danger: data.immediate_danger,
        people_at_risk_estimate: data.people_at_risk_estimate ?? null,
        vulnerability_flags: data.vulnerability_flags as any,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        location_precision: data.location_precision,
        channel: data.channel,
      }],
      verificationLevel: 'unverified',
    });

    const { data: incident, error: incError } = await client
      .from('incidents')
      .insert({
        title: initialTitle,
        incident_type: data.incident_type,
        status: 'new',
        district: data.district || null,
        location_text: data.location_text || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        location_precision: data.location_precision,
        people_at_risk_estimate: data.people_at_risk_estimate ?? null,
        vulnerability_flags: data.vulnerability_flags,
        first_reported_at: data.reported_at,
        last_reported_at: data.reported_at,
        report_count: 1,
        distinct_channel_count: 1,
        verification_level: 'unverified',
        computed_score: scoreResult.computed_score,
        effective_score: scoreResult.effective_score,
        priority_tier: scoreResult.priority_tier,
        score_breakdown: scoreResult,
        ruleset_version: scoreResult.ruleset_version,
        uncertainty_flags: scoreResult.uncertainty_flags,
        created_by: user.id,
      })
      .select()
      .single();

    if (incError || !incident) {
      return jsonResponse({ error: { code: 'DATABASE_ERROR', message: incError?.message || 'Failed to create incident' } }, 500);
    }

    // 2. Insert report
    const { data: report, error: repError } = await client
      .from('reports')
      .insert({
        incident_id: incident.id,
        channel: data.channel,
        incident_type: data.incident_type,
        external_reference: data.external_reference || null,
        description: data.description,
        reported_at: data.reported_at,
        received_at: new Date().toISOString(),
        location_text: data.location_text || null,
        district: data.district || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        location_precision: data.location_precision,
        people_at_risk_estimate: data.people_at_risk_estimate ?? null,
        immediate_danger: data.immediate_danger,
        vulnerability_flags: data.vulnerability_flags,
        created_by: user.id,
      })
      .select()
      .single();

    if (repError || !report) {
      return jsonResponse({ error: { code: 'DATABASE_ERROR', message: repError?.message || 'Failed to create report' } }, 500);
    }

    // 3. Insert restricted contact if provided
    if (data.contact_name || data.contact_phone) {
      await client.from('report_contacts').insert({
        report_id: report.id,
        contact_name: data.contact_name || null,
        contact_phone: data.contact_phone || null,
      });
    }

    // 4. Duplicate matching against existing recent reports
    const { data: recentReports } = await client
      .from('reports')
      .select('*, incident:incidents(*)')
      .eq('incident_type', data.incident_type)
      .neq('incident_id', incident.id)
      .order('reported_at', { ascending: false })
      .limit(50);

    const suggestions = recentReports
      ? findDuplicateSuggestions(report as any, recentReports as any)
      : [];

    for (const sugg of suggestions) {
      const [idA, idB] = [report.id, sugg.candidateReport.id].sort();
      await client.from('duplicate_candidates').insert({
        report_a_id: idA,
        report_b_id: idB,
        similarity_score: sugg.matchResult.similarityScore,
        match_reasons: sugg.matchResult.reasons,
        decision: 'pending',
      });
    }

    // 5. Create audit log entry
    await client.from('audit_log').insert({
      actor_id: user.id,
      action: 'report_ingested',
      entity_type: 'report',
      entity_id: report.id,
      details: {
        incident_id: incident.id,
        computed_score: scoreResult.computed_score,
        tier: scoreResult.priority_tier,
        duplicates_suggested: suggestions.length,
      },
    });

    return jsonResponse({
      report_id: report.id,
      incident_id: incident.id,
      computed_score: scoreResult.computed_score,
      effective_score: scoreResult.effective_score,
      priority_tier: scoreResult.priority_tier,
      ruleset_version: scoreResult.ruleset_version,
      uncertainty_flags: scoreResult.uncertainty_flags,
      duplicate_suggestions_count: suggestions.length,
    });
  } catch (err: any) {
    return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
  }
});
