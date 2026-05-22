alter table prospects
  add column if not exists prospect_score integer,
  add column if not exists score_breakdown jsonb,
  add column if not exists score_label text,
  add column if not exists google_rating numeric,
  add column if not exists google_review_count integer;

comment on column prospects.prospect_score is 'Score 0-100 : plus bas = prospect plus chaud (besoin web)';
comment on column prospects.score_breakdown is 'Détail des pénalités appliquées au score';
comment on column prospects.score_label is 'hot | warm | cold';
