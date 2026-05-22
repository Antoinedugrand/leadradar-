import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { geocodeAddress, normalizeLocationQuery, radiusKmForCityBounds } from "@/lib/geo-search";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Prospect } from "@/lib/types";

export const runtime = "nodejs";

const searchSchema = z.object({
  location: z.string().min(2),
  placeTypes: z.array(z.string().min(2)).min(1),
});

interface GooglePlaceResult {
  place_id: string;
}

interface PlaceDetailsResponse {
  result: {
    name: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
  };
}

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function normalizeCity(address: string | undefined): string | null {
  if (!address) {
    return null;
  }
  const chunks = address.split(",");
  if (chunks.length < 2) {
    return null;
  }
  return chunks[chunks.length - 2]?.trim() ?? null;
}

function normalizeWebsiteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

function extractEmailsFromText(content: string): string[] {
  const found = content.match(EMAIL_REGEX) ?? [];
  return [...new Set(found.map((email) => email.toLowerCase()))];
}

async function findProspectEmail(websiteUrl: string): Promise<string | null> {
  const baseUrl = normalizeWebsiteUrl(websiteUrl);
  const urlsToTry = [
    baseUrl,
    `${baseUrl.replace(/\/$/, "")}/contact`,
    `${baseUrl.replace(/\/$/, "")}/contactez-nous`,
    `${baseUrl.replace(/\/$/, "")}/nous-contacter`,
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { "User-Agent": "LeadSiteBot/1.0 (+https://leadsite.local)" },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const emails = extractEmailsFromText(html).filter(
        (email) =>
          !email.endsWith(".png") &&
          !email.endsWith(".jpg") &&
          !email.endsWith(".jpeg") &&
          !email.endsWith(".webp"),
      );
      if (emails.length > 0) {
        return emails[0];
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = searchSchema.parse(body);
    const env = getServerEnv();
    const googleApiKey = env.GOOGLE_PLACES_API_KEY;
    const supabase = getSupabaseServerClient();

    if (!enforceRateLimit("google-places-search")) {
      return NextResponse.json(
        { error: "Limite atteinte: maximum 10 requêtes/seconde vers Google." },
        { status: 429 },
      );
    }

    const normalizedLocation = normalizeLocationQuery(payload.location);

    const { result: geocoded, status: geocodeStatus } = await geocodeAddress(
      normalizedLocation,
      googleApiKey,
      { language: "fr" },
    );

    if (!geocoded) {
      const message =
        geocodeStatus === "REQUEST_DENIED"
          ? "Géocodage refusé par Google. Vérifiez la clé API Geocoding."
          : "Aucune localisation trouvée.";
      return NextResponse.json({ error: message }, { status: geocodeStatus === "REQUEST_DENIED" ? 502 : 404 });
    }

    const geometry = {
      location: geocoded.location,
      bounds: geocoded.bounds,
      viewport: geocoded.viewport,
    };
    const coordinates = geometry.location;

    const boundsBox = geometry.bounds ?? geometry.viewport;
    const { center, radiusKm } = boundsBox
      ? radiusKmForCityBounds(boundsBox)
      : { center: coordinates, radiusKm: 5 };

    const uniquePlaceIds = new Set<string>();
    const radiusMeters = Math.round(radiusKm * 1000);

    for (const placeType of payload.placeTypes) {
      if (!enforceRateLimit("google-places-search")) {
        break;
      }

      const nearbyResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radiusMeters}&type=${encodeURIComponent(placeType)}&key=${googleApiKey}`,
      );
      if (!nearbyResponse.ok) {
        continue;
      }

      const nearbyData = (await nearbyResponse.json()) as { results?: GooglePlaceResult[] };
      for (const result of nearbyData.results ?? []) {
        uniquePlaceIds.add(result.place_id);
      }
    }

    const placeDetails = await Promise.all(
      Array.from(uniquePlaceIds).map(async (placeId) => {
        if (!enforceRateLimit("google-places-search")) {
          return null;
        }

        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
            placeId,
          )}&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types&key=${googleApiKey}`,
        );
        if (!detailsResponse.ok) {
          return null;
        }

        const detailsData = (await detailsResponse.json()) as PlaceDetailsResponse;
        const item = detailsData.result;
        const websiteUrl = item.website ?? null;
        const email = websiteUrl ? await findProspectEmail(websiteUrl) : null;
        return {
          name: item.name,
          type: item.types?.[0] ?? null,
          address: item.formatted_address ?? null,
          city: normalizeCity(item.formatted_address),
          phone: item.formatted_phone_number ?? null,
          email,
          website_url: websiteUrl,
          website_exists: Boolean(websiteUrl),
          audit_score: null,
          prospect_score: null,
          score_breakdown: null,
          score_label: null,
          google_rating: item.rating ?? null,
          google_review_count: item.user_ratings_total ?? null,
          audit_issues: null,
          screenshot_url: null,
          status: "new",
          google_place_id: placeId,
        };
      }),
    );

    const prospectsToSave = placeDetails.filter((item) => item !== null);

    let savedProspects: Prospect[] = [];

    if (prospectsToSave.length > 0) {
      const { error } = await supabase
        .from("prospects")
        .upsert(prospectsToSave, { onConflict: "google_place_id" });
      if (error) {
        return NextResponse.json(
          { error: "Erreur Supabase lors de la sauvegarde des prospects." },
          { status: 500 },
        );
      }

      const placeIds = prospectsToSave.map((item) => item.google_place_id);
      const { data: fetched } = await supabase
        .from("prospects")
        .select("*")
        .in("google_place_id", placeIds)
        .order("created_at", { ascending: false });

      savedProspects = (fetched ?? []) as Prospect[];
    }

    const radiusLabel =
      radiusKm < 1 ? `${Math.round(radiusKm * 1000)} m` : `${radiusKm.toFixed(1)} km`;

    return NextResponse.json(
      {
        message: `Recherche sur ${normalizedLocation} (zone ~${radiusLabel}).`,
        count: savedProspects.length,
        radiusKm,
        prospects: savedProspects,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Requête invalide.", details: error.flatten() },
        { status: 400 },
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "Erreur serveur pendant la recherche.", details: errorMessage },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur pendant la recherche." },
      { status: 500 },
    );
  }
}
