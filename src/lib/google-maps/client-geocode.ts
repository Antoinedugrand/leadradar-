import { normalizeLocationQuery, type GeocodeBounds, type GeocodeResult } from "@/lib/geo-search";

function boundsFromGoogle(bounds: google.maps.LatLngBounds): GeocodeBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    northeast: { lat: ne.lat(), lng: ne.lng() },
    southwest: { lat: sw.lat(), lng: sw.lng() },
  };
}

export type ClientGeocodeOutcome =
  | { ok: true; result: GeocodeResult }
  | { ok: false; status: string };

function isGoogleMapsReady(): boolean {
  return typeof google !== "undefined" && Boolean(google.maps?.Geocoder);
}

export async function waitForGoogleMaps(timeoutMs = 15000): Promise<boolean> {
  if (isGoogleMapsReady()) {
    return true;
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (isGoogleMapsReady()) {
      return true;
    }
  }

  return false;
}

export async function geocodeWithGoogleMaps(
  query: string,
  language?: string,
): Promise<ClientGeocodeOutcome> {
  const ready = await waitForGoogleMaps();
  if (!ready) {
    return { ok: false, status: "MAPS_NOT_LOADED" };
  }

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address: normalizeLocationQuery(query),
        language: language ?? "fr",
      },
      (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK || !results?.[0]?.geometry?.location) {
          resolve({ ok: false, status });
          return;
        }

        const first = results[0];
        const location = first.geometry.location;

        resolve({
          ok: true,
          result: {
            location: { lat: location.lat(), lng: location.lng() },
            bounds: first.geometry.bounds ? boundsFromGoogle(first.geometry.bounds) : undefined,
            viewport: first.geometry.viewport ? boundsFromGoogle(first.geometry.viewport) : undefined,
            formattedAddress: first.formatted_address,
          },
        });
      },
    );
  });
}

export async function reverseGeocodeCity(
  lat: number,
  lng: number,
  language?: string,
): Promise<string | null> {
  const ready = await waitForGoogleMaps();
  if (!ready) {
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng }, language: language ?? "fr" }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) {
        resolve(null);
        return;
      }

      const components = results[0].address_components ?? [];
      const cityComponent = components.find((component) =>
        component.types.includes("locality"),
      );
      const fallbackCity = components.find((component) =>
        component.types.includes("administrative_area_level_2"),
      );
      resolve(cityComponent?.long_name ?? fallbackCity?.long_name ?? null);
    });
  });
}

export function geocodeStatusToMessageKey(status: string): string {
  if (status === "MAPS_NOT_LOADED") return "map.geocodeMapsLoading";
  if (status === "ZERO_RESULTS") return "map.cityNotFound";
  if (status === "REQUEST_DENIED") return "map.geocodeDenied";
  if (status === "OVER_QUERY_LIMIT") return "map.geocodeQuota";
  return "map.geocodeError";
}

export async function geocodePlaceById(
  map: google.maps.Map,
  placeId: string,
): Promise<ClientGeocodeOutcome> {
  const ready = await waitForGoogleMaps();
  if (!ready) {
    return { ok: false, status: "MAPS_NOT_LOADED" };
  }

  if (!google.maps.places?.PlacesService) {
    return { ok: false, status: "MAPS_NOT_LOADED" };
  }

  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(map);
    service.getDetails(
      { placeId, fields: ["geometry", "formatted_address", "name"] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          resolve({ ok: false, status });
          return;
        }

        const location = place.geometry.location;
        resolve({
          ok: true,
          result: {
            location: { lat: location.lat(), lng: location.lng() },
            bounds: place.geometry.bounds ? boundsFromGoogle(place.geometry.bounds) : undefined,
            viewport: place.geometry.viewport ? boundsFromGoogle(place.geometry.viewport) : undefined,
            formattedAddress: place.formatted_address,
          },
        });
      },
    );
  });
}
