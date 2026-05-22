import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Prospect } from "@/lib/types";

export const runtime = "nodejs";

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.05).max(30),
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
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  };
}

interface MapProspectPayload {
  google_place_id: string;
  name: string;
  address: string | null;
  website_url: string | null;
  lat: number | null;
  lng: number | null;
  audit_score: number | null;
  prospect_score: number | null;
}

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);
    const env = getServerEnv();
    const googleApiKey = env.GOOGLE_PLACES_API_KEY;
    const supabase = getSupabaseServerClient();

    const uniquePlaceIds = new Set<string>();

    for (const placeType of payload.placeTypes) {
      if (!enforceRateLimit("google-places-area-search")) {
        return NextResponse.json({ error: "Limite de requêtes atteinte (10/s)." }, { status: 429 });
      }

      const nearbyResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${payload.lat},${payload.lng}&radius=${
          payload.radiusKm * 1000
        }&type=${encodeURIComponent(placeType)}&key=${googleApiKey}`,
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
        if (!enforceRateLimit("google-places-area-search")) {
          return null;
        }

        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
            placeId,
          )}&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry&key=${googleApiKey}`,
        );
        if (!detailsResponse.ok) {
          return null;
        }

        const detailsData = (await detailsResponse.json()) as PlaceDetailsResponse;
        const item = detailsData.result;
        const websiteUrl = item.website ?? null;
        const coordinates = item.geometry?.location;

        return {
          save: {
            name: item.name,
            type: item.types?.[0] ?? null,
            address: item.formatted_address ?? null,
            city: normalizeCity(item.formatted_address),
            phone: item.formatted_phone_number ?? null,
            email: null,
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
          },
          map: {
            google_place_id: placeId,
            name: item.name,
            address: item.formatted_address ?? null,
            website_url: websiteUrl,
            lat: coordinates?.lat ?? null,
            lng: coordinates?.lng ?? null,
          },
        };
      }),
    );

    const validDetails = placeDetails.filter((item) => item !== null);
    const prospectsToSave = validDetails.map((item) => item.save);
    let prospectsForMap: MapProspectPayload[] = validDetails.map((item) => ({
      ...item.map,
      audit_score: null,
      prospect_score: null,
    }));
    let prospectsForList: Prospect[] = [];

    if (prospectsToSave.length > 0) {
      const { error } = await supabase
        .from("prospects")
        .upsert(prospectsToSave, { onConflict: "google_place_id" });
      if (error) {
        return NextResponse.json({ error: "Erreur Supabase pendant la sauvegarde." }, { status: 500 });
      }

      const placeIds = Array.from(uniquePlaceIds);
      const { data: savedProspects, error: fetchError } = await supabase
        .from("prospects")
        .select("*")
        .in("google_place_id", placeIds)
        .order("created_at", { ascending: false });

      if (!fetchError && savedProspects) {
        prospectsForList = savedProspects as Prospect[];
        const byPlaceId = new Map(
          prospectsForList.map((prospect) => [
            prospect.google_place_id,
            {
              audit_score: prospect.audit_score,
              prospect_score: prospect.prospect_score,
            },
          ]),
        );
        prospectsForMap = validDetails.map((item) => {
          const scores = byPlaceId.get(item.save.google_place_id);
          return {
            ...item.map,
            audit_score: scores?.audit_score ?? null,
            prospect_score: scores?.prospect_score ?? null,
          };
        });
      }
    }

    return NextResponse.json({
      message: "Recherche zone terminée.",
      count: prospectsToSave.length,
      data: prospectsForMap,
      prospects: prospectsForList,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload invalide.", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur recherche zone." }, { status: 500 });
  }
}
