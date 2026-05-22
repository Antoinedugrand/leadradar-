export function getServerEnv() {
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!googlePlacesApiKey) {
    throw new Error("Variable d'environnement manquante: GOOGLE_PLACES_API_KEY");
  }
  if (!anthropicApiKey) {
    throw new Error("Variable d'environnement manquante: ANTHROPIC_API_KEY");
  }
  if (!resendApiKey) {
    throw new Error("Variable d'environnement manquante: RESEND_API_KEY");
  }
  if (!supabaseServiceRoleKey) {
    throw new Error("Variable d'environnement manquante: SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    GOOGLE_PLACES_API_KEY: googlePlacesApiKey,
    ANTHROPIC_API_KEY: anthropicApiKey,
    RESEND_API_KEY: resendApiKey,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
  };
}

export function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Variable d'environnement manquante: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL invalide: utilisez l'URL complète (ex: https://xxxxx.supabase.co).",
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  };
}
