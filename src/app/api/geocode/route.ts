import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { geocodeAddress } from "@/lib/geo-search";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().min(2).max(200),
  language: z.string().min(2).max(10).optional(),
});

export async function GET(request: Request) {
  if (!enforceRateLimit("geocode")) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    language: url.searchParams.get("language") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Requête de géocodage invalide." }, { status: 400 });
  }

  try {
    const env = getServerEnv();
    const { result, status, errorMessage } = await geocodeAddress(
      parsed.data.q,
      env.GOOGLE_PLACES_API_KEY,
      { language: parsed.data.language },
    );

    if (!result) {
      if (status === "REQUEST_DENIED") {
        return NextResponse.json(
          {
            error:
              "Géocodage refusé par Google. Vérifiez que l'API Geocoding est activée pour votre clé.",
            status,
            details: errorMessage,
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        { error: "Ville ou zone introuvable.", status, details: errorMessage },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erreur lors du géocodage." }, { status: 500 });
  }
}
