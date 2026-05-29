import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";
import { isStripeConfigured } from "@/lib/env";
import { createCheckoutSession } from "@/lib/stripe/create-checkout-session";
import { getStripePriceId } from "@/lib/stripe/prices";

export const runtime = "nodejs";

const bodySchema = z.object({
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

/** @deprecated Prefer POST /api/stripe/create-checkout with `{ priceId }` */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const { user } = auth;
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const priceId = getStripePriceId(body.interval);
    const url = await createCheckoutSession(user.id, user.email ?? "", priceId);

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request.", details: error.flatten() }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Checkout failed.";
    const status = message.includes("active Pro subscription") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
