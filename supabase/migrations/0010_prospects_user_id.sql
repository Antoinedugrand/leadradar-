-- Scope prospects to authenticated users (multi-tenant)

alter table public.prospects
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists prospects_user_id_idx on public.prospects (user_id);

-- Per-user uniqueness for Google place ids (multi-tenant)
alter table public.prospects drop constraint if exists prospects_google_place_id_key;
create unique index if not exists prospects_user_google_place_id_key
  on public.prospects (user_id, google_place_id)
  where google_place_id is not null and user_id is not null;

alter table public.prospects enable row level security;

drop policy if exists "Users can view own prospects" on public.prospects;
create policy "Users can view own prospects"
  on public.prospects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own prospects" on public.prospects;
create policy "Users can insert own prospects"
  on public.prospects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own prospects" on public.prospects;
create policy "Users can update own prospects"
  on public.prospects for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own prospects" on public.prospects;
create policy "Users can delete own prospects"
  on public.prospects for delete
  using (auth.uid() = user_id);

comment on column public.prospects.user_id is 'Owner auth.users id; required for new rows after auth rollout';
