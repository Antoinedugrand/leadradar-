-- One-time: assign orphan prospects to the first auth user (run after 0010).
-- Safe to re-run: only touches rows where user_id IS NULL.
-- Prefer setting a specific UUID in SQL Editor if you have multiple users.

do $$
declare
  owner_id uuid;
begin
  select id into owner_id from auth.users order by created_at asc limit 1;
  if owner_id is null then
    raise notice 'No auth.users row — skip legacy assign.';
    return;
  end if;

  update public.prospects
  set user_id = owner_id
  where user_id is null;

  raise notice 'Assigned legacy prospects to %', owner_id;
end $$;
