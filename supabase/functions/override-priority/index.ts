import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getAuthenticatedUser, jsonResponse } from '../_shared/auth.ts';
import { overridePrioritySchema } from '../../src/shared/schemas.ts';
import { getPriorityTier } from '../../src/shared/scoring.ts';

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
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Only coordinators and admins can override priorities.' } }, 403);
    }

    const body = await req.json();
    const parseResult = overridePrioritySchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: { code: 'VALIDATION_FAILED', message: 'Invalid override data', fields: parseResult.error.flatten().fieldErrors } }, 400);
    }

    const { incident_id, override_score, reason } = parseResult.data;

    // Fetch existing incident
    const { data: incident, error: fetchErr } = await client
      .from('incidents')
      .select('*')
      .eq('id', incident_id)
      .single();

    if (fetchErr || !incident) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Incident not found' } }, 404);
    }

    const floorScore = (incident.score_breakdown as any)?.floor_score ?? incident.computed_score;
    const effectiveScore = override_score !== null ? override_score : floorScore;
    const priorityTier = getPriorityTier(effectiveScore);

    // Save override history
    if (override_score !== null) {
      await client.from('priority_overrides').insert({
        incident_id,
        original_computed_score: incident.computed_score,
        override_score,
        reason,
        created_by: user.id,
      });
    }

    // Update incident
    const { data: updated, error: updateErr } = await client
      .from('incidents')
      .update({
        score_override: override_score,
        effective_score: effectiveScore,
        priority_tier: priorityTier,
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
      action: override_score !== null ? 'priority_overridden' : 'priority_override_cleared',
      entity_type: 'incident',
      entity_id: incident_id,
      details: {
        original_computed_score: incident.computed_score,
        previous_effective_score: incident.effective_score,
        new_override: override_score,
        new_effective_score: effectiveScore,
        reason,
      },
    });

    return jsonResponse({
      incident_id,
      computed_score: incident.computed_score,
      floor_score: floorScore,
      score_override: override_score,
      effective_score: effectiveScore,
      priority_tier: priorityTier,
    });
  } catch (err: any) {
    return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
  }
});
