import { createT, type TFunction } from "@/lib/i18n";
import { getDisplayScore } from "@/lib/prospect-scorer";
import type { Locale } from "@/lib/i18n/types";
import type { Prospect, ProspectStatus } from "@/lib/types";

function escapeCsvCell(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatContactStatus(status: ProspectStatus, t: TFunction): string {
  if (status === "emailed" || status === "replied" || status === "converted") {
    return t("contact.contacted");
  }
  return t("contact.notContacted");
}

function formatScoreLabel(prospect: Prospect, t: TFunction): string {
  if (prospect.score_label === "hot") return t("score.hot");
  if (prospect.score_label === "warm") return t("score.warm");
  if (prospect.score_label === "cold") return t("score.cold");
  return "";
}

function getExportColumns(t: TFunction) {
  return [
    { header: t("common.name"), value: (p: Prospect) => p.name },
    { header: t("common.phone"), value: (p: Prospect) => p.phone ?? "" },
    { header: t("common.email"), value: (p: Prospect) => p.email ?? "" },
    { header: t("export.col.businessType"), value: (p: Prospect) => p.type ?? "" },
    { header: t("export.col.address"), value: (p: Prospect) => p.address ?? "" },
    { header: t("common.city"), value: (p: Prospect) => p.city ?? "" },
    { header: t("export.col.website"), value: (p: Prospect) => p.website_url ?? "" },
    {
      header: t("export.col.hasSite"),
      value: (p: Prospect) => (p.website_exists ? t("export.col.yes") : t("export.col.no")),
    },
    { header: t("export.col.contacted"), value: (p: Prospect) => formatContactStatus(p.status, t) },
    { header: t("common.status"), value: (p: Prospect) => p.status },
    {
      header: t("export.col.score"),
      value: (p: Prospect) => {
        const score = getDisplayScore(p);
        return score !== null ? String(score) : "";
      },
    },
    { header: t("export.col.scoreCategory"), value: (p: Prospect) => formatScoreLabel(p, t) },
    {
      header: t("export.col.googleRating"),
      value: (p: Prospect) => (p.google_rating !== null ? String(p.google_rating) : ""),
    },
    {
      header: t("export.col.reviewCount"),
      value: (p: Prospect) =>
        p.google_review_count !== null ? String(p.google_review_count) : "",
    },
    { header: t("export.col.auditSummary"), value: (p: Prospect) => p.audit_summary ?? "" },
    { header: t("export.col.createdAt"), value: (p: Prospect) => p.created_at },
  ];
}

export function buildProspectsCsv(prospects: Prospect[], locale: Locale = "en"): string {
  const t = createT(locale);
  const columns = getExportColumns(t);
  const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(";");
  const rows = prospects.map((prospect) =>
    columns.map((col) => escapeCsvCell(col.value(prospect))).join(";"),
  );
  return `\uFEFF${headerRow}\n${rows.join("\n")}`;
}

export function downloadProspectsExcel(
  prospects: Prospect[],
  filenameBase: string,
  locale: Locale = "en",
): void {
  if (prospects.length === 0) {
    return;
  }

  const csv = buildProspectsCsv(prospects, locale);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = filenameBase.replace(/[^\w\-]+/g, "_").slice(0, 80);
  link.href = url;
  link.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
