import Stripe from "stripe";

import { getStripeEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

function createStripeClient(): Stripe {
  const { STRIPE_SECRET_KEY } = getStripeEnv();
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });
}

/** Singleton Stripe client (guide: `export const stripe`). */
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = createStripeClient();
  }
  return stripeClient;
}

/** @deprecated Prefer `getStripe()` — kept for existing imports */
export const getStripeServer = getStripe;
