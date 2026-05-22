alter table prospects
  add column if not exists generated_site_html text,
  add column if not exists generated_site_at timestamptz;
