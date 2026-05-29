import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/lib/auth/require-user";
import { mergeBusinessTypeLabel, pickBestPlaceType } from "@/lib/business-type";
import { enrichProspectsBatch, mergeContactFields } from "@/lib/contact-enrichment";
import { getServerEnv } from "@/lib/env";
import { geocodeAddress, normalizeLocationQuery, radiusKmForCityBounds } from "@/lib/geo-search";
import { getServerLocale } from "@/lib/i18n/server";
import { enforceRateLimit } from "@/lib/rate-limit";
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
    const payload = searchSchema.parse(body);
    const env = getServerEnv();
    const googleApiKey = env.GOOGLE_PLACES_API_KEY;
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const { supabase, user } = auth;

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

        return {
          name: item.name,
          type: pickBestPlaceType(item.types),
          address: item.formatted_address ?? null,
          city: normalizeCity(item.formatted_address),
          phone: item.formatted_phone_number ?? null,
          email: null as string | null,
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
          status: "new" as const,
          google_place_id: placeId,
        };
      }),
    );

    const rawProspects = placeDetails.filter((item) => item !== null);

    const placeIds = rawProspects.map((item) => item.google_place_id);
    const locale = await getServerLocale();
    const { data: existingRows } = await supabase
      .from("prospects")
      .select(
        "google_place_id, email, phone, email_source, phone_source, contacts_enriched_at, social_links, business_type_label",
      )
      .eq("user_id", user.id)
      .in("google_place_id", placeIds);

    const existingByPlaceId = new Map(
      (existingRows ?? []).map((row) => [row.google_place_id as string, row]),
    );

    const enrichInputs = rawProspects.map((item) => ({
      businessName: item.name,
      websiteUrl: item.website_url,
      googlePhone: item.phone,
      google_place_id: item.google_place_id,
      googleType: item.type,
      address: item.address,
      city: item.city,
      existingBusinessTypeLabel: existingByPlaceId.get(item.google_place_id)?.business_type_label,
      locale,
    }));

    const enrichedByPlaceId = new Map(
      (await enrichProspectsBatch(enrichInputs)).map((item) => [item.google_place_id!, item]),
    );

    const prospectsToSave = rawProspects.map((incoming) => {
      const existing = existingByPlaceId.get(incoming.google_place_id);
      const enriched = enrichedByPlaceId.get(incoming.google_place_id);

      const merged = mergeContactFields(existing, {
        email: enriched?.email ?? null,
        phone: enriched?.phone ?? incoming.phone ?? null,
        email_source: enriched?.emailSource ?? null,
        phone_source:
          enriched?.phoneSource ?? (incoming.phone && !enriched ? "google" : null),
        contacts_enriched_at: enriched?.enrichedAt ?? null,
        social_links: enriched?.socialLinks?.length ? enriched.socialLinks : null,
      });

      return {
        ...incoming,
        user_id: user.id,
        email: merged.email ?? null,
        phone: merged.phone ?? null,
        email_source: merged.email_source ?? null,
        phone_source: merged.phone_source ?? null,
        contacts_enriched_at: merged.contacts_enriched_at ?? null,
        social_links: merged.social_links ?? null,
        business_type_label: mergeBusinessTypeLabel(existing, enriched?.businessTypeLabel),
      };
    });

    let savedProspects: Prospect[] = [];

    if (prospectsToSave.length > 0) {
      const { error } = await supabase
        .from("prospects")
        .upsert(prospectsToSave, { onConflict: "user_id,google_place_id" });

      if (error) {
        const isMissingColumn = /column.*(email_source|phone_source|contacts_enriched_at|social_links|business_type_label)/i.test(
          error.message,
        );
        if (isMissingColumn) {
          const fallbackRows = prospectsToSave.map(
            ({
              email_source: _es,
              phone_source: _ps,
              contacts_enriched_at: _ce,
              social_links: _sl,
              business_type_label: _bt,
              ...row
            }) => row,
          );
          const { error: fallbackError } = await supabase
            .from("prospects")
            .upsert(fallbackRows, { onConflict: "user_id,google_place_id" });
          if (fallbackError) {
            return NextResponse.json(
              { error: "Erreur Supabase lors de la sauvegarde des prospects." },
              { status: 500 },
            );
          }
        } else {
          return NextResponse.json(
            { error: "Erreur Supabase lors de la sauvegarde des prospects." },
            { status: 500 },
          );
        }
      }

      const { data: fetched } = await supabase
        .from("prospects")
        .select("*")
        .eq("user_id", user.id)
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
