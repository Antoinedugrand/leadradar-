import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { fetchPlaceAutocomplete } from "@/lib/google-places/autocomplete";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const querySchema = z.object({
  input: z.string().min(2).max(200),
  language: z.string().min(2).max(10).optional(),
});

export async function GET(request: Request) {
  if (!enforceRateLimit("places-autocomplete")) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    input: url.searchParams.get("input") ?? "",
    language: url.searchParams.get("language") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Requête d'autocomplétion invalide." }, { status: 400 });
  }

  try {
    const env = getServerEnv();
    const outcome = await fetchPlaceAutocomplete(
      parsed.data.input,
      env.GOOGLE_PLACES_API_KEY,
      { language: parsed.data.language },
    );

    if (outcome.status === "REQUEST_DENIED") {
      return NextResponse.json(
        {
          error: "Places Autocomplete refusé par Google. Vérifiez que Places API est activée.",
          status: outcome.status,
          details: outcome.errorMessage,
        },
        { status: 502 },
      );
    }

    if (outcome.status === "OVER_QUERY_LIMIT") {
      return NextResponse.json(
        { error: "Quota Places API dépassé.", status: outcome.status },
        { status: 502 },
      );
    }

    if (outcome.status !== "OK" && outcome.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: "Autocomplétion indisponible.", status: outcome.status, details: outcome.errorMessage },
        { status: 502 },
      );
    }

    return NextResponse.json({ predictions: outcome.predictions });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'autocomplétion." }, { status: 500 });
  }
}
