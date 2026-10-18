-- Baghdad Pothole Map: database schema for Supabase.
-- Run once in the Supabase SQL editor. Requires "Anonymous sign-ins" enabled
-- under Authentication > Providers so people can report without an account.

create extension if not exists pgcrypto;

-- Reports ---------------------------------------------------------------
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  reporter         uuid not null default auth.uid() references auth.users(id) on delete set null,
  lat              double precision not null check (lat between 33.0 and 33.7),
  lng              double precision not null check (lng between 44.0 and 44.8),
  district         text not null,
  road             text not null default 'street' check (road in ('street', 'highway')),
  note             text check (char_length(note) <= 200),
  photo_path       text not null,
  status           text not null default 'open' check (status in ('open', 'fixed')),
  fixed_at         timestamptz,
  fixed_photo_path text,
  fixed_by         text check (char_length(fixed_by) <= 80),
  hidden           boolean not null default false  -- set by moderators to remove spam
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);

create table if not exists public.confirmations (
  report_id  uuid not null references public.reports(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

-- What the app reads: visible reports with their confirmation count.
create or replace view public.reports_public with (security_invoker = true) as
  select r.id, r.created_at, r.reporter, r.lat, r.lng, r.district, r.road, r.note,
         r.photo_path, r.status, r.fixed_at, r.fixed_photo_path, r.fixed_by,
         (select count(*) from public.confirmations c where c.report_id = r.id)::int as confirm_count
  from public.reports r
  where not r.hidden;

-- Row level security --------------------------------------------------------
alter table public.reports enable row level security;
alter table public.confirmations enable row level security;

drop policy if exists "reports readable" on public.reports;
create policy "reports readable" on public.reports
  for select using (not hidden);

drop policy if exists "signed-in users report" on public.reports;
create policy "signed-in users report" on public.reports
  for insert to authenticated
  with check (reporter = auth.uid() and status = 'open' and hidden = false);

drop policy if exists "confirmations readable" on public.confirmations;
create policy "confirmations readable" on public.confirmations
  for select using (true);

drop policy if exists "confirm once as yourself" on public.confirmations;
create policy "confirm once as yourself" on public.confirmations
  for insert to authenticated with check (user_id = auth.uid());

-- Spam brake: at most 10 reports per person per day.
create or replace function public.limit_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports
      where reporter = new.reporter and created_at > now() - interval '1 day') >= 10 then
    raise exception 'daily_limit';
  end if;
  return new;
end $$;

drop trigger if exists limit_reports on public.reports;
create trigger limit_reports before insert on public.reports
  for each row execute function public.limit_reports();

-- Marking a pothole fixed goes through this function so nobody can edit
-- other fields of someone else's report.
create or replace function public.mark_fixed(report uuid, after_photo text, fixed_by_name text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  update public.reports
     set status = 'fixed', fixed_at = now(),
         fixed_photo_path = nullif(after_photo, ''),
         fixed_by = nullif(left(fixed_by_name, 80), '')
   where id = report and status = 'open' and not hidden;
end $$;

revoke all on function public.mark_fixed(uuid, text, text) from public;
grant execute on function public.mark_fixed(uuid, text, text) to authenticated;

-- Photo storage ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos upload into own folder" on storage.objects;
create policy "photos upload into own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Live updates for the map (skipped if already added, so this file can be re-run).
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports') then
    alter publication supabase_realtime add table public.reports;
  end if;
end $$;
