"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Circle, GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  ExternalLink,
  Globe,
  GlobeLock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";

import { AuditAllButton } from "@/components/audit-all-button";
import { AuditProspectButton } from "@/components/audit-prospect-button";
import { ContactToggleButton } from "@/components/contact-toggle-button";
import { EmailCell } from "@/components/email-cell";
import { EmailDialog } from "@/components/email-dialog";
import { GenerateSiteDialog } from "@/components/generate-site-dialog";
import { FetchReviewsButton } from "@/components/fetch-reviews-button";
import { ProspectReviewInsights } from "@/components/prospect-review-insights";
import { ExportProspectsButton } from "@/components/export-prospects-button";
import { GoogleRatingBadge } from "@/components/google-rating-badge";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { PLACE_TYPE_VALUES, placeTypeLabel } from "@/lib/i18n";
import { geocodeStatusToMessageKey, geocodeWithGoogleMaps, reverseGeocodeCity } from "@/lib/google-maps/client-geocode";
import { placesSearchErrorMessageKey, searchPlacesInArea } from "@/lib/google-maps/client-places-search";
import { normalizeLocationQuery, radiusKmForCityBounds } from "@/lib/geo-search";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getDisplayScore, sortProspectsByScore } from "@/lib/prospect-scorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Prospect } from "@/lib/types";

const mapContainerStyle = { width: "100%", height: "100%" };
const libraries: ["places"] = ["places"];

const worldMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#eef2f7" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfe4ff" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0f4c81" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e9efe5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4e8c4" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
];

const defaultCenter = { lat: 10, lng: -10 };

const MIN_RADIUS_KM = 0.05;
const MAX_RADIUS_KM = 30;
const ENCLOSURE_MARGIN = 1.08;
const hotScoreThreshold = 30;
const lowScoreFilterMax = 50;
const DEFAULT_RADIUS_KM = 2;


function haversineMeters(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): number {
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

function clampRadiusKm(km: number): number {
  return Math.min(Math.max(km, MIN_RADIUS_KM), MAX_RADIUS_KM);
}

function circleEnclosingBounds(box: {
  northeast: google.maps.LatLngLiteral;
  southwest: google.maps.LatLngLiteral;
}): { center: google.maps.LatLngLiteral; radiusKm: number } {
  const ne = box.northeast;
  const sw = box.southwest;
  const center: google.maps.LatLngLiteral = {
    lat: (ne.lat + sw.lat) / 2,
    lng: (ne.lng + sw.lng) / 2,
  };
  const corners: google.maps.LatLngLiteral[] = [
    { lat: ne.lat, lng: ne.lng },
    { lat: ne.lat, lng: sw.lng },
    { lat: sw.lat, lng: ne.lng },
    { lat: sw.lat, lng: sw.lng },
  ];
  let maxM = 0;
  for (const p of corners) {
    maxM = Math.max(maxM, haversineMeters(center, p));
  }
  return { center, radiusKm: clampRadiusKm((maxM * ENCLOSURE_MARGIN) / 1000) };
}

interface MapProspect {
  google_place_id: string;
  name: string;
  address: string | null;
  website_url: string | null;
  lat: number | null;
  lng: number | null;
  audit_score: number | null;
  prospect_score: number | null;
}

function shortMapLabel(name: string): string {
  const cleaned = name.trim();
  if (cleaned.length <= 12) {
    return cleaned;
  }
  return `${cleaned.slice(0, 12)}…`;
}

interface MapSearchClientProps {
  mapsApiKey: string;
}

interface AreaSearchPayload {
  message?: string;
  error?: string;
  count?: number;
  data?: MapProspect[];
  prospects?: Prospect[];
}

function fitMapToBounds(map: google.maps.Map, bounds: google.maps.LatLngBounds) {
  map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 360 });
  google.maps.event.addListenerOnce(map, "idle", () => {
    const z = map.getZoom();
    if (z !== undefined && z > 17) {
      map.setZoom(17);
    }
  });
}

