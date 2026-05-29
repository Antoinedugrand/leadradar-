"use client";

import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";

import { ContactEmailCell, ContactPhoneCell } from "@/components/app/contact-table-cells";
import { GoogleRatingBadge } from "@/components/google-rating-badge";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { StatusBadge } from "@/components/app/status-badge";
import { TypeBadge } from "@/components/app/type-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import { downloadProspectsExcel } from "@/lib/export-prospects";
import type { Prospect } from "@/lib/types";

interface ProspectsResultsTableProps {
  prospects: Prospect[];
  exportFilenameBase?: string;
  title?: string;
  meta?: string;
}

function contactKind(status: Prospect["status"]): "new" | "contacted" {
  if (status === "emailed" || status === "replied" || status === "converted") {
    return "contacted";
  }
  return "new";
}

export function ProspectsResultsTable({
  prospects,
  exportFilenameBase = "prospects_leadsite",
  title,
  meta,
}: ProspectsResultsTableProps) {
  const { t, locale } = useLocale();
  const displayTitle = title ?? t("common.results");

  if (prospects.length === 0) {
    return null;
  }

  return (
    <div className="lr-card overflow-hidden">
      <div className="lr-card-head">
        <div>
          <div className="lr-card-title">
            {displayTitle} ({prospects.length})
          </div>
          {meta ? <div className="lr-card-sub">{meta}</div> : null}
        </div>
        <button
          type="button"
          className="lr-btn lr-btn-secondary lr-btn-sm ml-auto"
          disabled={prospects.length === 0}
          onClick={() => downloadProspectsExcel(prospects, exportFilenameBase, locale)}
        >
          <Download size={12} />
          {t("export.button", { count: prospects.length })}
        </button>
      </div>

      <div className="lr-table-wrap">
        <table className="lr-table">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.phone")}</th>
              <th>{t("common.email")}</th>
              <th>{t("common.type")}</th>
              <th>{t("table.googleRating")}</th>
              <th>{t("table.contact")}</th>
              <th>{t("table.prospectScore")}</th>
              <th style={{ textAlign: "right" }}>{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => (
              <tr key={prospect.id}>
                <td>
                  <div className="text-[13.5px] font-semibold text-[var(--slate-900)]">
                    {prospect.name}
                  </div>
                </td>
                <td>
                  <ContactPhoneCell phone={prospect.phone} source={prospect.phone_source} />
                </td>
                <td>
                  <ContactEmailCell email={prospect.email} source={prospect.email_source} />
                </td>
                <td>
                  <TypeBadge type={prospect.type} t={t} />
                </td>
                <td>
                  <GoogleRatingBadge
                    rating={prospect.google_rating}
                    reviewCount={prospect.google_review_count}
                  />
                </td>
                <td>
                  <StatusBadge
                    kind={contactKind(prospect.status)}
                    label={
                      contactKind(prospect.status) === "contacted"
                        ? t("contact.contacted")
                        : t("common.new")
                    }
                  />
                </td>
                <td>
                  <ProspectScoreBadge prospect={prospect} size="sm" />
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link
                    href={`/prospects/${prospect.id}/detail`}
                    className="lr-btn lr-btn-link"
                  >
                    {t("common.details")} →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
