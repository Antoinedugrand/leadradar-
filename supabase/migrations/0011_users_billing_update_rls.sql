-- Billing fields on public.users must only be written by service role (Stripe webhooks).
-- Users keep SELECT on their own row.

drop policy if exists "Users can update own row" on public.users;
