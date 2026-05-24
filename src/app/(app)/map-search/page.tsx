import Link from "next/link";

import { AppTopbar } from "@/components/app/app-topbar";
import { MapSearchClient } from "@/components/map-search-client";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

export default async function MapSearchPage() {
  const { t } = await getServerT();
  const mapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ??
    "";

  if (!mapsApiKey) {
    return (
      <>
        <AppTopbar title={t("nav.map")} crumbs={[t("nav.prospecting"), t("nav.map")]} />
        <div className="lr-content">
          <p className="text-sm text-destructive">
            {t("map.missingKey")}{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
            {t("map.in")} <code className="rounded bg-muted px-1">.env.local</code>.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/settings">{t("map.goSettings")}</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="app-page-fill">
      <MapSearchClient mapsApiKey={mapsApiKey} />
    </div>
  );
}
