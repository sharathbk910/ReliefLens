import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getAuthenticatedUser, jsonResponse } from '../_shared/auth.ts';
import { reviewDuplicateSchema } from '../../src/shared/schemas.ts';

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
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Only coordinators and admins can review duplicates.' } }, 403);
    }

    const body = await req.json();
    const parseResult = reviewDuplicateSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: { code: 'VALIDATION_FAILED', message: 'Invalid review payload' } }, 400);
    }

    const { candidate_id, decision } = parseResult.data;

    if (decision === 'confirmed') {
      const { data, error } = await client.rpc('confirm_duplicate_candidate', {
        p_candidate_id: candidate_id,
        p_reviewer_id: user.id,
      });

      if (error) {
        return jsonResponse({ error: { code: 'MERGE_FAILED', message: error.message } }, 409);
      }

      return jsonResponse({
        candidate_id,
        decision: 'confirmed',
        canonical_incident_id: data.canonical_incident_id,
        source_incident_id: data.source_incident_id,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      });
    } else {
      const { error } = await client.rpc('reject_duplicate_candidate', {
        p_candidate_id: candidate_id,
        p_reviewer_id: user.id,
      });

      if (error) {
        return jsonResponse({ error: { code: 'REJECT_FAILED', message: error.message } }, 409);
      }

      return jsonResponse({
        candidate_id,
        decision: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
  }
});
