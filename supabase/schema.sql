create extension if not exists pgcrypto;

create table if not exists public.planners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled Planner',
  snapshot jsonb not null default '{}'::jsonb,
  share_id uuid not null default gen_random_uuid() unique,
  share_mode text not null default 'private' check (share_mode in ('private', 'view', 'edit')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists planners_set_updated_at on public.planners;
create trigger planners_set_updated_at
before update on public.planners
for each row
execute function public.set_updated_at();

alter table public.planners enable row level security;

drop policy if exists "Owners can view their planners" on public.planners;
create policy "Owners can view their planners"
on public.planners
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Owners can insert their planners" on public.planners;
create policy "Owners can insert their planners"
on public.planners
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their planners" on public.planners;
create policy "Owners can update their planners"
on public.planners
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete their planners" on public.planners;
create policy "Owners can delete their planners"
on public.planners
for delete
to authenticated
using (auth.uid() = owner_id);
