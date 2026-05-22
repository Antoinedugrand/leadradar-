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

export interface ClientPlaceProspect {
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: null;
  website_url: string | null;
  website_exists: boolean;
  audit_score: null;
  prospect_score: null;
  score_breakdown: null;
  score_label: null;
  google_rating: number | null;
  google_review_count: number | null;
  audit_issues: null;
  screenshot_url: null;
  status: "new";
  google_place_id: string;
  lat: number | null;
  lng: number | null;
}

export type PlacesSearchError =
  | "MAPS_NOT_LOADED"
  | "REQUEST_DENIED"
  | "OVER_QUERY_LIMIT"
  | "UNKNOWN_ERROR";

function placeToProspect(place: google.maps.places.PlaceResult): ClientPlaceProspect | null {
  const placeId = place.place_id;
  const name = place.name;
  if (!placeId || !name) {
    return null;
  }

  const websiteUrl = place.website ?? null;
  const lat = place.geometry?.location?.lat() ?? null;
  const lng = place.geometry?.location?.lng() ?? null;

  return {
    name,
    type: place.types?.[0] ?? null,
    address: place.formatted_address ?? null,
    city: normalizeCity(place.formatted_address),
    phone: place.formatted_phone_number ?? null,
    email: null,
    website_url: websiteUrl,
    website_exists: Boolean(websiteUrl),
    audit_score: null,
    prospect_score: null,
    score_breakdown: null,
    score_label: null,
    google_rating: place.rating ?? null,
    google_review_count: place.user_ratings_total ?? null,
    audit_issues: null,
    screenshot_url: null,
    status: "new",
    google_place_id: placeId,
    lat,
    lng,
  };
}

function mapPlacesStatus(status: google.maps.places.PlacesServiceStatus): PlacesSearchError | null {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    return null;
  }
  if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
    return null;
  }
  if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
    return "REQUEST_DENIED";
  }
  if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
    return "OVER_QUERY_LIMIT";
  }
  return "UNKNOWN_ERROR";
}

function nearbySearchOnce(
  service: google.maps.places.PlacesService,
  request: google.maps.places.PlaceSearchRequest,
): Promise<{ results: google.maps.places.PlaceResult[]; error: PlacesSearchError | null }> {
  return new Promise((resolve) => {
    service.nearbySearch(request, (results, status) => {
      const error = mapPlacesStatus(status);
      if (error) {
        resolve({ results: [], error });
        return;
      }
      resolve({ results: results ?? [], error: null });
    });
  });
}

function getPlaceDetails(
  service: google.maps.places.PlacesService,
  placeId: string,
): Promise<{ place: google.maps.places.PlaceResult | null; error: PlacesSearchError | null }> {
  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "formatted_phone_number",
          "website",
          "rating",
          "user_ratings_total",
          "types",
          "geometry",
        ],
      },
      (place, status) => {
        const error = mapPlacesStatus(status);
        if (error) {
          resolve({ place: null, error });
          return;
        }
        resolve({ place: place ?? null, error: null });
      },
    );
  });
}

export function placesSearchErrorMessageKey(error: PlacesSearchError): string {
  switch (error) {
    case "MAPS_NOT_LOADED":
      return "map.geocodeMapsLoading";
    case "REQUEST_DENIED":
      return "map.placesDenied";
    case "OVER_QUERY_LIMIT":
      return "map.placesQuota";
    default:
      return "map.areaSearchError";
  }
}

export async function searchPlacesInArea(options: {
  map: google.maps.Map;
  lat: number;
  lng: number;
  radiusKm: number;
  placeTypes: string[];
}): Promise<{ prospects: ClientPlaceProspect[]; error?: PlacesSearchError }> {
  if (typeof google === "undefined" || !google.maps?.places?.PlacesService) {
    return { prospects: [], error: "MAPS_NOT_LOADED" };
  }

  const service = new google.maps.places.PlacesService(options.map);
  const location = new google.maps.LatLng(options.lat, options.lng);
  const radiusMeters = Math.round(options.radiusKm * 1000);
  const uniquePlaceIds = new Set<string>();

  for (const placeType of options.placeTypes) {
    const trimmed = placeType.trim();
    if (!trimmed) continue;

    const nearby = await nearbySearchOnce(service, {
      location,
      radius: radiusMeters,
      type: trimmed,
    });

    if (nearby.error) {
      return { prospects: [], error: nearby.error };
    }

    for (const result of nearby.results) {
      if (result.place_id) {
        uniquePlaceIds.add(result.place_id);
      }
    }
  }

  const details = await Promise.all(
    Array.from(uniquePlaceIds).map((placeId) => getPlaceDetails(service, placeId)),
  );

  for (const detail of details) {
    if (detail.error) {
      return { prospects: [], error: detail.error };
    }
  }

  const prospects = details
    .map((detail) => (detail.place ? placeToProspect(detail.place) : null))
    .filter((item): item is ClientPlaceProspect => item !== null);

  return { prospects };
}
