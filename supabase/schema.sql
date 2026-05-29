create extension if not exists "pgcrypto";

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text,
  address text,
  city text,
  phone text,
  email text,
  website_url text,
  website_exists boolean default false,
  audit_score integer,
  prospect_score integer,
  score_breakdown jsonb,
  score_label text,
  google_rating numeric,
  google_review_count integer,
  review_insights jsonb,
  audit_summary text,
  audit_issues jsonb,
  screenshot_url text,
  status text default 'new',
  google_place_id text,
  created_at timestamptz default now(),
  emailed_at timestamptz,
  contact_pipeline text,
  generated_site_html text,
  generated_site_at timestamptz,
  email_source text,
  phone_source text,
  contacts_enriched_at timestamptz,
  social_links jsonb,
  business_type_label text
);

create index if not exists prospects_user_id_idx on prospects (user_id);

create unique index if not exists prospects_user_google_place_id_key
  on prospects (user_id, google_place_id)
  where google_place_id is not null and user_id is not null;

alter table prospects enable row level security;

create policy "Users can view own prospects"
  on prospects for select
  using (auth.uid() = user_id);

create policy "Users can insert own prospects"
  on prospects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own prospects"
  on prospects for update
  using (auth.uid() = user_id);

create policy "Users can delete own prospects"
  on prospects for delete
  using (auth.uid() = user_id);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id),
  subject text,
  body text,
  sent_at timestamptz default now(),
  opened_at timestamptz,
  replied_at timestamptz
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  plan_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_stripe_customer_id_idx on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

alter table public.users enable row level security;

create policy "Users can view own row"
  on public.users for select
  using (auth.uid() = id);

-- Billing fields (plan, stripe_*) are updated only via service role (Stripe webhooks).

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row
  execute function public.update_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, plan)
  values (new.id, coalesce(new.email, ''), 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
