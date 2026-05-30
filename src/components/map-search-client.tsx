"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Circle, GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  Download,
  Filter,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Search,
  Zap,
} from "lucide-react";

import { AuditAllButton } from "@/components/audit-all-button";
import { CityPlaceAutocomplete } from "@/components/app/city-place-autocomplete";
import { MapAiDraftCard } from "@/components/app/map-ai-draft-card";
import { MapMiniStat } from "@/components/app/map-mini-stat";
import { MapProspectRow } from "@/components/app/map-prospect-row";
import { MapZoneCard } from "@/components/app/map-zone-card";
import { LOCALE_BCP47, PLACE_TYPE_VALUES, placeTypeLabel } from "@/lib/i18n";
import { geocodePlaceById, geocodeStatusToMessageKey, geocodeWithGoogleMaps, reverseGeocodeCity } from "@/lib/google-maps/client-geocode";
import { placesSearchErrorMessageKey, searchPlacesInArea } from "@/lib/google-maps/client-places-search";
import { normalizeLocationQuery, radiusKmForCityBounds } from "@/lib/geo-search";
import { useLocale } from "@/lib/i18n/locale-provider";
import { downloadProspectsExcel } from "@/lib/export-prospects";
import { getDisplayScore, sortProspectsByScore } from "@/lib/prospect-scorer";
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
  details?: string;
  count?: number;
  data?: MapProspect[];
  prospects?: Prospect[];
}

function fitMapToBounds(map: google.maps.Map, bounds: google.maps.LatLngBounds) {
  map.fitBounds(bounds, { top: 40, right: 408, bottom: 180, left: 332 });
  google.maps.event.addListenerOnce(map, "idle", () => {
    const z = map.getZoom();
    if (z !== undefined && z > 17) {
      map.setZoom(17);
    }
  });
}

function radiusPercent(km: number): number {
  return ((km - MIN_RADIUS_KM) / (MAX_RADIUS_KM - MIN_RADIUS_KM)) * 100;
}

function markerTierColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score <= 30) return "#ef4444";
  if (score <= 60) return "#f59e0b";
  return "#06b6d4";
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
  const selectedPlaceIdRef = useRef<string | null>(null);
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
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: false,
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

  const filterBase = useMemo(() => {
    if (!onlyAuditedBelow50) return listProspects;
    return listProspects.filter((prospect) => {
      const score = getDisplayScore(prospect);
      return score !== null && score < lowScoreFilterMax;
    });
  }, [listProspects, onlyAuditedBelow50]);

  const filterCounts = useMemo(
    () => ({
      all: filterBase.length,
      "to-contact": filterBase.filter((p) => p.status === "new" || p.status === "audited").length,
      "no-site": filterBase.filter((p) => !p.website_exists || !p.website_url).length,
      "bad-site": filterBase.filter((p) => isHotProspect(p)).length,
      "not-audited": filterBase.filter(
        (p) => p.website_exists && p.website_url && getDisplayScore(p) === null,
      ).length,
    }),
    [filterBase],
  );

  const selectedProspect = useMemo(
    () => filteredListProspects.find((p) => p.id === selectedProspectId) ?? null,
    [filteredListProspects, selectedProspectId],
  );

  useEffect(() => {
    if (filteredListProspects.length === 0) {
      setSelectedProspectId(null);
      return;
    }
    if (!selectedProspectId || !filteredListProspects.some((p) => p.id === selectedProspectId)) {
      setSelectedProspectId(filteredListProspects[0].id);
    }
  }, [filteredListProspects, selectedProspectId]);

  const radiusLabel =
    radiusKm < 1
      ? t("map.radiusMeters", { m: Math.round(radiusKm * 1000) })
      : t("map.radiusKm", {
          km: radiusKm.toLocaleString(LOCALE_BCP47[locale], {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }),
        });

  const sliderPercent = radiusPercent(radiusKm);

  function adjustZoom(delta: number) {
    const map = mapRef.current;
    if (!map) return;
    const current = map.getZoom() ?? 12;
    map.setZoom(Math.min(Math.max(current + delta, 2), 20));
  }

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
    placeId?: string | null,
  ): Promise<
    | { ok: true; location: { lat: number; lng: number }; radiusKm: number }
    | { ok: false; message: string }
  > {
    let clientOutcome;

    const map = mapRef.current;
    if (placeId && map && isLoaded) {
      clientOutcome = await geocodePlaceById(map, placeId);
    } else {
      const normalizedQuery = normalizeLocationQuery(query);
      clientOutcome = await geocodeWithGoogleMaps(normalizedQuery, locale);
    }

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
      const geocoded = await geocodeCity(locationQuery, selectedPlaceIdRef.current);
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
          setMessage(t("map.enrichingContacts"));
          const ingestResponse = await fetch("/api/search/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prospects: clientSearch.prospects }),
          });
          payload = (await ingestResponse.json()) as AreaSearchPayload;
          if (!ingestResponse.ok) {
            const detail = payload?.details ? ` (${payload.details})` : "";
            setMessage(`${payload?.error ?? t("map.areaSearchError")}${detail}`);
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
    const list = filterBase;
    return {
      total: list.length,
      noSite: list.filter((p) => !p.website_exists).length,
      hot: list.filter((p) => isHotProspect(p)).length,
      contacted: listProspects.filter(
        (p) => p.status === "emailed" || p.status === "replied" || p.status === "converted",
      ).length,
    };
  }, [filterBase, listProspects]);

  const showAiDraft =
    selectedProspect &&
    (selectedProspect.review_insights?.summary ||
      selectedProspect.audit_summary ||
      selectedProspect.generated_site_html);

  return (
    <div className="lr-map-layout">
      <div className="lr-map-canvas relative min-w-0 flex-1">
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
                        fillColor: markerTierColor(score),
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
                    fillColor: "#06b6d4",
                    fillOpacity: 0.07,
                    strokeColor: "rgba(6,182,212,0.45)",
                    strokeWeight: 1.5,
                  }}
                />
              ) : null}
            </GoogleMap>
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--slate-100)] text-sm text-[var(--slate-500)]">
              {loadError ? t("map.mapsLoadError") : t("map.mapsLoadingHint")}
            </div>
          )}
        </div>

        {isLoaded ? (
          <div className="lr-map-zoom-controls" style={{ left: hasLaunchedSearch ? 332 : 16 }}>
            <button type="button" className="lr-btn lr-btn-icon" onClick={() => adjustZoom(1)} aria-label="Zoom in">
              <Plus size={16} />
            </button>
            <div className="h-px bg-[var(--slate-100)]" />
            <button type="button" className="lr-btn lr-btn-icon" onClick={() => adjustZoom(-1)} aria-label="Zoom out">
              <Minus size={16} />
            </button>
          </div>
        ) : null}

        {hasLaunchedSearch && listProspects.length > 0 ? (
          <MapZoneCard prospects={listProspects} />
        ) : null}

        {showAiDraft && selectedProspect ? <MapAiDraftCard prospect={selectedProspect} /> : null}

        <aside
          className={cn("lr-map-panel", hasLaunchedSearch && "lr-map-panel-expanded")}
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            width: 300,
            zIndex: 10,
          }}
          aria-label={t("map.ariaLabel")}
        >
          <div className="lr-map-panel-head">
            <div className="flex items-center gap-2">
              <span className="lr-map-panel-head-icon">
                <MapPin size={14} />
              </span>
              <div className="lr-map-panel-head-title">{t("nav.search")}</div>
            </div>
            <p className="lr-map-panel-head-hint">
              {hasLaunchedSearch ? t("map.panelHint") : t("map.hintStart")}
            </p>
          </div>

          <div className={cn("lr-map-panel-body", hasLaunchedSearch && "lr-map-panel-scroll")}>
            <div className="lr-map-panel-section">
              <form onSubmit={handleCitySearch}>
                <label htmlFor="map-city" className="lr-label">
                  {t("map.locationLabel")}
                </label>
                <CityPlaceAutocomplete
                  id="map-city"
                  value={locationQuery}
                  onChange={(nextValue) => {
                    setLocationQuery(nextValue);
                    selectedPlaceIdRef.current = null;
                  }}
                  onSelect={(selection) => {
                    selectedPlaceIdRef.current = selection.placeId;
                  }}
                  placeholder={t("map.locationPlaceholderShort")}
                  disabled={!isLoaded || Boolean(loadError)}
                  icon={<Search size={13} />}
                />
                <p className="lr-hint">{t("map.cityHint")}</p>
                <button
                  type="submit"
                  disabled={
                    !isLoaded ||
                    Boolean(loadError) ||
                    isGeocoding ||
                    isSearching ||
                    isScoring ||
                    !locationQuery.trim()
                  }
                  className="lr-btn lr-btn-gradient lr-map-panel-submit w-full justify-center"
                >
                  {isGeocoding || isSearching || isScoring ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Search size={13} />
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
                </button>
              </form>

              {message ? (
                <p className="lr-map-panel-message">{message}</p>
              ) : null}
            </div>

            {hasLaunchedSearch ? (
              <>
                <div className="lr-map-panel-section">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="lr-label m-0">{t("map.radius")}</label>
                    <span className="lr-mono text-xs text-[var(--slate-700)]">{radiusLabel}</span>
                  </div>
                  <div className="lr-slider">
                    <input
                      type="range"
                      min={MIN_RADIUS_KM}
                      max={MAX_RADIUS_KM}
                      step={0.01}
                      value={radiusKm}
                      onChange={(event) => setRadiusKm(Number(event.target.value))}
                      className="absolute inset-0 z-[2] h-full w-full cursor-pointer opacity-0"
                      aria-label={t("map.radius")}
                    />
                    <div className="lr-slider-track">
                      <div className="lr-slider-fill" style={{ width: `${sliderPercent}%` }} />
                      <div className="lr-slider-thumb" style={{ left: `${sliderPercent}%` }} />
                    </div>
                  </div>
                  <div className="lr-mono mt-1.5 flex justify-between text-[10px] text-[var(--slate-400)]">
                    <span>50m</span>
                    <span>30 km</span>
                  </div>

                  <label className="lr-label mt-3.5">{t("map.placeType")}</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PLACE_TYPE_VALUES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedPlaceType(value)}
                        className={cn(
                          "lr-pill lr-pill-compact",
                          selectedPlaceType === value && "active",
                        )}
                      >
                        {placeTypeLabel(t, value)}
                      </button>
                    ))}
                  </div>

                  <label
                    className={cn("lr-check mt-3.5", onlyAuditedBelow50 && "checked")}
                    onClick={() => setOnlyAuditedBelow50((prev) => !prev)}
                  >
                    <span className="lr-check-box" aria-hidden>
                      {onlyAuditedBelow50 ? "✓" : ""}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={onlyAuditedBelow50}
                      onChange={(event) => setOnlyAuditedBelow50(event.target.checked)}
                    />
                    {t("map.filterLowScore", { max: lowScoreFilterMax })}
                  </label>

                  <button
                    type="button"
                    onClick={() => void runAreaSearch()}
                    disabled={isSearching || isScoring}
                    className="lr-btn lr-btn-gradient mt-3.5 w-full justify-center"
                  >
                    {isSearching || isScoring ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Zap size={15} />
                    )}
                    {t("map.refresh")}
                  </button>
                </div>

                {listProspects.length > 0 ? (
                  <div className="lr-map-panel-section lr-map-panel-section-compact">
                    <p className="mb-2 text-[10px] text-[var(--slate-500)]">
                      {t("map.resultsFound", { count: filterBase.length })}
                    </p>

                    <div className="lr-map-panel-stats">
                      <MapMiniStat compact label={t("map.statTotal")} value={stats.total} />
                      <MapMiniStat compact label={t("map.statNoSite")} value={stats.noSite} tone="danger" />
                      <MapMiniStat compact label={t("map.statHot")} value={stats.hot} tone="hot" />
                      <MapMiniStat
                        compact
                        label={t("map.statContacted")}
                        value={stats.contacted}
                        tone="success"
                      />
                    </div>

                    <AuditAllButton
                      prospects={listProspects}
                      onCompleted={() => void runAreaSearch()}
                      leadRadar
                      className="mt-2 w-full justify-center"
                    />

                    <div className="lr-map-panel-filters mt-2">
                      {(
                        [
                          { v: "all" as const, l: t("map.filterAll"), dot: null },
                          { v: "to-contact" as const, l: t("map.filterToContact"), dot: null },
                          { v: "no-site" as const, l: t("map.filterNoSite"), dot: null },
                          { v: "bad-site" as const, l: t("map.filterHot"), dot: "#EF4444" },
                          { v: "not-audited" as const, l: t("map.filterNotAudited"), dot: null },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.v}
                          type="button"
                          onClick={() => setFilter(f.v)}
                          className={cn("lr-pill lr-pill-compact", filter === f.v && "active")}
                        >
                          {f.dot ? (
                            <span
                              className="mr-1 inline-block h-[5px] w-[5px] rounded-full"
                              style={{ background: f.dot }}
                            />
                          ) : null}
                          {f.l}{" "}
                          <span className="lr-pill-count">{filterCounts[f.v]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="lr-map-panel-section">
                    <p className="text-xs leading-relaxed text-[var(--slate-500)]">{t("map.emptyZone")}</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </aside>
      </div>

      {hasLaunchedSearch ? (
      <aside className="lr-map-prospect-panel" aria-label={t("map.prospectsTitle")}>
        <div className="border-b border-[var(--slate-100)] px-5 py-[18px]">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <div
                className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--slate-900)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t("map.prospectsTitle")}
              </div>
              <div className="text-xs text-[var(--slate-500)]">
                {t("map.sortedByPotential", { count: filteredListProspects.length })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={filteredListProspects.length === 0}
              onClick={() =>
                downloadProspectsExcel(
                  filteredListProspects,
                  `carte_${locationQuery || "zone"}`,
                  locale,
                )
              }
              className="lr-btn lr-btn-secondary lr-btn-sm"
            >
              <Download size={13} />
              {t("export.button", { count: filteredListProspects.length })}
            </button>
            <button type="button" className="lr-btn lr-btn-ghost lr-btn-sm" disabled title={t("map.sortedByPotential", { count: filteredListProspects.length })}>
              <Filter size={13} />
              {t("map.sortLabel")}
            </button>
          </div>
        </div>

        <div className="lr-map-panel-scroll">
          {filteredListProspects.length > 0 ? (
            filteredListProspects.map((prospect) => (
              <MapProspectRow
                key={prospect.id}
                prospect={prospect}
                selected={prospect.id === selectedProspectId}
                onSelect={() => setSelectedProspectId(prospect.id)}
              />
            ))
          ) : (
            <div className="px-5 py-8 text-center text-xs text-[var(--slate-500)]">
              {hasLaunchedSearch ? t("map.emptyZone") : t("map.emptyStart")}
            </div>
          )}
        </div>

        {filteredListProspects.length > 0 ? (
          <div className="flex items-center justify-between border-t border-[var(--slate-100)] bg-[var(--slate-50)] px-5 py-2.5 text-[11px] text-[var(--slate-500)]">
            <span>
              {t("map.shownOf", {
                shown: filteredListProspects.length,
                total: filterBase.length,
              })}
            </span>
            <Link href="/prospects" className="font-semibold text-[var(--indigo)]">
              {t("map.viewAll")}
            </Link>
          </div>
        ) : null}
      </aside>
      ) : null}
    </div>
  );
}
