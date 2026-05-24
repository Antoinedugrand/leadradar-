"use client";

import Link from "next/link";
import { Gauge, Mail, Wand2 } from "lucide-react";

import { AuditProspectButton } from "@/components/audit-prospect-button";
import { ContactStateDropdown } from "@/components/contact-state-dropdown";
import { EmailDialog } from "@/components/email-dialog";
import { GenerateSiteDialog } from "@/components/generate-site-dialog";
import { GoogleRatingBadge } from "@/components/google-rating-badge";
import { ProspectAvatar } from "@/components/app/prospect-avatar";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { StatusBadge } from "@/components/app/status-badge";
import { TypeBadge } from "@/components/app/type-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getDisplayScore } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

interface ProspectTableRowProps {
  prospect: Prospect;
}

export function ProspectTableRow({ prospect }: ProspectTableRowProps) {
  const { t } = useLocale();
  const score = getDisplayScore(prospect);
  const verdict = !prospect.website_exists
    ? t("verdict.noWebsite")
    : (prospect.audit_summary ??
      (prospect.audit_issues && prospect.audit_issues.length > 0 ? prospect.audit_issues[0] : null));

  return (
    <tr>
      <td>
        <div className="flex items-start gap-2.5">
          <ProspectAvatar
            name={prospect.name}
            score={score}
            scoreLabel={prospect.score_label}
            size="sm"
          />
          <div>
            <div className="text-[13.5px] font-semibold text-[var(--slate-900)]">{prospect.name}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <ProspectScoreBadge prospect={prospect} size="sm" />
              <TypeBadge type={prospect.type} t={t} />
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className="text-[13px] text-[var(--slate-800)]">{prospect.address ?? "—"}</div>
        {prospect.phone ? (
          <div className="lr-mono mt-0.5 text-[11px] text-[var(--slate-500)]">{prospect.phone}</div>
        ) : null}
      </td>
      <td>
        <div className="lr-mono text-xs text-[var(--slate-700)]">{prospect.email ?? "—"}</div>
      </td>
      <td>
        {!prospect.website_exists || !prospect.website_url ? (
          <StatusBadge kind="nosite" label={t("common.noSite")} />
        ) : score !== null ? (
          <div className="flex flex-col gap-1">
            <div className="text-xs text-[var(--slate-700)]">
              {t("detail.auditScore")}{" "}
              <strong className="lr-mono text-[var(--slate-900)]">{score}/100</strong>
            </div>
            <GoogleRatingBadge
              rating={prospect.google_rating}
              reviewCount={prospect.google_review_count}
            />
          </div>
        ) : (
          <span className="text-xs text-[var(--slate-500)]">{t("prospects.notAuditedYet")}</span>
        )}
      </td>
      <td>
        {verdict ? (
          <div className="max-w-[320px] text-[13px] italic leading-snug text-[var(--slate-700)]">
            « {verdict} »
          </div>
        ) : (
          <span className="text-xs text-[var(--slate-500)]">{t("prospects.notAuditedYet")}</span>
        )}
      </td>
      <td>
        <ContactStateDropdown
          prospectId={prospect.id}
          status={prospect.status}
          contactPipeline={prospect.contact_pipeline}
          hasAudit={Boolean(prospect.audit_score)}
        />
        {prospect.status === "replied" ? (
          <div className="mt-1 text-[10px] font-semibold tracking-wide text-[var(--indigo)]">
            {t("contact.replied")}
          </div>
        ) : null}
      </td>
      <td>
        <div className="lr-row-actions">
          <EmailDialog
            prospect={prospect}
            trigger={
              <button type="button" className="lr-btn lr-btn-icon bordered" title={t("map.emailAi")}>
                <Mail size={13} />
              </button>
            }
          />
          {!prospect.website_exists || !prospect.website_url ? (
            <GenerateSiteDialog
              prospect={prospect}
              trigger={
                <button type="button" className="lr-btn lr-btn-icon bordered" title={t("siteGen.button")}>
                  <Wand2 size={13} />
                </button>
              }
            />
          ) : null}
          {prospect.website_url && score === null ? (
            <AuditProspectButton
              prospectId={prospect.id}
              websiteUrl={prospect.website_url}
              leadRadar
              iconOnly
            />
          ) : null}
          <Link href={`/prospects/${prospect.id}/detail`} className="lr-btn lr-btn-link ml-1">
            {t("common.details")} ↗
          </Link>
        </div>
      </td>
    </tr>
  );
}
