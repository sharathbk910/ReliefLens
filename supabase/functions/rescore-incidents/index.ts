import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getAuthenticatedUser, jsonResponse } from '../_shared/auth.ts';
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

    if (role !== 'admin') {
      return jsonResponse({ error: { code: 'FORBIDDEN', message: 'Only administrators can rescore incidents.' } }, 403);
    }

    // Fetch active non-merged incidents with reports
    const { data: incidents, error: fetchErr } = await client
      .from('incidents')
      .select('*, reports(*)')
      .neq('status', 'merged');

    if (fetchErr) {
      return jsonResponse({ error: { code: 'DATABASE_ERROR', message: fetchErr.message } }, 500);
    }

    let rescoredCount = 0;
    const now = new Date();

    for (const inc of incidents || []) {
      const scoreResult = calculateIncidentScore({
        reports: inc.reports || [],
        verificationLevel: inc.verification_level,
        scoreOverride: inc.score_override,
        asOf: now,
      });

      await client
        .from('incidents')
        .update({
          computed_score: scoreResult.computed_score,
          effective_score: scoreResult.effective_score,
          priority_tier: scoreResult.priority_tier,
          score_breakdown: scoreResult,
          ruleset_version: scoreResult.ruleset_version,
          uncertainty_flags: scoreResult.uncertainty_flags,
          updated_at: now.toISOString(),
        })
        .eq('id', inc.id);

      rescoredCount++;
    }

    // Record audit entry
    await client.from('audit_log').insert({
      actor_id: user.id,
      action: 'incidents_rescored',
      entity_type: 'system',
      entity_id: 'batch_rescore',
      details: {
        rescored_count: rescoredCount,
        executed_at: now.toISOString(),
      },
    });

    return jsonResponse({
      success: true,
      rescored_count: rescoredCount,
    });
  } catch (err: any) {
    return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: err.message } }, 500);
  }
});
