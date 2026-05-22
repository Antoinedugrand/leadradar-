"use client";

import { getDisplayScore, getScoreLabelMeta } from "@/lib/prospect-scorer";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Prospect, ProspectScoreLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProspectScoreBadgeProps {
  prospect: Pick<Prospect, "prospect_score" | "audit_score" | "score_label">;
  className?: string;
  showEmoji?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md";
}

function labelFromScore(score: number): ProspectScoreLabel {
  if (score <= 30) return "hot";
  if (score <= 60) return "warm";
  return "cold";
}

export function ProspectScoreBadge({
  prospect,
  className,
  showEmoji = true,
  showLabel = true,
  size = "md",
}: ProspectScoreBadgeProps) {
  const { t } = useLocale();
  const score = getDisplayScore(prospect);

  if (score === null) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border border-border bg-muted font-medium text-muted-foreground",
          size === "md" ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]",
          className,
        )}
      >
        {t("score.notScored")}
      </span>
    );
  }

  const label = prospect.score_label ?? labelFromScore(score);
  const meta = getScoreLabelMeta(label);
  const labelText = t(meta.labelKey);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-bold leading-none",
        size === "md" ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]",
        meta.className,
        className,
      )}
      title={t("score.tooltip", { score, label: labelText })}
    >
      {showEmoji ? <span aria-hidden>{meta.emoji}</span> : null}
      {showLabel ? <span className="font-semibold">{labelText}</span> : null}
      <span>{score}/100</span>
    </span>
  );
}
