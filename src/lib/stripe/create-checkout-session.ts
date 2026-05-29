import { isProPlan } from "@/lib/billing/plans";
import { getAppUrl, getStripeEnv } from "@/lib/env";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { getStripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export function isAllowedStripePriceId(priceId: string): boolean {
  const { STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY } = getStripeEnv();
  return priceId === STRIPE_PRICE_PRO_MONTHLY || priceId === STRIPE_PRICE_PRO_YEARLY;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
): Promise<string> {
  if (!isAllowedStripePriceId(priceId)) {
    throw new Error("Invalid priceId.");
  }

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("plan, subscription_status, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();

  if (
    isProPlan(profile?.plan) &&
    profile?.subscription_status === "active" &&
    profile?.stripe_subscription_id
  ) {
    throw new Error("You already have an active Pro subscription.");
  }

  const stripeCustomerId = await getOrCreateStripeCustomer(userId, email);
  const appUrl = getAppUrl();

  const session = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgrade=success`,
    cancel_url: `${appUrl}/#pricing`,
    client_reference_id: userId,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return session.url;
}
