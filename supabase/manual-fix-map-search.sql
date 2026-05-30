-- Run once in Supabase SQL Editor to fix "Erreur Supabase pendant la sauvegarde" on Map Search.
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS).

-- 0006
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS email_source text,
  ADD COLUMN IF NOT EXISTS phone_source text,
  ADD COLUMN IF NOT EXISTS contacts_enriched_at timestamptz;

-- 0007
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS social_links jsonb;

-- 0008
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS business_type_label text;

-- 0010 (critical for upsert onConflict user_id,google_place_id)
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS prospects_user_id_idx ON public.prospects (user_id);

ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_google_place_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS prospects_user_google_place_id_key
  ON public.prospects (user_id, google_place_id)
  WHERE google_place_id IS NOT NULL AND user_id IS NOT NULL;

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prospects" ON public.prospects;
CREATE POLICY "Users can view own prospects"
  ON public.prospects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prospects" ON public.prospects;
CREATE POLICY "Users can insert own prospects"
  ON public.prospects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prospects" ON public.prospects;
CREATE POLICY "Users can update own prospects"
  ON public.prospects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prospects" ON public.prospects;
CREATE POLICY "Users can delete own prospects"
  ON public.prospects FOR DELETE
  USING (auth.uid() = user_id);

-- 0012: attach old prospects to your account (first signup)
DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF owner_id IS NULL THEN
    RAISE NOTICE 'No auth user yet — skip legacy assign.';
    RETURN;
  END IF;
  UPDATE public.prospects SET user_id = owner_id WHERE user_id IS NULL;
  RAISE NOTICE 'Legacy prospects assigned to %', owner_id;
END $$;
