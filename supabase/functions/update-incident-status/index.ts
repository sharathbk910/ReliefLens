import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getAuthenticatedUser, jsonResponse } from '../_shared/auth.ts';
import { updateIncidentStatusSchema } from '../../src/shared/schemas.ts';
import { calculateIncidentScore } from '../../src/shared/scoring.ts';

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
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Only coordinators and admins can update incident status.' } }, 403);
    }

    const body = await req.json();
    const parseResult = updateIncidentStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: { code: 'VALIDATION_FAILED', message: 'Invalid status update', fields: parseResult.error.flatten().fieldErrors } }, 400);
    }

    const { incident_id, status, verification_level, verification_reason } = parseResult.data;

    const { data: incident, error: fetchErr } = await client
      .from('incidents')
      .select('*, reports(*)')
      .eq('id', incident_id)
      .single();

    if (fetchErr || !incident) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Incident not found' } }, 404);
    }

    if (incident.status === 'merged') {
      return jsonResponse({ error: { code: 'INVALID_TRANSITION', message: 'Merged incidents cannot have their status updated directly.' } }, 400);
    }

    // Check if reopening resolved/dismissed terminal status
    const isTerminal = incident.status === 'resolved' || incident.status === 'dismissed';
    const isReopening = isTerminal && status !== incident.status;
    if (isReopening && role !== 'admin') {
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Only administrators can reopen terminal incidents.' } }, 403);
    }

    const newVerification = verification_level || incident.verification_level;

    // Recalculate score with new verification level
    const scoreResult = calculateIncidentScore({
      reports: incident.reports || [],
      verificationLevel: newVerification,
      scoreOverride: incident.score_override,
    });

    const { data: updated, error: updateErr } = await client
      .from('incidents')
      .update({
        status,
        verification_level: newVerification,
        computed_score: scoreResult.computed_score,
        effective_score: scoreResult.effective_score,
        priority_tier: scoreResult.priority_tier,
        score_breakdown: scoreResult,
        uncertainty_flags: scoreResult.uncertainty_flags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incident_id)
      .select()
      .single();

    if (updateErr) {
      return jsonResponse({ error: { code: 'UPDATE_FAILED', message: updateErr.message } }, 500);
    }

    // Audit log
    await client.from('audit_log').insert({
      actor_id: user.id,
      action: 'incident_status_updated',
      entity_type: 'incident',
      entity_id: incident_id,
      details: {
        previous_status: incident.status,
        new_status: status,
        previous_verification: incident.verification_level,
        new_verification: newVerification,
        reason: verification_reason || null,
      },
    });

    return jsonResponse({
      incident_id,
      status: updated.status,
      verification_level: updated.verification_level,
      computed_score: updated.computed_score,
      effective_score: updated.effective_score,
      priority_tier: updated.priority_tier,
    });
  } catch (err: any) {
    return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
  }
});
