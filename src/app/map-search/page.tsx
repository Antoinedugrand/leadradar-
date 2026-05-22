import Link from "next/link";

import { MainNav } from "@/components/main-nav";
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
        <MainNav />
        <main className="mx-auto w-full max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t("nav.map")}</h1>
          <p className="mt-2 text-sm text-destructive">
            {t("map.missingKey")}{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
            {t("map.in")} <code className="rounded bg-muted px-1">.env.local</code>.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/settings">{t("map.goSettings")}</Link>
          </Button>
        </main>
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
      <div className="shrink-0">
        <MainNav />
      </div>
      <div className="min-h-0 flex-1 basis-0">
        <MapSearchClient mapsApiKey={mapsApiKey} />
      </div>
    </div>
  );
}
