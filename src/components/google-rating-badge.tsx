"use client";

import { Star } from "lucide-react";

import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface GoogleRatingBadgeProps {
  rating: number | null;
  reviewCount?: number | null;
  className?: string;
}

export function GoogleRatingBadge({ rating, reviewCount, className }: GoogleRatingBadgeProps) {
  const { t } = useLocale();

  if (rating === null) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground",
          className,
        )}
      >
        {t("google.noRating")}
      </span>
    );
  }

  const tone =
    rating < 3.5
      ? "border-amber-500/30 bg-amber-50 text-amber-900"
      : rating >= 4.5
        ? "border-emerald-500/30 bg-emerald-50 text-emerald-900"
        : "border-border bg-muted/50 text-foreground";

  const title =
    reviewCount !== null && reviewCount !== undefined
      ? t("google.ratingTitle", { rating, count: reviewCount })
      : t("google.ratingTitleShort", { rating });

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
        tone,
        className,
      )}
      title={title}
    >
      <Star className="h-3 w-3 fill-current opacity-90" aria-hidden />
      {rating.toFixed(1)}
      {reviewCount !== null && reviewCount !== undefined ? (
        <span className="font-normal opacity-80">({reviewCount})</span>
      ) : null}
    </span>
  );
}
