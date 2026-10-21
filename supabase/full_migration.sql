-- ============================================================================
-- RELIEFLENS COMPLETE PRODUCTION SUPABASE MIGRATION & SEED SCRIPT
-- Project: ReliefLens — Emergency Incident Coordination Platform
-- Target: Supabase PostgreSQL Database (https://supabase.com/dashboard)
-- ============================================================================

-- 0. Required Extensions
create extension if not exists "pgcrypto";

-- 1. Create Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'coordinator', 'viewer', 'reporter');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_channel') then
    create type public.report_channel as enum (
      'phone_call',
      'sms',
      'social_media',
      'sensor',
      'field_volunteer',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'incident_type') then
    create type public.incident_type as enum (
      'flood',
      'earthquake',
      'landslide',
      'fire',
      'medical',
      'medical_emergency',
      'structure_collapse',
      'water_shortage',
      'food_shortage',
      'power_outage',
      'road_blocked',
      'hazardous_material',
      'shelter_request',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type public.incident_status as enum (
      'new',
      'under_review',
      'confirmed',
      'resolved',
      'dismissed',
      'merged'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'location_precision') then
    create type public.location_precision as enum ('exact', 'approximate', 'unknown');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_level') then
    create type public.verification_level as enum (
      'unverified',
      'partially_corroborated',
      'corroborated',
      'coordinator_verified'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'priority_tier') then
    create type public.priority_tier as enum ('critical', 'high', 'medium', 'low');
  end if;

  if not exists (select 1 from pg_type where typname = 'duplicate_decision') then
    create type public.duplicate_decision as enum ('pending', 'confirmed', 'rejected');
  end if;
end $$;

-- 2. Demo Auth Users (Permits Foreign Key constraints & Demo Personas)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '11111111-1111-4111-a111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@relieflens.org',
    crypt('admin123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Chief Sarah Reynolds"}',
    now(),
    now()
  ),
  (
    '22222222-2222-4222-a222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'coordinator@relieflens.org',
    crypt('coord123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Coordinator Marco Chen"}',
    now(),
    now()
  ),
  (
    '33333333-3333-4333-a333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'analyst@relieflens.org',
    crypt('analyst123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Field Analyst Elena Rostova"}',
    now(),
    now()
  )
on conflict (id) do nothing;

-- 3. Profiles Table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- 4. Incidents Table
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  incident_type public.incident_type not null,
  status public.incident_status not null default 'new',
  district text,
  location_text text,
  latitude double precision,
  longitude double precision,
  location_precision public.location_precision not null default 'unknown',
  location_accuracy double precision,
  location_source text check (location_source is null or location_source in ('gps', 'voice', 'manual')),
  detected_language text,
  people_at_risk_estimate integer check (people_at_risk_estimate is null or people_at_risk_estimate >= 0),
  vulnerability_flags text[] not null default '{}',
  first_reported_at timestamptz not null default now(),
  last_reported_at timestamptz not null default now(),
  report_count integer not null default 1 check (report_count >= 0),
  distinct_channel_count integer not null default 1 check (distinct_channel_count >= 0),
  verification_level public.verification_level not null default 'unverified',
  computed_score integer not null default 0 check (computed_score >= 0 and computed_score <= 100),
  score_override integer check (score_override is null or (score_override >= 0 and score_override <= 100)),
  effective_score integer not null default 0 check (effective_score >= 0 and effective_score <= 100),
  priority_tier public.priority_tier not null default 'low',
  score_breakdown jsonb not null default '{}'::jsonb,
  ruleset_version text not null default '1.0.0',
  uncertainty_flags text[] not null default '{}',
  merged_into_id uuid references public.incidents(id),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint incidents_no_self_merge check (merged_into_id is null or merged_into_id <> id),
  constraint incidents_coordinates_pair check (
    (latitude is null and longitude is null) or
    (latitude is not null and longitude is not null and latitude >= -90 and latitude <= 90 and longitude >= -180 and longitude <= 180)
  )
);

-- 5. Reports Table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  channel public.report_channel not null,
  incident_type public.incident_type not null,
  external_reference text,
  description text not null,
  original_transcript text,
  detected_language text,
  normalized_description text,
  reported_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  location_text text,
  district text,
  latitude double precision,
  longitude double precision,
  location_precision public.location_precision not null default 'unknown',
  location_source text check (location_source is null or location_source in ('gps', 'voice', 'manual')),
  location_accuracy double precision,
  location_captured_at timestamptz,
  user_confirmed_incident_location boolean default true,
  people_at_risk_estimate integer check (people_at_risk_estimate is null or people_at_risk_estimate >= 0),
  immediate_danger boolean not null default false,
  vulnerability_flags text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint reports_coordinates_pair check (
    (latitude is null and longitude is null) or
    (latitude is not null and longitude is not null and latitude >= -90 and latitude <= 90 and longitude >= -180 and longitude <= 180)
  )
);

-- 6. Restricted Report Contacts Table
create table if not exists public.report_contacts (
  report_id uuid primary key references public.reports(id) on delete cascade,
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now()
);

-- 7. Duplicate Candidates Table
create table if not exists public.duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  report_a_id uuid not null references public.reports(id) on delete cascade,
  report_b_id uuid not null references public.reports(id) on delete cascade,
  similarity_score double precision not null check (similarity_score >= 0 and similarity_score <= 1),
  match_reasons text[] not null default '{}',
  decision public.duplicate_decision not null default 'pending',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),

  constraint duplicate_candidates_distinct check (report_a_id < report_b_id),
  constraint duplicate_candidates_unique_pair unique (report_a_id, report_b_id)
);

