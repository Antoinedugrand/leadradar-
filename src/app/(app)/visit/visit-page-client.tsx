"use client";

import { useEffect } from "react";
import Link from "next/link";

import { AppTopbar } from "@/components/app/app-topbar";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import { normalizeWebsiteUrl } from "@/lib/normalize-website-url";

interface VisitPageClientProps {
  safeUrl: string;
}

export function VisitPageClient({ safeUrl }: VisitPageClientProps) {
  const { t } = useLocale();

  useEffect(() => {
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  }, [safeUrl]);

  return (
    <>
      <AppTopbar title={t("visit.openedTitle")} />
      <div className="lr-content">
        <p className="text-sm text-[var(--slate-600)]">{t("visit.openedInNewTab")}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={safeUrl} target="_blank" rel="noopener noreferrer">
              {t("visit.openAgain")}
            </a>
          </Button>
          <Button asChild>
            <Link href="/prospects">{t("visit.back")}</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
