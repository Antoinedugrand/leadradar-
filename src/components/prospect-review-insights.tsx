"use client";

import { MessageSquareWarning, Monitor, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ReviewInsights } from "@/lib/review-insights/types";
import { cn } from "@/lib/utils";

interface ProspectReviewInsightsProps {
  insights: ReviewInsights | null | undefined;
  compact?: boolean;
  className?: string;
}

export function ProspectReviewInsights({
  insights,
  compact = false,
  className,
}: ProspectReviewInsightsProps) {
  const { t } = useLocale();

  if (!insights) {
    return null;
  }

  const hasContent =
    insights.improvement_points.length > 0 ||
    insights.website_improvements.length > 0 ||
    insights.service_improvements.length > 0 ||
    insights.negative_quotes.length > 0;

  if (!hasContent && insights.negative_reviews_count === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        {t("reviews.noneNegative", { count: insights.reviews_sampled })}
      </p>
    );
  }

  if (compact) {
    return (
      <p className={cn("mt-1.5 line-clamp-2 text-[11px] italic text-amber-900/90", className)}>
        <MessageSquareWarning className="mr-1 inline h-3 w-3" aria-hidden />
        {insights.summary}
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <MessageSquareWarning className="h-3 w-3" />
          {t("reviews.negativeCount", { count: insights.negative_reviews_count })}
        </Badge>
        {insights.google_rating !== null ? (
          <span className="text-xs text-muted-foreground">
            {t("reviews.googleRating", {
              rating: insights.google_rating,
              count: insights.google_review_count ?? 0,
            })}
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-foreground">{insights.summary}</p>

      {insights.improvement_points.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("reviews.improve")}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {insights.improvement_points.map((point) => (
              <li key={point.slice(0, 48)}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.website_improvements.length > 0 ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Monitor className="h-3.5 w-3.5" /> {t("reviews.online")}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {insights.website_improvements.map((point) => (
              <li key={point.slice(0, 48)}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.service_improvements.length > 0 ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-50/50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <Store className="h-3.5 w-3.5" /> {t("reviews.service")}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {insights.service_improvements.map((point) => (
              <li key={point.slice(0, 48)}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.negative_quotes.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("reviews.excerpts")}
          </p>
          <ul className="mt-2 space-y-2">
            {insights.negative_quotes.map((quote) => (
              <li
                key={`${quote.author}-${quote.when}-${quote.text.slice(0, 24)}`}
                className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
              >
                <p className="text-[11px] font-medium text-muted-foreground">
                  {quote.author} · {quote.rating}★ · {quote.when}
                </p>
                <p className="mt-1 italic leading-relaxed text-foreground">« {quote.text} »</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
