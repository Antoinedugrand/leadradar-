import { createClient } from "@supabase/supabase-js";

import { getPublicEnv, getServerEnv } from "@/lib/env";

export function getSupabaseServerClient() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();

  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
}
