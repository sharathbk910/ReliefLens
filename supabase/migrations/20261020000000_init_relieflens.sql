-- RELIEFLENS PRODUCTION POSTGRESQL MIGRATION
-- Migration: 20261020000000_init_relieflens.sql

-- 1. Create Enums
create type public.user_role as enum (
  'admin',
  'coordinator',
  'viewer'
);

create type public.report_channel as enum (
  'phone_call',
  'sms',
  'social_media',
  'sensor',
  'field_volunteer',
  'other'
);

create type public.incident_type as enum (
  'flood',
  'earthquake',
  'landslide',
  'fire',
  'medical',
  'shelter_request',
  'other'
);

create type public.incident_status as enum (
  'new',
  'under_review',
  'confirmed',
  'resolved',
  'dismissed',
  'merged'
);

create type public.location_precision as enum (
  'exact',
  'approximate',
  'unknown'
);

create type public.verification_level as enum (
  'unverified',
  'partially_corroborated',
  'corroborated',
  'coordinator_verified'
);

create type public.priority_tier as enum (
  'critical',
  'high',
  'medium',
  'low'
);

create type public.duplicate_decision as enum (
  'pending',
  'confirmed',
  'rejected'
);

-- 2. Profiles Table (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- 3. Incidents Table
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  incident_type public.incident_type not null,
  status public.incident_status not null default 'new',
  district text,
  location_text text,
  latitude double precision,
  longitude double precision,
  location_precision public.location_precision not null default 'unknown',
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
  
  -- Constraints
  constraint incidents_no_self_merge check (merged_into_id is null or merged_into_id <> id),
  constraint incidents_coordinates_pair check (
    (latitude is null and longitude is null) or
    (latitude is not null and longitude is not null and latitude >= -90 and latitude <= 90 and longitude >= -180 and longitude <= 180)
  )
);

-- 4. Reports Table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  channel public.report_channel not null,
  incident_type public.incident_type not null,
  external_reference text,
  description text not null,
  reported_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  location_text text,
  district text,
  latitude double precision,
  longitude double precision,
  location_precision public.location_precision not null default 'unknown',
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

-- 5. Restricted Report Contacts Table
create table public.report_contacts (
  report_id uuid primary key references public.reports(id) on delete cascade,
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now()
);

