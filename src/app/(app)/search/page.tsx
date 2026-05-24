"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import { AppTopbar } from "@/components/app/app-topbar";
import { ProspectsResultsTable } from "@/components/prospects-results-table";
import { PLACE_TYPE_VALUES, placeTypeLabel } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { Prospect } from "@/lib/types";

export default function SearchPage() {
  const { t } = useLocale();
  const [location, setLocation] = useState("");
  const [selectedPlaceType, setSelectedPlaceType] = useState("restaurant");
  const [customTypes, setCustomTypes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const types = customTypes.trim()
        ? customTypes
            .split(",")
            .map((type) => type.trim())
            .filter((type) => type.length > 0)
        : [selectedPlaceType];

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, placeTypes: types }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
        details?: string;
        count?: number;
        prospects?: Prospect[];
      };
      if (!response.ok) {
        const detailedError = data.details ? `${data.error} (${data.details})` : data.error;
        setMessage(detailedError ?? t("search.error"));
        setProspects([]);
        return;
      }

      const nextProspects = data.prospects ?? [];
      setProspects(nextProspects);
      setMessage(
        `${data.message ?? t("search.done")} ${t("search.found", { count: data.count ?? nextProspects.length })}`,
      );
    } catch {
      setMessage(t("search.networkError"));
      setProspects([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AppTopbar title={t("search.title")} crumbs={[t("nav.prospecting"), t("nav.search")]} />
      <div className="lr-content">
        <p className="mb-6 max-w-[820px] text-[15px] leading-relaxed text-[var(--slate-600)]">
          {t("search.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="lr-card lr-card-pad-lg mb-7">
          <label className="lr-label" htmlFor="location">
            {t("search.locationLabel")}
          </label>
          <div className="lr-input-group mb-1.5">
            <span className="lr-input-ico">
              <MapPin size={16} />
            </span>
            <input
              id="location"
              className="lr-input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
              placeholder={t("search.locationPlaceholder")}
            />
          </div>
          <p className="lr-hint">{t("search.locationHint")}</p>

          <label className="lr-label mt-5">{t("search.placeTypeLabel")}</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLACE_TYPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSelectedPlaceType(value);
                  setCustomTypes("");
                }}
                className={cn(
                  "lr-pill",
                  selectedPlaceType === value && !customTypes.trim() && "active",
                )}
              >
                {placeTypeLabel(t, value)}
              </button>
            ))}
          </div>

          <label className="lr-label mt-5" htmlFor="types">
            {t("search.customTypesLabel")}
          </label>
          <input
            id="types"
            className="lr-input"
            value={customTypes}
            onChange={(event) => setCustomTypes(event.target.value)}
            placeholder={t("search.customTypesPlaceholder")}
          />
          <p className="lr-hint">{t("search.customTypesHint")}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button type="submit" disabled={isSubmitting} className="lr-btn lr-btn-gradient lr-btn-lg">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {isSubmitting ? t("search.submitting") : t("search.submit")}
            </button>
            {message ? <span className="text-[13px] text-[var(--slate-500)]">{message}</span> : null}
          </div>
        </form>

        <ProspectsResultsTable
          prospects={prospects}
          exportFilenameBase={`search_${location || "city"}`}
          title={t("search.resultsTitle")}
          meta={location ? `${location}` : undefined}
        />
      </div>
    </>
  );
}
