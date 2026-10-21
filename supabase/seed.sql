-- RELIEFLENS SEED SCRIPT (PROTOTYPE DATASET)
-- Includes simulated reports, duplicate candidates, and audit logs.

-- 1. Insert Demo Profiles
insert into public.profiles (id, display_name, role)
values
  ('11111111-1111-4111-a111-111111111111', 'Chief Sarah Reynolds', 'admin'),
  ('22222222-2222-4222-a222-222222222222', 'Coordinator Marco Chen', 'coordinator'),
  ('33333333-3333-4333-a333-333333333333', 'Field Analyst Elena Rostova', 'viewer')
on conflict (id) do nothing;

-- 2. Insert Core Incidents
insert into public.incidents (
  id, title, incident_type, status, district, location_text,
  latitude, longitude, location_precision, people_at_risk_estimate,
  vulnerability_flags, first_reported_at, last_reported_at, report_count,
  distinct_channel_count, verification_level, computed_score, effective_score,
  priority_tier, ruleset_version, uncertainty_flags, created_by
)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    'Flash Flood & Inundation – River Valley Sector (Main Bypass Road)',
    'flood',
    'new',
    'River Valley Sector',
    'Main Bypass Road & 3rd Cross Junction',
    12.9716,
    77.5946,
    'exact',
    16,
    array['children_present', 'elderly_present'],
    now() - interval '45 minutes',
    now() - interval '45 minutes',
    1,
    1,
    'unverified',
    80,
    80,
    'critical',
    '1.0.0',
    array['unverified_high_danger', 'single_source'],
    '22222222-2222-4222-a222-222222222222'
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'Flash Flood & Inundation – River Valley Sector (Main Bypass Riverfront)',
    'flood',
    'new',
    'River Valley Sector',
    'Main Bypass Riverfront near Causeway',
    12.9719,
    77.5950,
    'exact',
    15,
    array['children_present'],
    now() - interval '30 minutes',
    now() - interval '30 minutes',
    1,
    1,
    'unverified',
    75,
    75,
    'critical',
    '1.0.0',
    array['unverified_high_danger', 'single_source'],
    '22222222-2222-4222-a222-222222222222'
  ),
  (
    'b0000000-0000-4000-8000-000000000005',
    'Fire Outbreak – Industrial Corridor (Logistics Yard)',
    'fire',
    'under_review',
    'Industrial Corridor',
    '450 Industrial Main Road Logistics Yard',
    12.9577,
    77.6190,
    'exact',
    25,
    array['medical_dependency'],
    now() - interval '35 minutes',
    now() - interval '35 minutes',
    1,
    1,
    'unverified',
    80,
    80,
    'critical',
    '1.0.0',
    array['unverified_high_danger', 'single_source'],
    '22222222-2222-4222-a222-222222222222'
  )
on conflict (id) do nothing;

-- 3. Initial Audit Log
insert into public.audit_log (id, actor_id, action, entity_type, entity_id, details)
values (
  'd0000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-a111-111111111111',
  'system_initialized',
  'system',
  'seed_dataset',
  '{"dataset": "simulated_emergency_scenario_v1"}'::jsonb
)
on conflict (id) do nothing;
