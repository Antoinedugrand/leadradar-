"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { Prospect } from "@/lib/types";

interface MapAiDraftCardProps {
  prospect: Prospect;
  className?: string;
}

export function MapAiDraftCard({ prospect, className }: MapAiDraftCardProps) {
  const { t } = useLocale();

  const ratingHighlight =
    prospect.google_rating !== null && prospect.google_review_count
      ? t("map.aiDraftRating", {
          rating: prospect.google_rating.toFixed(1),
          count: prospect.google_review_count,
        })
      : null;

  const preview =
    prospect.review_insights?.summary ??
    prospect.audit_summary ??
    t("map.aiDraftFallback", { name: prospect.name });

  return (
    <div className={`lr-ai-draft ${className ?? ""}`} style={{ right: 24, bottom: 24 }}>
      <div className="lr-ai-draft-head">
        <span className="badge-ai">{t("map.aiDraftBadge")}</span>
        {prospect.email ? (
          <span>
            · {t("map.aiDraftTo")} {prospect.email}
          </span>
        ) : null}
      </div>
      <h5>{t("map.aiDraftTitle", { name: prospect.name })}</h5>
      <p>
        {preview}
        {ratingHighlight ? (
          <>
            {" "}
            <span className="highlight">{ratingHighlight}</span>
          </>
        ) : null}
      </p>
      <div className="draft-foot">
        <span className="draft-pill">{t("map.aiDraftGenerated")}</span>
        {prospect.generated_site_html ? (
          <span className="draft-pill emerald">{t("map.aiDraftDemo")}</span>
        ) : null}
      </div>
    </div>
  );
}
