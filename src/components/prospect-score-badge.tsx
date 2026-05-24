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
          "lr-score cold",
          size === "sm" && "text-[10px]",
          className,
        )}
        title={t("score.notScored")}
      >
        <span className="lr-score-dot" />
        {showLabel ? t("score.notScored") : null}
      </span>
    );
  }

  const label = prospect.score_label ?? labelFromScore(score);
  const meta = getScoreLabelMeta(label);
  const labelText = t(meta.labelKey);

  return (
    <span
      className={cn(
        "lr-score",
        label,
        size === "sm" && "text-[10px]",
        className,
      )}
      title={t("score.tooltip", { score, label: labelText })}
    >
      <span className="lr-score-dot" />
      {showEmoji ? <span aria-hidden>{meta.emoji}</span> : null}
      {showLabel ? <span>{labelText}</span> : null}
      <span className="lr-score-num">· {score}/100</span>
    </span>
  );
}
