import Link from "next/link";

import { AppTopbar } from "@/components/app/app-topbar";
import { VisitPageClient } from "@/app/(app)/visit/visit-page-client";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";
import { normalizeWebsiteUrl } from "@/lib/normalize-website-url";

interface VisitPageProps {
  searchParams: Promise<{ url?: string }>;
}

export default async function VisitPage({ searchParams }: VisitPageProps) {
  const { t } = await getServerT();
  const params = await searchParams;
  const rawUrl = params.url;

  if (!rawUrl) {
    return (
      <>
        <AppTopbar title={t("visit.missingLink")} />
        <div className="lr-content">
          <p className="text-sm text-muted-foreground">{t("visit.noUrl")}</p>
          <Button asChild className="mt-6">
            <Link href="/prospects">{t("visit.back")}</Link>
          </Button>
        </div>
      </>
    );
  }

  const safeUrl = normalizeWebsiteUrl(rawUrl);
  if (!safeUrl) {
    return (
      <>
        <AppTopbar title={t("visit.invalid")} />
        <div className="lr-content">
          <p className="text-sm text-muted-foreground">{t("visit.invalidUrl")}</p>
          <Button asChild className="mt-6">
            <Link href="/prospects">{t("visit.back")}</Link>
          </Button>
        </div>
      </>
    );
  }

  return <VisitPageClient safeUrl={safeUrl} />;
}