export function MapSearchClient({ mapsApiKey }: MapSearchClientProps) {
  const { t, locale } = useLocale();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "leadsite-google-maps",
    googleMapsApiKey: mapsApiKey,
    libraries,
  });
  const mapRef = useRef<google.maps.Map | null>(null);
  const hasManualCenterRef = useRef(false);
  const hasAutoLocatedRef = useRef(false);
  const [center, setCenter] = useState(defaultCenter);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedPlaceType, setSelectedPlaceType] = useState<string>("restaurant");
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  /** Après le premier « Chercher » : affiche rayon, type, filtres et déplacement sur la carte. */
  const [hasLaunchedSearch, setHasLaunchedSearch] = useState(false);
  const [onlyAuditedBelow50, setOnlyAuditedBelow50] = useState(false);
  const [mapProspects, setMapProspects] = useState<MapProspect[]>([]);
  const [listProspects, setListProspects] = useState<Prospect[]>([]);
  const [filter, setFilter] = useState<"all" | "to-contact" | "no-site" | "bad-site" | "not-audited">(
    "to-contact",
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: worldMapStyle,
      minZoom: 2,
    }),
    [],
  );

  function isHotProspect(p: Prospect): boolean {
    const score = getDisplayScore(p);
    if (score !== null) return score <= 30;
    return !p.website_exists || !p.website_url;
  }

  const filteredListProspects = useMemo(() => {
    let list = listProspects;
    if (onlyAuditedBelow50) {
      list = list.filter((prospect) => {
        const score = getDisplayScore(prospect);
        return score !== null && score < lowScoreFilterMax;
      });
    }
    if (filter === "to-contact") {
      list = list.filter((p) => p.status === "new" || p.status === "audited");
    } else if (filter === "no-site") {
      list = list.filter((p) => !p.website_exists || !p.website_url);
    } else if (filter === "bad-site") {
      list = list.filter((p) => isHotProspect(p));
    } else if (filter === "not-audited") {
      list = list.filter(
        (p) => p.website_exists && p.website_url && getDisplayScore(p) === null,
      );
    }
    return sortProspectsByScore(list);
  }, [listProspects, onlyAuditedBelow50, filter]);
  const filteredMapProspects = useMemo(() => {
    if (!onlyAuditedBelow50) {
      return mapProspects;
    }
    const allowedIds = new Set(filteredListProspects.map((prospect) => prospect.google_place_id));
    return mapProspects.filter((prospect) => allowedIds.has(prospect.google_place_id));
  }, [mapProspects, onlyAuditedBelow50, filteredListProspects]);

  useEffect(() => {
    if (!isLoaded || hasAutoLocatedRef.current) return;
    hasAutoLocatedRef.current = true;

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (hasManualCenterRef.current) return;

        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCenter(nextCenter);
        setMessage(t("map.positionAuto"));

        const map = mapRef.current;
        if (map) {
          map.panTo(nextCenter);
          map.setZoom(13);
        }

        try {
          const cityName = await reverseGeocodeCity(nextCenter.lat, nextCenter.lng, locale);
          if (cityName && !hasManualCenterRef.current) {
            setLocationQuery(cityName);
            setMessage(t("map.positionCity", { city: cityName }));
          }
        } catch {
          // ignore
        }
      },
      () => {
        // ignore
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 },
    );
  }, [isLoaded, locale, t]);

  async function geocodeCity(
    query: string,
  ): Promise<
    | { ok: true; location: { lat: number; lng: number }; radiusKm: number }
    | { ok: false; message: string }
  > {
    const normalizedQuery = normalizeLocationQuery(query);
    const clientOutcome = await geocodeWithGoogleMaps(normalizedQuery, locale);

    if (!clientOutcome.ok) {
      const messageKey = geocodeStatusToMessageKey(clientOutcome.status);
      return { ok: false, message: t(messageKey as Parameters<typeof t>[0]) };
    }

    const location = clientOutcome.result.location;
    const box = clientOutcome.result.bounds ?? clientOutcome.result.viewport;
    const nextRadiusKm = box ? radiusKmForCityBounds(box).radiusKm : DEFAULT_RADIUS_KM;

    hasManualCenterRef.current = true;
    setCenter(location);
    setRadiusKm(nextRadiusKm);

    const map = mapRef.current;
    if (map) {
      if (box?.northeast && box?.southwest) {
        const bounds = new google.maps.LatLngBounds(
          { lat: box.southwest.lat, lng: box.southwest.lng },
          { lat: box.northeast.lat, lng: box.northeast.lng },
        );
        fitMapToBounds(map, bounds);
      } else {
        map.panTo(location);
        map.setZoom(14);
      }
    }

    return { ok: true, location, radiusKm: nextRadiusKm };
  }

  async function handleCitySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!locationQuery.trim()) return;

    setIsGeocoding(true);
    setMessage(null);
    try {
      const geocoded = await geocodeCity(locationQuery);
      if (!geocoded.ok) {
        setMessage(geocoded.message);
        return;
      }

      setHasLaunchedSearch(true);
      setMessage(t("map.zoneCentered", { query: locationQuery.trim() }));
      await runAreaSearch({
        lat: geocoded.location.lat,
        lng: geocoded.location.lng,
        radiusKm: geocoded.radiusKm,
      });
    } catch {
      setMessage(t("map.geocodeError"));
    } finally {
      setIsGeocoding(false);
    }
  }

  async function runAreaSearch(override?: { lat: number; lng: number; radiusKm?: number }) {
    setIsSearching(true);
    setMessage(null);
    const searchLat = override?.lat ?? center.lat;
    const searchLng = override?.lng ?? center.lng;
    const searchRadiusKm = override?.radiusKm ?? radiusKm;
    const types = [selectedPlaceType.trim()].filter((type) => type.length > 0);
    try {
      let payload: AreaSearchPayload | null = null;

      const map = mapRef.current;
      if (map && isLoaded) {
        const clientSearch = await searchPlacesInArea({
          map,
          lat: searchLat,
          lng: searchLng,
          radiusKm: searchRadiusKm,
          placeTypes: types,
        });

        if (clientSearch.error) {
          const errorKey = placesSearchErrorMessageKey(clientSearch.error);
          setMessage(t(errorKey as Parameters<typeof t>[0]));
          return;
        }

        if (clientSearch.prospects.length > 0) {
          const ingestResponse = await fetch("/api/search/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prospects: clientSearch.prospects }),
          });
          payload = (await ingestResponse.json()) as AreaSearchPayload;
          if (!ingestResponse.ok) {
            setMessage(payload?.error ?? t("map.areaSearchError"));
            return;
          }
        } else {
          payload = {
            message: t("map.searchDone"),
            count: 0,
            data: [],
            prospects: [],
          };
        }
      } else {
        setMessage(t("map.geocodeMapsLoading"));
        return;
      }

      if (!payload) {
        setMessage(t("map.areaSearchError"));
        return;
      }

      const nextProspects = payload.data ?? [];
      const initialProspects = payload.prospects ?? [];
      setMapProspects(nextProspects);
      setListProspects(initialProspects);

      if (initialProspects.length > 0) {
        setIsScoring(true);
        setMessage(t("map.searchDoneScoring"));
        try {
          const scoreResponse = await fetch("/api/prospects/score-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prospectIds: initialProspects.map((prospect) => prospect.id),
            }),
          });
          const scoredPayload = (await scoreResponse.json()) as {
            error?: string;
            prospects?: Prospect[];
          };
          if (scoreResponse.ok && scoredPayload.prospects) {
            setListProspects(scoredPayload.prospects);
            const scoreByPlaceId = new Map(
              scoredPayload.prospects.map((prospect) => [
                prospect.google_place_id,
                {
                  prospect_score: prospect.prospect_score,
                  audit_score: prospect.audit_score,
                },
              ]),
            );
            setMapProspects(
              nextProspects.map((marker) => {
                const scores = scoreByPlaceId.get(marker.google_place_id);
                return {
                  ...marker,
                  prospect_score: scores?.prospect_score ?? null,
                  audit_score: scores?.audit_score ?? marker.audit_score,
                };
              }),
            );
          }
        } catch {
          setMessage(t("map.scoringFailed"));
        } finally {
          setIsScoring(false);
        }
      }

      const validPositions = nextProspects.filter(
        (prospect) => prospect.lat !== null && prospect.lng !== null,
      );
      if (mapRef.current && validPositions.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        validPositions.forEach((prospect) => {
          bounds.extend({ lat: prospect.lat as number, lng: prospect.lng as number });
        });
        mapRef.current.fitBounds(bounds);
      }

      setMessage(
        `${payload.message ?? t("map.searchDone")} ${t("map.found", { count: payload.count ?? 0 })}`,
      );
    } catch {
      setMessage(t("map.networkError"));
    } finally {
      setIsSearching(false);
    }
  }

  const stats = useMemo(() => {
    const list = filteredListProspects;
    const full = listProspects;
    return {
      total: list.length,
      noSite: list.filter((p) => !p.website_exists).length,
      hot: list.filter((p) => isHotProspect(p)).length,
      contacted: full.filter(
        (p) => p.status === "emailed" || p.status === "replied" || p.status === "converted",
      ).length,
    };
  }, [filteredListProspects, listProspects]);

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 bg-muted">
      <div className="absolute inset-0">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={3}
            options={mapOptions}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onClick={(event) => {
              if (!hasLaunchedSearch || !event.latLng) return;
              hasManualCenterRef.current = true;
              setCenter({ lat: event.latLng.lat(), lng: event.latLng.lng() });
              setMessage(t("map.centerMoved"));
            }}
          >
            <Marker position={center} />
            {filteredMapProspects
              .filter((prospect) => prospect.lat !== null && prospect.lng !== null)
              .map((prospect) => {
                const score = prospect.prospect_score ?? prospect.audit_score;
                const fillColor =
                  score === null
                    ? "#9ca3af"
                    : score <= 30
                      ? "#dc2626"
                      : score <= 60
                        ? "#f59e0b"
                        : "#16a34a";
                return (
                  <Marker
                    key={`${prospect.name}-${prospect.lat}-${prospect.lng}`}
                    position={{ lat: prospect.lat as number, lng: prospect.lng as number }}
                    title={prospect.name}
                    label={{
                      text: shortMapLabel(prospect.name),
                      color: "#0f172a",
                      fontSize: "10px",
                      fontWeight: "700",
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor,
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                      scale: 10,
                    }}
                  />
                );
              })}
            {hasLaunchedSearch ? (
              <Circle
                center={center}
                radius={radiusKm * 1000}
                options={{
                  fillColor: "oklch(0.62 0.22 30)",
                  fillOpacity: 0.1,
                  strokeColor: "oklch(0.62 0.22 30)",
                  strokeWeight: 2,
                }}
              />
            ) : null}
          </GoogleMap>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
            {loadError ? t("map.mapsLoadError") : t("map.mapsLoadingHint")}
          </div>
        )}
      </div>

      <aside
        className="absolute bottom-3 left-3 top-3 z-10 flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur"
        style={{ boxShadow: "var(--shadow-elegant)" }}
        aria-label={t("map.ariaLabel")}
      >
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">{t("nav.search")}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">
                {hasLaunchedSearch
                  ? t("map.hintRefine")
                  : t("map.hintStart")}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3">
          <form onSubmit={handleCitySearch} className="space-y-3">
            <div>
              <label htmlFor="map-city" className="text-xs font-medium text-foreground">
                {t("map.locationLabel")}
              </label>
              <Input
                id="map-city"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder={t("map.locationPlaceholder")}
                className="mt-1.5"
              />
            </div>
            <Button
              type="submit"
              disabled={
                !isLoaded ||
                Boolean(loadError) ||
                isGeocoding ||
                isSearching ||
                isScoring ||
                !locationQuery.trim()
              }
              className="w-full gap-2"
            >
              {isGeocoding || isSearching || isScoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {!isLoaded
                ? t("map.mapsLoadingHint")
                : isGeocoding
                  ? t("map.locating")
                  : isSearching || isScoring
                    ? isScoring
                      ? t("map.scoring")
                      : t("map.searching")
                    : hasLaunchedSearch
                      ? t("map.searchAgain")
                      : t("map.search")}
            </Button>
          </form>

          {message ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{message}</p>
          ) : null}

          {hasLaunchedSearch ? (
            <div className="mt-5 space-y-4 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("map.refineZone")}
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{t("map.radius")}</span>
                  <span className="font-semibold text-primary">
                    {radiusKm < 1
                      ? t("map.radiusMeters", { m: Math.round(radiusKm * 1000) })
                      : t("map.radiusKm", { km: radiusKm.toFixed(2) })}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_RADIUS_KM}
                  max={MAX_RADIUS_KM}
                  step={0.01}
                  value={radiusKm}
                  onChange={(event) => setRadiusKm(Number(event.target.value))}
                  className="w-full accent-[oklch(0.62_0.22_30)]"
                />
                <p className="text-[10px] text-muted-foreground">
                  {t("map.clickToMove")}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-foreground">{t("map.placeType")}</span>
                        <div className="flex flex-wrap gap-1.5">
                  {PLACE_TYPE_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedPlaceType(value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        selectedPlaceType === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {placeTypeLabel(t, value)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <input
                  type="checkbox"
                  checked={onlyAuditedBelow50}
                  onChange={(event) => setOnlyAuditedBelow50(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[oklch(0.62_0.22_30)]"
                />
                <span className="text-xs leading-relaxed text-foreground">
                  {t("map.filterLowScore", { max: lowScoreFilterMax })}
                  <span className="block text-muted-foreground">
                    {t("map.filterLowScoreHint")}
                  </span>
                </span>
              </label>

              <Button
                type="button"
                onClick={() => void runAreaSearch()}
                disabled={isSearching || isScoring}
                variant="outline"
                className="w-full gap-2"
              >
                {isSearching || isScoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {t("map.refresh")}
              </Button>
            </div>
          ) : null}

          {hasLaunchedSearch && listProspects.length > 0 ? (
            <AuditAllButton
              prospects={listProspects}
              onCompleted={() => void runAreaSearch()}
              className="mt-3 w-full"
            />
          ) : null}

          {listProspects.length > 0 ? (
            <>
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                <Stat label={t("map.statTotal")} value={stats.total} />
                <Stat label={t("map.statNoSite")} value={stats.noSite} accent="destructive" />
                <Stat label={t("map.statHot")} value={stats.hot} accent="primary" />
                <Stat label={t("map.statContacted")} value={stats.contacted} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {(
                  [
                    { v: "all", l: t("map.filterAll") },
                    { v: "to-contact", l: t("map.filterToContact") },
                    { v: "no-site", l: t("map.filterNoSite") },
                    { v: "bad-site", l: t("map.filterHot") },
                    { v: "not-audited", l: t("map.filterNotAudited") },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setFilter(f.v)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      filter === f.v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {f.l}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("map.prospects", { count: filteredListProspects.length })}
                  </p>
                  <ExportProspectsButton
                    prospects={filteredListProspects}
                    filenameBase={`carte_${locationQuery || "zone"}`}
                    className="h-7 text-[10px]"
                  />
                </div>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
                  {filteredListProspects.map((p) => {
                    const verdict = !p.website_exists
                      ? t("verdict.noWebsite")
                      : (p.audit_summary ??
                        (p.audit_issues && p.audit_issues.length > 0 ? p.audit_issues[0] : null));
                    return (
                      <li key={p.id} className="p-3 text-xs hover:bg-accent/30">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                              <GoogleRatingBadge
                                rating={p.google_rating}
                                reviewCount={p.google_review_count}
                              />
                              <ProspectScoreBadge prospect={p} />
                            </div>
                            {p.address ? (
                              <p className="mt-0.5 truncate text-muted-foreground">{p.address}</p>
                            ) : null}
                            {p.review_insights ? (
                              <ProspectReviewInsights
                                insights={p.review_insights}
                                compact
                              />
                            ) : verdict ? (
                              <p className="mt-1.5 line-clamp-2 italic text-foreground/80">
                                « {verdict} »
                              </p>
                            ) : null}
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                              {p.website_url ? (
                                <a
                                  href={`/visit?url=${encodeURIComponent(p.website_url)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Globe className="h-3 w-3" /> {t("common.site")}{" "}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-medium text-destructive">
                                  <GlobeLock className="h-3 w-3" /> {t("common.noSite")}
                                </span>
                              )}
                              {p.phone ? (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {p.phone}
                                </span>
                              ) : null}
                              {p.email ? (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <EmailCell email={p.email} />
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <ContactToggleButton
                              prospectId={p.id}
                              status={p.status}
                              hasAudit={Boolean(p.audit_score)}
                              onStatusChange={(nextStatus) => {
                                setListProspects((prev) =>
                                  prev.map((row) =>
                                    row.id === p.id ? { ...row, status: nextStatus } : row,
                                  ),
                                );
                              }}
                            />
                            <AuditProspectButton
                              prospectId={p.id}
                              websiteUrl={p.website_url}
                            />
                            <FetchReviewsButton
                              prospectId={p.id}
                              googlePlaceId={p.google_place_id}
                              onInsightsReady={(insights) => {
                                setListProspects((prev) =>
                                  prev.map((row) =>
                                    row.id === p.id ? { ...row, review_insights: insights } : row,
                                  ),
                                );
                              }}
                            />
                            {!p.website_exists || !p.website_url ? (
                              <GenerateSiteDialog
                                prospect={p}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1 text-[11px]"
                                  >
                                    <Globe className="h-3 w-3" /> {t("siteGen.button")}
                                  </Button>
                                }
                              />
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {p.status === "new" ? t("common.new") : p.status === "audited" ? t("common.audited") : p.status}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <EmailDialog
                              prospect={p}
                              trigger={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 gap-1 text-[11px]"
                                >
                                  <Mail className="h-3 w-3" /> {t("map.emailAi")}
                                </Button>
                              }
                            />
                            <Link
                              href={`/prospects/${p.id}/detail`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                            >
                              {t("common.details")} <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          ) : (
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              {hasLaunchedSearch
                ? t("map.emptyZone")
                : t("map.emptyStart")}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "destructive" | "primary";
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-2 py-1.5">
      <div
        className={cn(
          "text-base font-bold leading-none",
          accent === "destructive"
            ? "text-destructive"
            : accent === "primary"
              ? "text-primary"
              : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
