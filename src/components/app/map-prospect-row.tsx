"use client";

import Link from "next/link";
import { Gauge, Globe, Mail, Wand2 } from "lucide-react";

import { AuditProspectButton } from "@/components/audit-prospect-button";
import { EmailDialog } from "@/components/email-dialog";
import { GenerateSiteDialog } from "@/components/generate-site-dialog";
import { GoogleRatingBadge } from "@/components/google-rating-badge";
import { ProspectAvatar } from "@/components/app/prospect-avatar";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { StatusBadge } from "@/components/app/status-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import { placeTypeLabel } from "@/lib/i18n";
import { getDisplayScore } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MapProspectRowProps {
  prospect: Prospect;
  selected?: boolean;
  onSelect?: () => void;
}

function pipelineStatus(prospect: Prospect): { kind: "contacted" | "replied" | "pending"; label: string } | null {
  if (prospect.status === "replied") {
    return { kind: "replied", label: "" };
  }
  if (prospect.status === "emailed" || prospect.status === "converted") {
    return { kind: "contacted", label: "" };
  }
  if (prospect.contact_pipeline === "waiting_reply") {
    return { kind: "pending", label: "" };
  }
  return null;
}

export function MapProspectRow({ prospect, selected, onSelect }: MapProspectRowProps) {
  const { t } = useLocale();
  const score = getDisplayScore(prospect);
  const pipeline = pipelineStatus(prospect);
  const addressLine = [prospect.address?.split("·")[0]?.trim(), prospect.type ? placeTypeLabel(t, prospect.type) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        "border-b border-[var(--slate-100)] px-5 py-3.5 transition-colors",
        selected
          ? "border-l-2 border-l-[var(--indigo)] bg-[rgba(67,56,202,0.04)] pl-[18px]"
          : "border-l-2 border-l-transparent",
      )}
    >
      <div className="flex items-start gap-2.5">
        <ProspectAvatar name={prospect.name} score={score} scoreLabel={prospect.score_label} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex-1 truncate text-[13px] font-semibold text-[var(--slate-900)]">
              {prospect.name}
            </div>
            <GoogleRatingBadge rating={prospect.google_rating} reviewCount={prospect.google_review_count} />
          </div>

          {addressLine ? (
            <div className="mb-1.5 text-[11px] text-[var(--slate-500)]">{addressLine}</div>
          ) : null}

          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <ProspectScoreBadge prospect={prospect} size="sm" />
            {!prospect.website_exists || !prospect.website_url ? (
              <StatusBadge kind="nosite" label={t("common.noSite")} />
            ) : null}
            {pipeline ? (
              <StatusBadge
                kind={pipeline.kind}
                label={
                  pipeline.kind === "replied"
                    ? t("contact.replied")
                    : pipeline.kind === "contacted"
                      ? t("contact.contacted")
                      : t("contacted.tabPending")
                }
              />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1" onClick={(event) => event.stopPropagation()}>
            <AuditProspectButton
              prospectId={prospect.id}
              websiteUrl={prospect.website_url}
              leadRadar
            />
            {!prospect.website_exists || !prospect.website_url ? (
              <GenerateSiteDialog
                prospect={prospect}
                trigger={
                  <button type="button" className="lr-btn lr-btn-ghost lr-btn-sm">
                    <Wand2 size={11} /> {t("siteGen.button")}
                  </button>
                }
              />
            ) : null}
            <EmailDialog
              prospect={prospect}
              trigger={
                <button type="button" className="lr-btn lr-btn-ghost lr-btn-sm">
                  <Mail size={11} /> {t("map.emailAi")}
                </button>
              }
            />
            <Link
              href={`/prospects/${prospect.id}/detail`}
              className="lr-btn lr-btn-ghost lr-btn-sm ml-auto text-[var(--indigo)]"
            >
              {t("common.details")} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
