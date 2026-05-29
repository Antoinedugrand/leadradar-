import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";
import { isStripeConfigured } from "@/lib/env";
import { createCheckoutSession } from "@/lib/stripe/create-checkout-session";

export const runtime = "nodejs";

const bodySchema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const auth = await requireApiUser();
    if ("error" in auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = auth;
    const { priceId } = bodySchema.parse(await request.json());

    const url = await createCheckoutSession(user.id, user.email ?? "", priceId);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === "Invalid priceId.") {
        return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
      }
      if (error.message.includes("active Pro subscription")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
