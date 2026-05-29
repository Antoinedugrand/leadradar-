ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS social_links jsonb;
