"use client";

import { FormEvent, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { ProspectsResultsTable } from "@/components/prospects-results-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLACE_TYPE_VALUES, placeTypeLabel } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/locale-provider";
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
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("search.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("search.subtitle")}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">{t("search.locationLabel")}</Label>
            <Input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
              placeholder={t("search.locationPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("search.locationHint")}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("search.placeTypeLabel")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLACE_TYPE_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelectedPlaceType(value);
                    setCustomTypes("");
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedPlaceType === value && !customTypes.trim()
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {placeTypeLabel(t, value)}
                </button>
              ))}
            </div>
            <Input
              id="types"
              value={customTypes}
              onChange={(event) => setCustomTypes(event.target.value)}
              placeholder={t("search.customTypesPlaceholder")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSubmitting ? t("search.submitting") : t("search.submit")}
            </Button>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </div>
        </form>

        <ProspectsResultsTable
          prospects={prospects}
          exportFilenameBase={`search_${location || "city"}`}
          title={t("search.resultsTitle")}
        />
      </main>
    </>
  );
}
