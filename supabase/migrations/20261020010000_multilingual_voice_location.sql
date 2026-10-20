-- RELIEFLENS MIGRATION: Multilingual AI Voice Reporting & Geolocation Metadata
-- Migration: 20261020010000_multilingual_voice_location.sql

-- 1. Add Multilingual Voice & Location Metadata Columns to reports table
alter table public.reports
  add column if not exists original_transcript text,
  add column if not exists detected_language text,
  add column if not exists normalized_description text,
  add column if not exists location_source text check (location_source is null or location_source in ('gps', 'voice', 'manual')),
  add column if not exists location_accuracy double precision,
  add column if not exists location_captured_at timestamptz,
  add column if not exists user_confirmed_incident_location boolean default true;

-- 2. Add Location Metadata Columns to incidents table
alter table public.incidents
  add column if not exists detected_language text,
  add column if not exists location_accuracy double precision,
  add column if not exists location_source text check (location_source is null or location_source in ('gps', 'voice', 'manual'));

-- 3. Ensure Reporter role exists in user_role enum safely if not present
do $$
begin
  if not exists (select 1 from pg_enum join pg_type on pg_type.oid = pg_enum.enumtypid where typname = 'user_role' and enumlabel = 'reporter') then
    alter type public.user_role add value 'reporter';
  end if;
end $$;

-- 4. Update Policies to permit Reporters to insert unverified reports and read their own reports
create policy "Reporters can insert reports"
  on public.reports for insert
  to authenticated
  with check (public.current_user_role() in ('reporter', 'coordinator', 'admin'));

create policy "Reporters can insert incidents"
  on public.incidents for insert
  to authenticated
  with check (public.current_user_role() in ('reporter', 'coordinator', 'admin'));