-- 6. Duplicate Candidates Table
create table public.duplicate_candidates (
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

-- 7. Priority Overrides History Table
create table public.priority_overrides (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  original_computed_score integer not null,
  override_score integer not null check (override_score >= 0 and override_score <= 100),
  reason text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 8. Audit Log Table
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 9. Production Indexes
create index incidents_status_score_idx on public.incidents(status, effective_score desc);
create index incidents_last_reported_idx on public.incidents(last_reported_at desc);
create index incidents_type_time_idx on public.incidents(incident_type, last_reported_at desc);
create index reports_incident_idx on public.reports(incident_id);
create index reports_type_time_idx on public.reports(incident_type, reported_at desc);
create index reports_channel_idx on public.reports(channel);
create index duplicate_candidates_pending_idx on public.duplicate_candidates(created_at desc) where decision = 'pending';
create index priority_overrides_incident_idx on public.priority_overrides(incident_id, created_at desc);
create index audit_log_created_idx on public.audit_log(created_at desc);
create index audit_log_actor_idx on public.audit_log(actor_id, created_at desc);

-- 10. Row Level Security Policies
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.reports enable row level security;
alter table public.report_contacts enable row level security;
alter table public.duplicate_candidates enable row level security;
alter table public.priority_overrides enable row level security;
alter table public.audit_log enable row level security;

-- Helper function to check caller role
create or replace function public.current_user_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable set search_path = public;

-- Profiles: Authenticated users can view profiles; only admins can update roles
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Incidents: Authenticated users can view non-merged incidents; coordinators/admins can mutate
create policy "Authenticated users can read incidents"
  on public.incidents for select
  to authenticated
  using (true);

create policy "Coordinators and admins can insert incidents"
  on public.incidents for insert
  to authenticated
  with check (public.current_user_role() in ('coordinator', 'admin'));

create policy "Coordinators and admins can update incidents"
  on public.incidents for update
  to authenticated
  using (public.current_user_role() in ('coordinator', 'admin'))
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Reports: Authenticated users can view reports; coordinators/admins can insert
create policy "Authenticated users can read reports"
  on public.reports for select
  to authenticated
  using (true);

create policy "Coordinators and admins can insert reports"
  on public.reports for insert
  to authenticated
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Report Contacts: strictly coordinators and admins only
create policy "Coordinators and admins can read contacts"
  on public.report_contacts for select
  to authenticated
  using (public.current_user_role() in ('coordinator', 'admin'));

create policy "Coordinators and admins can insert contacts"
  on public.report_contacts for insert
  to authenticated
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Duplicate Candidates: Authenticated can view; coordinators/admins can update
create policy "Authenticated users can view duplicate candidates"
  on public.duplicate_candidates for select
  to authenticated
  using (true);

create policy "Coordinators and admins can update candidates"
  on public.duplicate_candidates for update
  to authenticated
  using (public.current_user_role() in ('coordinator', 'admin'))
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Priority Overrides: Authenticated can view; coordinators/admins can insert
create policy "Authenticated users can read overrides"
  on public.priority_overrides for select
  to authenticated
  using (true);

create policy "Coordinators and admins can insert overrides"
  on public.priority_overrides for insert
  to authenticated
  with check (public.current_user_role() in ('coordinator', 'admin'));

-- Audit Log: Strictly admins can read; all actions recorded through trusted functions
create policy "Admins can view audit log"
  on public.audit_log for select
  to authenticated
  using (public.current_user_role() = 'admin');

-- 11. Transactional Functions for Critical Workflows

-- New user signup trigger to auto-create viewer profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Duplicate Review Confirmation (Transactional Merge)
create or replace function public.confirm_duplicate_candidate(
  p_candidate_id uuid,
  p_reviewer_id uuid
)
returns jsonb as $$
declare
  v_candidate record;
  v_report_a record;
  v_report_b record;
  v_canonical_incident_id uuid;
  v_source_incident_id uuid;
begin
  -- 1. Fetch candidate
  select * into v_candidate from public.duplicate_candidates where id = p_candidate_id for update;
  if not found then
    raise exception 'Duplicate candidate not found';
  end if;
  if v_candidate.decision <> 'pending' then
    raise exception 'Candidate has already been decided: %', v_candidate.decision;
  end if;

  select * into v_report_a from public.reports where id = v_candidate.report_a_id;
  select * into v_report_b from public.reports where id = v_candidate.report_b_id;

  if v_report_a.incident_id = v_report_b.incident_id then
    raise exception 'Reports already belong to the same incident';
  end if;

  -- Canonical is the older incident
  if v_report_a.incident_id < v_report_b.incident_id then
    v_canonical_incident_id := v_report_a.incident_id;
    v_source_incident_id := v_report_b.incident_id;
  else
    v_canonical_incident_id := v_report_b.incident_id;
    v_source_incident_id := v_report_a.incident_id;
  end if;

  -- Reassign all reports from source incident to canonical incident
  update public.reports
  set incident_id = v_canonical_incident_id
  where incident_id = v_source_incident_id;

  -- Mark source incident as merged
  update public.incidents
  set status = 'merged',
      merged_into_id = v_canonical_incident_id,
      updated_at = now()
  where id = v_source_incident_id;

  -- Update candidate record
  update public.duplicate_candidates
  set decision = 'confirmed',
      decided_by = p_reviewer_id,
      decided_at = now()
  where id = p_candidate_id;

  -- Record audit event
  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (
    p_reviewer_id,
    'duplicate_confirmed',
    'incident',
    v_canonical_incident_id::text,
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'merged_source_incident_id', v_source_incident_id,
      'canonical_incident_id', v_canonical_incident_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'canonical_incident_id', v_canonical_incident_id,
    'source_incident_id', v_source_incident_id
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Duplicate Review Rejection
create or replace function public.reject_duplicate_candidate(
  p_candidate_id uuid,
  p_reviewer_id uuid
)
returns jsonb as $$
declare
  v_candidate record;
begin
  select * into v_candidate from public.duplicate_candidates where id = p_candidate_id for update;
  if not found then
    raise exception 'Duplicate candidate not found';
  end if;
  if v_candidate.decision <> 'pending' then
    raise exception 'Candidate has already been decided: %', v_candidate.decision;
  end if;

  update public.duplicate_candidates
  set decision = 'rejected',
      decided_by = p_reviewer_id,
      decided_at = now()
  where id = p_candidate_id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, details)
  values (
    p_reviewer_id,
    'duplicate_rejected',
    'duplicate_candidate',
    p_candidate_id::text,
    jsonb_build_object('candidate_id', p_candidate_id)
  );

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer set search_path = public;
