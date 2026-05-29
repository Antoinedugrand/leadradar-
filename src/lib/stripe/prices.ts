import { getStripeEnv } from "@/lib/env";

export type StripeBillingInterval = "monthly" | "yearly";

export function getStripePriceId(interval: StripeBillingInterval): string {
  const { STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY } = getStripeEnv();
  return interval === "yearly" ? STRIPE_PRICE_PRO_YEARLY : STRIPE_PRICE_PRO_MONTHLY;
}
