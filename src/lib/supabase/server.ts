import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv, getServerEnv } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseServerClient() {
  if (!adminClient) {
    const publicEnv = getPublicEnv();
    const serverEnv = getServerEnv();
    adminClient = createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  }
  return adminClient;
}

/** Service role — bypasses RLS. Use for Stripe webhooks and admin tasks only. */
export const getSupabaseAdminClient = getSupabaseServerClient;

/**
 * Guide Stripe: `supabaseAdmin.from('users')` — lazy singleton (service role).
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdminClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
