"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ExportProspectsButton } from "@/components/export-prospects-button";
import { GoogleRatingBadge } from "@/components/google-rating-badge";
import { ProspectScoreBadge } from "@/components/prospect-score-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Prospect } from "@/lib/types";

interface ProspectsResultsTableProps {
  prospects: Prospect[];
  exportFilenameBase?: string;
  title?: string;
}

function contactLabel(
  status: Prospect["status"],
  t: ReturnType<typeof useLocale>["t"],
): string {
  if (status === "emailed" || status === "replied" || status === "converted") {
    return t("contact.contacted");
  }
  return t("contact.notContacted");
}

export function ProspectsResultsTable({
  prospects,
  exportFilenameBase = "prospects_leadsite",
  title,
}: ProspectsResultsTableProps) {
  const { t } = useLocale();
  const displayTitle = title ?? t("common.results");

  if (prospects.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {displayTitle} ({prospects.length})
        </h2>
        <ExportProspectsButton prospects={prospects} filenameBase={exportFilenameBase} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{t("common.name")}</th>
              <th className="px-3 py-2 font-medium">{t("common.phone")}</th>
              <th className="px-3 py-2 font-medium">{t("common.email")}</th>
              <th className="px-3 py-2 font-medium">{t("common.type")}</th>
              <th className="px-3 py-2 font-medium">{t("table.googleRating")}</th>
              <th className="px-3 py-2 font-medium">{t("table.contact")}</th>
              <th className="px-3 py-2 font-medium">{t("table.prospectScore")}</th>
              <th className="px-3 py-2 font-medium">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => (
              <tr key={prospect.id} className="border-t border-border hover:bg-accent/20">
                <td className="px-3 py-2 font-medium">{prospect.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{prospect.phone ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{prospect.email ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{prospect.type ?? "—"}</td>
                <td className="px-3 py-2">
                  <GoogleRatingBadge
                    rating={prospect.google_rating}
                    reviewCount={prospect.google_review_count}
                  />
                </td>
                <td className="px-3 py-2">{contactLabel(prospect.status, t)}</td>
                <td className="px-3 py-2">
                  <ProspectScoreBadge prospect={prospect} size="sm" showLabel={false} />
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/prospects/${prospect.id}/detail`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {t("common.details")} <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{t("table.exportHint")}</p>
    </section>
  );
}
