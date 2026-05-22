alter table prospects
  add column if not exists review_insights jsonb;

comment on column prospects.review_insights is 'Avis Google négatifs analysés + points d''amélioration (service / site)';
