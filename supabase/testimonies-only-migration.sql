-- Grace Fire Ministry: dedicated testimonies migration
-- Run this file once in the intended Supabase project's SQL Editor.
-- It creates only public.testimonies and its policies; it does not modify prayer_requests,
-- contact_messages, sermons, church_events, or existing functions/triggers.

create table if not exists public.testimonies (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 100),
  testimony text not null check (char_length(testimony) between 10 and 3000),
  consent_to_publish boolean not null default false check (consent_to_publish = true),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.testimonies enable row level security;

grant select, insert on public.testimonies to anon, authenticated;
grant update, delete on public.testimonies to authenticated;

create policy "Public can read approved testimonies"
on public.testimonies for select to anon, authenticated
using (published = true);

create policy "Visitors can submit pending testimonies"
on public.testimonies for insert to anon, authenticated
with check (published = false and consent_to_publish = true);

create policy "Admins can read all testimonies"
on public.testimonies for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update testimonies"
on public.testimonies for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete testimonies"
on public.testimonies for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
