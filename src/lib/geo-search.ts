const ENCLOSURE_MARGIN = 1.08;
const MAX_CITY_RADIUS_KM = 50;
const MIN_CITY_RADIUS_KM = 2;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earthM = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function normalizeLocationQuery(rawQuery: string): string {
  const cleaned = rawQuery.trim();
  const arrondissementMatch = cleaned.match(/^paris\s*([1-9]|1[0-9]|20)$/i);
  if (!arrondissementMatch?.[1]) {
    return cleaned;
  }

  const arrondissement = Number(arrondissementMatch[1]);
  const ordinal = arrondissement === 1 ? "1er" : `${arrondissement}e`;
  return `${ordinal} arrondissement de Paris, France`;
}

export function radiusKmForCityBounds(box: {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}): { center: { lat: number; lng: number }; radiusKm: number } {
  const ne = box.northeast;
  const sw = box.southwest;
  const center = { lat: (ne.lat + sw.lat) / 2, lng: (ne.lng + sw.lng) / 2 };
  const corners = [
    { lat: ne.lat, lng: ne.lng },
    { lat: ne.lat, lng: sw.lng },
    { lat: sw.lat, lng: ne.lng },
    { lat: sw.lat, lng: sw.lng },
  ];
  let maxM = 0;
  for (const point of corners) {
    maxM = Math.max(maxM, haversineMeters(center, point));
  }
  const radiusKm = Math.min(
    MAX_CITY_RADIUS_KM,
    Math.max(MIN_CITY_RADIUS_KM, (maxM * ENCLOSURE_MARGIN) / 1000),
  );
  return { center, radiusKm };
}

export interface GeocodeLatLng {
  lat: number;
  lng: number;
}

export interface GeocodeBounds {
  northeast: GeocodeLatLng;
  southwest: GeocodeLatLng;
}

export interface GeocodeResult {
  location: GeocodeLatLng;
  bounds?: GeocodeBounds;
  viewport?: GeocodeBounds;
  formattedAddress?: string;
}

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: GeocodeLatLng;
      viewport?: GeocodeBounds;
      bounds?: GeocodeBounds;
    };
  }>;
}

export async function geocodeAddress(
  rawQuery: string,
  apiKey: string,
  options: { language?: string } = {},
): Promise<{ result: GeocodeResult | null; status: string; errorMessage?: string }> {
  const normalized = normalizeLocationQuery(rawQuery);
  if (normalized.length < 2) {
    return { result: null, status: "INVALID_REQUEST" };
  }

  const params = new URLSearchParams({
    address: normalized,
    key: apiKey,
  });
  if (options.language) {
    params.set("language", options.language);
  }

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  if (!response.ok) {
    return { result: null, status: "HTTP_ERROR", errorMessage: response.statusText };
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;
  const geometry = payload.results?.[0]?.geometry;
  const location = geometry?.location;

  if (!location || payload.status !== "OK") {
    return {
      result: null,
      status: payload.status,
      errorMessage: payload.error_message,
    };
  }

  return {
    result: {
      location,
      bounds: geometry.bounds,
      viewport: geometry.viewport,
      formattedAddress: payload.results?.[0]?.formatted_address,
    },
    status: payload.status,
  };
}
