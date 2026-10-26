-- Grace Fire Ministry: dynamic sermons and events
-- Run in Supabase SQL Editor after reviewing. This does not alter prayer/contact tables.
create extension if not exists pgcrypto;

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  scripture text not null default '',
  theme text not null default '',
  opening text not null default '',
  points jsonb not null default '[]'::jsonb check (jsonb_typeof(points) = 'array'),
  reflection text not null default '',
  prayer text not null default '',
  published boolean not null default false,
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.church_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  location text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sermons_set_updated_at on public.sermons;
create trigger sermons_set_updated_at before update on public.sermons
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.church_events;
create trigger events_set_updated_at before update on public.church_events
for each row execute function public.set_updated_at();

alter table public.sermons enable row level security;
alter table public.church_events enable row level security;

-- Admin authorization relies only on trusted app_metadata, never user-editable user_metadata.
drop policy if exists "Public can read published sermons" on public.sermons;
create policy "Public can read published sermons" on public.sermons
for select to anon, authenticated
using (published = true and (publish_at is null or publish_at <= now()));

drop policy if exists "Admins can read all sermons" on public.sermons;
create policy "Admins can read all sermons" on public.sermons
for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can insert sermons" on public.sermons;
create policy "Admins can insert sermons" on public.sermons
for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update sermons" on public.sermons;
create policy "Admins can update sermons" on public.sermons
for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete sermons" on public.sermons;
create policy "Admins can delete sermons" on public.sermons
for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can read published events" on public.church_events;
create policy "Public can read published events" on public.church_events
for select to anon, authenticated
using (published = true);

drop policy if exists "Admins can read all events" on public.church_events;
create policy "Admins can read all events" on public.church_events
for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can insert events" on public.church_events;
create policy "Admins can insert events" on public.church_events
for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update events" on public.church_events;
create policy "Admins can update events" on public.church_events
for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete events" on public.church_events;
create policy "Admins can delete events" on public.church_events
for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.sermons to anon, authenticated;
grant select, insert, update, delete on public.sermons to authenticated;
grant select on public.church_events to anon, authenticated;
grant select, insert, update, delete on public.church_events to authenticated;

-- IMPORTANT SETUP:
-- 1. Run this script in the Supabase SQL Editor.
-- 2. In Supabase Auth, create the intended admin user.
-- 3. Set that user's app_metadata to {"role":"admin"} using a trusted admin-side method.
--    Never let a public signup form set app_metadata or use user_metadata for admin authorization.
-- 4. Refresh the admin user's session after changing app_metadata so the JWT contains the role.


-- Testimonies: submissions stay unpublished until an admin approves them.
-- No email/contact fields are stored in this public-facing table.
create table if not exists public.testimonies (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 100),
  testimony text not null check (char_length(testimony) between 10 and 3000),
  consent_to_publish boolean not null default false check (consent_to_publish = true),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists testimonies_set_updated_at on public.testimonies;
create trigger testimonies_set_updated_at before update on public.testimonies
for each row execute function public.set_updated_at();

alter table public.testimonies enable row level security;

drop policy if exists "Public can read approved testimonies" on public.testimonies;
create policy "Public can read approved testimonies" on public.testimonies
for select to anon, authenticated
using (published = true);

drop policy if exists "Visitors can submit pending testimonies" on public.testimonies;
create policy "Visitors can submit pending testimonies" on public.testimonies
for insert to anon, authenticated
with check (published = false and consent_to_publish = true);

drop policy if exists "Admins can read all testimonies" on public.testimonies;
create policy "Admins can read all testimonies" on public.testimonies
for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update testimonies" on public.testimonies;
create policy "Admins can update testimonies" on public.testimonies
for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete testimonies" on public.testimonies;
create policy "Admins can delete testimonies" on public.testimonies
for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select, insert on public.testimonies to anon, authenticated;
grant update, delete on public.testimonies to authenticated;
