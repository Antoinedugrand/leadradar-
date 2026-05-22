create extension if not exists "pgcrypto";

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
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
  google_place_id text unique,
  created_at timestamptz default now(),
  emailed_at timestamptz,
  contact_pipeline text,
  generated_site_html text,
  generated_site_at timestamptz
);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id),
  subject text,
  body text,
  sent_at timestamptz default now(),
  opened_at timestamptz,
  replied_at timestamptz
);
