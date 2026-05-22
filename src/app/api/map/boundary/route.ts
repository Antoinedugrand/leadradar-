import { NextResponse } from "next/server";
import { z } from "zod";

import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().min(1).max(400),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  countrycodes: z.string().max(20).optional(),
});

type LatLng = { lat: number; lng: number };

type NominatimItem = {
  geojson?: { type?: string; coordinates?: unknown };
};

const MAX_RING_POINTS = 2800;

function ringLngLatToPath(ring: number[][]): LatLng[] {
  const path = ring.map(([lng, lat]) => ({ lat, lng }));
  if (path.length > MAX_RING_POINTS) {
    const step = Math.ceil(path.length / MAX_RING_POINTS);
    return path.filter((_, i) => i % step === 0 || i === path.length - 1);
  }
  return path;
}

function polygonsFromGeoJson(geojson: {
  type?: string;
  coordinates?: unknown;
}): { paths: LatLng[][] }[] {
  const out: { paths: LatLng[][] }[] = [];

  if (geojson.type === "Polygon") {
    const coords = geojson.coordinates as number[][][] | undefined;
    if (!coords?.length) return out;
    const paths = coords.map((ring) => ringLngLatToPath(ring));
    out.push({ paths });
    return out;
  }

  if (geojson.type === "MultiPolygon") {
    const coords = geojson.coordinates as number[][][][] | undefined;
    if (!coords?.length) return out;
    for (const poly of coords) {
      if (!poly?.length) continue;
      const paths = poly.map((ring) => ringLngLatToPath(ring));
      out.push({ paths });
    }
    return out;
  }

  return out;
}

export async function GET(request: Request) {
  if (!enforceRateLimit("map-boundary")) {
    return NextResponse.json({ error: "Trop de requêtes, réessayez." }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    lat: url.searchParams.get("lat") ?? undefined,
    lng: url.searchParams.get("lng") ?? undefined,
    countrycodes: url.searchParams.get("countrycodes") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètre q invalide." }, { status: 400 });
  }

  const { q, lat, lng, countrycodes } = parsed.data;

  const nominatim = new URL("https://nominatim.openstreetmap.org/search");
  nominatim.searchParams.set("q", q);
  nominatim.searchParams.set("format", "json");
  nominatim.searchParams.set("polygon_geojson", "1");
  nominatim.searchParams.set("limit", "6");
  nominatim.searchParams.set("addressdetails", "0");
  if (countrycodes) {
    nominatim.searchParams.set("countrycodes", countrycodes);
  }
  if (lat !== undefined && lng !== undefined) {
    const delta = 0.12;
    const left = lng - delta;
    const right = lng + delta;
    const top = lat + delta;
    const bottom = lat - delta;
    nominatim.searchParams.set("viewbox", `${left},${top},${right},${bottom}`);
  }

  let response: Response;
  try {
    response = await fetch(nominatim.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "fr",
        "User-Agent": "LeadSite/1.0 (https://nominatim.org/usage-policy)",
      },
      next: { revalidate: 0 },
    });
  } catch {
    return NextResponse.json({ error: "Service de contours indisponible." }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Échec du service de contours." }, { status: 502 });
  }

  const items = (await response.json()) as NominatimItem[];
  if (!Array.isArray(items)) {
    return NextResponse.json({ polygons: [] as { paths: LatLng[][] }[] });
  }

  const polygons: { paths: LatLng[][] }[] = [];
  for (const item of items) {
    const gj = item.geojson;
    if (!gj?.type || !gj.coordinates) continue;
    polygons.push(...polygonsFromGeoJson(gj));
    break;
  }

  return NextResponse.json({ polygons });
}