-- 8. Priority Overrides History Table
create table if not exists public.priority_overrides (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  original_computed_score integer not null,
  override_score integer not null check (override_score >= 0 and override_score <= 100),
  reason text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 9. Audit Log Table
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 10. Performance Indexes
create index if not exists incidents_status_score_idx on public.incidents(status, effective_score desc);
create index if not exists incidents_last_reported_idx on public.incidents(last_reported_at desc);
create index if not exists incidents_type_time_idx on public.incidents(incident_type, last_reported_at desc);
create index if not exists reports_incident_idx on public.reports(incident_id);
create index if not exists reports_type_time_idx on public.reports(incident_type, reported_at desc);
create index if not exists reports_channel_idx on public.reports(channel);
create index if not exists duplicate_candidates_pending_idx on public.duplicate_candidates(created_at desc) where decision = 'pending';
create index if not exists priority_overrides_incident_idx on public.priority_overrides(incident_id, created_at desc);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log(actor_id, created_at desc);

-- 11. Helper Functions
create or replace function public.current_user_role()
returns public.user_role as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'reporter'::public.user_role);
$$ language sql security definer stable set search_path = public;

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'reporter'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. Row Level Security Policies
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.reports enable row level security;
alter table public.report_contacts enable row level security;
alter table public.duplicate_candidates enable row level security;
alter table public.priority_overrides enable row level security;
alter table public.audit_log enable row level security;

-- Profiles Policies
drop policy if exists "Anyone authenticated can view profiles" on public.profiles;
create policy "Anyone authenticated can view profiles"
  on public.profiles for select
  to authenticated, anon
  using (true);

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Incidents Policies
drop policy if exists "Anyone can read incidents" on public.incidents;
create policy "Anyone can read incidents"
  on public.incidents for select
  to authenticated, anon
  using (true);

drop policy if exists "Users can insert incidents" on public.incidents;
create policy "Users can insert incidents"
  on public.incidents for insert
  to authenticated, anon
  with check (true);

drop policy if exists "Coordinators and admins can update incidents" on public.incidents;
create policy "Coordinators and admins can update incidents"
  on public.incidents for update
  to authenticated
  using (public.current_user_role() in ('coordinator', 'admin'))
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Reports Policies
drop policy if exists "Anyone can read reports" on public.reports;
create policy "Anyone can read reports"
  on public.reports for select
  to authenticated, anon
  using (true);

drop policy if exists "Anyone can insert reports" on public.reports;
create policy "Anyone can insert reports"
  on public.reports for insert
  to authenticated, anon
  with check (true);

-- Report Contacts Policies (Coordinators and Admins only)
drop policy if exists "Coordinators and admins can read contacts" on public.report_contacts;
create policy "Coordinators and admins can read contacts"
  on public.report_contacts for select
  to authenticated
  using (public.current_user_role() in ('coordinator', 'admin'));

drop policy if exists "Anyone can submit contacts" on public.report_contacts;
create policy "Anyone can submit contacts"
  on public.report_contacts for insert
  to authenticated, anon
  with check (true);

-- Duplicate Candidates Policies
drop policy if exists "Anyone can view duplicate candidates" on public.duplicate_candidates;
create policy "Anyone can view duplicate candidates"
  on public.duplicate_candidates for select
  to authenticated, anon
  using (true);

drop policy if exists "Coordinators and admins can update candidates" on public.duplicate_candidates;
create policy "Coordinators and admins can update candidates"
  on public.duplicate_candidates for update
  to authenticated
  using (public.current_user_role() in ('coordinator', 'admin'))
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Priority Overrides Policies
drop policy if exists "Anyone can read overrides" on public.priority_overrides;
create policy "Anyone can read overrides"
  on public.priority_overrides for select
  to authenticated, anon
  using (true);

drop policy if exists "Coordinators and admins can insert overrides" on public.priority_overrides;
create policy "Coordinators and admins can insert overrides"
  on public.priority_overrides for insert
  to authenticated
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Audit Log Policies
drop policy if exists "Admins can view audit log" on public.audit_log;
create policy "Admins can view audit log"
  on public.audit_log for select
  to authenticated
  using (public.current_user_role() = 'admin');

drop policy if exists "System can record audit logs" on public.audit_log;
create policy "System can record audit logs"
  on public.audit_log for insert
  to authenticated, anon
  with check (true);

-- 13. Enable Realtime Publications
do $$
begin
  alter publication supabase_realtime add table public.incidents;
  alter publication supabase_realtime add table public.reports;
  alter publication supabase_realtime add table public.duplicate_candidates;
exception when others then
  null; -- Ignore if publication or table already added
end $$;

