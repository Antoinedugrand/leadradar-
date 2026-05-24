import Link from "next/link";
import { redirect } from "next/navigation";

import { AppTopbar } from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

interface VisitPageProps {
  searchParams: Promise<{ url?: string }>;
}

function normalizeExternalUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    try {
      const parsed = new URL(`https://${value}`);
      return parsed.toString();
    } catch {
      return null;
    }
  }
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

  const safeUrl = normalizeExternalUrl(rawUrl);
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

  redirect(safeUrl);
}
