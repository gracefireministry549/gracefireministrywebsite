-- Grace Fire Ministry: testimonies workflow (additive migration)
-- Safe to run after reviewing: creates a new table and policies only.
-- It does not alter sermons, events, prayer requests, or contact messages.
create table if not exists public.testimonies (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default 'A church member'
    check (char_length(display_name) between 2 and 80),
  testimony text not null
    check (char_length(testimony) between 20 and 3000),
  consent_to_publish boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_testimony_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists testimonies_set_updated_at on public.testimonies;
create trigger testimonies_set_updated_at before update on public.testimonies
for each row execute function public.set_testimony_updated_at();

alter table public.testimonies enable row level security;

drop policy if exists "Public can read approved testimonies" on public.testimonies;
create policy "Public can read approved testimonies" on public.testimonies
for select to anon, authenticated
using (published = true and consent_to_publish = true);

drop policy if exists "Visitors can submit testimonies for review" on public.testimonies;
create policy "Visitors can submit testimonies for review" on public.testimonies
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