-- 14. Seed Realistic Incident Reports & Demo Profiles
insert into public.profiles (id, display_name, role)
values
  ('11111111-1111-4111-a111-111111111111', 'Chief Sarah Reynolds', 'admin'),
  ('22222222-2222-4222-a222-222222222222', 'Coordinator Marco Chen', 'coordinator'),
  ('33333333-3333-4333-a333-333333333333', 'Field Analyst Elena Rostova', 'viewer')
on conflict (id) do update set
  display_name = excluded.display_name,
  role = excluded.role;

-- Seed Core Incidents (Realistic disaster logs with regional coords)
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
    'b0000000-0000-4000-8000-000000000003',
    'Landslide & Slope Failure – Northern Ridge (Ghat Road KM 34)',
    'landslide',
    'new',
    'Northern Ridge',
    'Ghat Road KM 34, Viewpoint Curve',
    12.9836,
    77.6026,
    'exact',
    42,
    array['isolated_remote'],
    now() - interval '80 minutes',
    now() - interval '80 minutes',
    1,
    1,
    'unverified',
    84,
    84,
    'critical',
    '1.0.0',
    array['unverified_high_danger', 'single_source'],
    '22222222-2222-4222-a222-222222222222'
  ),
  (
    'b0000000-0000-4000-8000-000000000004',
    'Critical Power Outage – Central Medical District (Hospital Wing)',
    'power_outage',
    'under_review',
    'Central Medical District',
    'District General Hospital, South Emergency Wing',
    12.9666,
    77.5986,
    'exact',
    14,
    array['medical_dependency', 'elderly_present'],
    now() - interval '25 minutes',
    now() - interval '25 minutes',
    1,
    1,
    'partially_corroborated',
    88,
    88,
    'critical',
    '1.0.0',
    array[]::text[],
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

-- Seed Reports
insert into public.reports (
  id, incident_id, channel, incident_type, external_reference, description,
  original_transcript, location_text, district, latitude, longitude,
  location_precision, people_at_risk_estimate, immediate_danger, vulnerability_flags,
  created_by
)
values
  (
    'c0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'phone_call',
    'flood',
    'CALL-9101',
    'Rapid water level rise from stormwater canal breach. Water is at chest height inside homes along 3rd Cross. 8 people stranded on balcony including elderly citizens and an infant. Power lines down.',
    'Water has entered our homes up to chest height! We have two senior citizens who cannot move and a baby on the balcony. Please send a rescue boat immediately!',
    'Main Bypass Road & 3rd Cross Junction',
    'River Valley Sector',
    12.9716,
    77.5946,
    'exact',
    16,
    true,
    array['children_present', 'elderly_present'],
    '22222222-2222-4222-a222-222222222222'
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000002',
    'sms',
    'flood',
    'SMS-9102',
    'Water rising fast at 3rd Cross and Main Bypass near riverfront. People trapped on the roof waving cloths, water level rising rapidly.',
    'Water rising fast at 3rd Cross and Main Bypass. Trapped on roof waving flags.',
    'Main Bypass Riverfront near Causeway',
    'River Valley Sector',
    12.9719,
    77.5950,
    'exact',
    15,
    true,
    array['children_present'],
    '22222222-2222-4222-a222-222222222222'
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000003',
    'field_volunteer',
    'landslide',
    'VOL-8821',
    'Torrential rains triggered heavy mudslide on Ghat Road KM 34. Passenger bus and private vehicle stranded between two debris falls. Slope above remains active.',
    'This is Driver Anand reporting from Ghat Road KM 34. Massive landslide blocking both lanes, 42 passengers trapped.',
    'Ghat Road KM 34, Viewpoint Curve',
    'Northern Ridge',
    12.9836,
    77.6026,
    'exact',
    42,
    true,
    array['isolated_remote'],
    '22222222-2222-4222-a222-222222222222'
  )
on conflict (id) do nothing;

-- Seed Contacts
insert into public.report_contacts (report_id, contact_name, contact_phone)
values
  ('c0000000-0000-4000-8000-000000000001', 'Ramesh Sharma', '+91-98450-12845'),
  ('c0000000-0000-4000-8000-000000000002', 'Clara Hayes', '+91-98450-0102'),
  ('c0000000-0000-4000-8000-000000000003', 'Inspector Anand Varma', '+91-98450-44912')
on conflict (report_id) do nothing;

-- Seed Duplicate Candidates (Pair 1 & 2 for review)
insert into public.duplicate_candidates (
  id, report_a_id, report_b_id, similarity_score, match_reasons, decision
)
values
  (
    'e0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    0.86,
    array[
      'Same incident classification (flood)',
      'Locations within 45 meters (exact spatial match)',
      'Reported 15 minutes apart'
    ],
    'pending'
  )
on conflict (id) do nothing;

-- Seed Initial Audit Log
insert into public.audit_log (id, actor_id, action, entity_type, entity_id, details)
values (
  'd0000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-a111-111111111111',
  'system_initialized',
  'system',
  'seed_dataset',
  '{"dataset": "relieflens_production_v2", "location": "regional_center"}'::jsonb
)
on conflict (id) do nothing;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
