"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquareWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ReviewInsights } from "@/lib/review-insights/types";

interface FetchReviewsButtonProps {
  prospectId: string;
  googlePlaceId: string | null;
  onInsightsReady?: (insights: ReviewInsights) => void;
  className?: string;
  size?: "sm" | "default";
}

export function FetchReviewsButton({
  prospectId,
  googlePlaceId,
  onInsightsReady,
  className,
  size = "sm",
}: FetchReviewsButtonProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    if (!googlePlaceId) {
      setError(t("reviews.noGoogleId"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/prospects/${prospectId}/reviews`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        review_insights?: ReviewInsights;
      };
      if (!response.ok) {
        setError(payload.error ?? t("common.failed"));
        return;
      }

      if (payload.review_insights) {
        onInsightsReady?.(payload.review_insights);
      }
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={!googlePlaceId || isLoading}
        onClick={handleFetch}
        className={className ?? "h-8 gap-1.5 text-xs"}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <MessageSquareWarning className="h-3 w-3" />
        )}
        {isLoading ? t("reviews.loading") : t("reviews.button")}
      </Button>
      {error ? <span className="text-[10px] text-destructive">{error}</span> : null}
    </div>
  );
}
