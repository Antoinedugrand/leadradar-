"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { getDisplayScore } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

interface MapZoneCardProps {
  prospects: Prospect[];
  className?: string;
}

export function MapZoneCard({ prospects, className }: MapZoneCardProps) {
  const { t } = useLocale();

  const total = prospects.length;
  const noSite = prospects.filter((p) => !p.website_exists).length;
  const auditBelow50 = prospects.filter((p) => {
    const score = getDisplayScore(p);
    return score !== null && score < 50;
  }).length;
  const contacted = prospects.filter(
    (p) => p.status === "emailed" || p.status === "replied" || p.status === "converted",
  ).length;

  return (
    <div className={`lr-zone-card ${className ?? ""}`} style={{ left: 24, bottom: 24 }}>
      <div className="lbl">{t("map.thisZone")}</div>
      <div className="row">
        <span>{t("map.businessesFound")}</span>
        <strong>{total}</strong>
      </div>
      <div className="row danger">
        <span>{t("map.noWebsite")}</span>
        <strong>{noSite}</strong>
      </div>
      <div className="row warn">
        <span>{t("map.auditBelow50")}</span>
        <strong>{auditBelow50}</strong>
      </div>
      <div className="row">
        <span>{t("map.statContacted")}</span>
        <strong>{contacted}</strong>
      </div>
    </div>
  );
}
