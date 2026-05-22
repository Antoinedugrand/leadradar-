alter table prospects
  add column if not exists contact_pipeline text;

comment on column prospects.contact_pipeline is 'Pour les prospects contactés: waiting_reply | project_done';

update prospects
set contact_pipeline = 'waiting_reply'
where status in ('emailed', 'replied', 'converted')
  and contact_pipeline is null;
