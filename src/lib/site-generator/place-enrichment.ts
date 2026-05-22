import { enforceRateLimit } from "@/lib/rate-limit";
import type { PlaceEnrichment } from "@/lib/site-generator/types";

interface GooglePlaceDetailsResult {
  result?: {
    editorial_summary?: { overview?: string };
    opening_hours?: { weekday_text?: string[] };
    url?: string;
  };
}

export async function fetchPlaceEnrichment(
  googlePlaceId: string | null,
  googleApiKey: string,
): Promise<PlaceEnrichment> {
  const empty: PlaceEnrichment = {
    editorialSummary: null,
    openingHours: null,
    mapsUrl: null,
  };

  if (!googlePlaceId || !enforceRateLimit("google-places-details")) {
    return empty;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        googlePlaceId,
      )}&fields=editorial_summary,opening_hours,url&language=fr&key=${googleApiKey}`,
    );

    if (!response.ok) {
      return empty;
    }

    const data = (await response.json()) as GooglePlaceDetailsResult;
    const result = data.result;

    return {
      editorialSummary: result?.editorial_summary?.overview?.trim() ?? null,
      openingHours: result?.opening_hours?.weekday_text?.length
        ? result.opening_hours.weekday_text
        : null,
      mapsUrl: result?.url ?? null,
    };
  } catch {
    return empty;
  }
}

function mapsSearchUrl(address: string | null, city: string | null, name: string): string {
  const query = [name, address, city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function resolveMapsUrl(
  enrichment: PlaceEnrichment,
  address: string | null,
  city: string | null,
  name: string,
): string {
  return enrichment.mapsUrl ?? mapsSearchUrl(address, city, name);
}
