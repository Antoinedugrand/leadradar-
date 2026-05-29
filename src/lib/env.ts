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
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl) {
    throw new Error("Variable d'environnement manquante: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseAnonKey) {
    throw new Error("Variable d'environnement manquante: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL invalide: utilisez l'URL complète (ex: https://xxxxx.supabase.co).",
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  };
}

/** Canonical app origin for redirects, emails, Stripe success/cancel URLs. */
export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_PRICE_PRO_MONTHLY &&
      process.env.STRIPE_PRICE_PRO_YEARLY,
  );
}

/** Server-only Stripe config. Throws if any key is missing — call isStripeConfigured() first in UI. */
export function getStripeEnv() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripePriceProMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const stripePriceProYearly = process.env.STRIPE_PRICE_PRO_YEARLY;

  if (!stripeSecretKey) {
    throw new Error("Variable d'environnement manquante: STRIPE_SECRET_KEY");
  }
  if (!stripeWebhookSecret) {
    throw new Error("Variable d'environnement manquante: STRIPE_WEBHOOK_SECRET");
  }
  if (!stripePriceProMonthly) {
    throw new Error("Variable d'environnement manquante: STRIPE_PRICE_PRO_MONTHLY");
  }
  if (!stripePriceProYearly) {
    throw new Error("Variable d'environnement manquante: STRIPE_PRICE_PRO_YEARLY");
  }

  return {
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
    STRIPE_PRICE_PRO_MONTHLY: stripePriceProMonthly,
    STRIPE_PRICE_PRO_YEARLY: stripePriceProYearly,
  };
}

/** Client-safe Stripe publishable key (Checkout.js / Elements). */
export function getStripePublicEnv() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("Variable d'environnement manquante: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }
  return {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: publishableKey,
  };
}
