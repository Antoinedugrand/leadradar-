-- Migration : ajoute le champ audit_summary (verdict 1 phrase produit par l'IA)
-- À exécuter dans Supabase Studio > SQL editor.

alter table prospects
  add column if not exists audit_summary text;
