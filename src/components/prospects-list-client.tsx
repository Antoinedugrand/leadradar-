"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { FilterTabs } from "@/components/app/filter-tabs";
import { ProspectTableRow } from "@/components/app/prospect-table-row";
import { StatusBadge } from "@/components/app/status-badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getDisplayScore } from "@/lib/prospect-scorer";
import type { Prospect } from "@/lib/types";

type ProspectFilter = "all" | "hot" | "nosite" | "unaudited" | "unreached";

interface ProspectsListClientProps {
  prospects: Prospect[];
  errorMessage?: string | null;
}

function isHotProspect(prospect: Prospect): boolean {
  const score = getDisplayScore(prospect);
  if (score !== null) return score <= 30;
  return !prospect.website_exists || !prospect.website_url;
}

function matchesFilter(prospect: Prospect, filter: ProspectFilter): boolean {
  if (filter === "all") return true;
  if (filter === "hot") return isHotProspect(prospect);
  if (filter === "nosite") return !prospect.website_exists || !prospect.website_url;
  if (filter === "unaudited") {
    return (
      Boolean(prospect.website_exists && prospect.website_url) && getDisplayScore(prospect) === null
    );
  }
  return prospect.status === "new" || prospect.status === "audited";
}

export function ProspectsListClient({ prospects, errorMessage }: ProspectsListClientProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<ProspectFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: prospects.length,
      hot: prospects.filter((p) => isHotProspect(p)).length,
      nosite: prospects.filter((p) => !p.website_exists || !p.website_url).length,
      unaudited: prospects.filter(
        (p) => p.website_exists && p.website_url && getDisplayScore(p) === null,
      ).length,
      unreached: prospects.filter((p) => p.status === "new" || p.status === "audited").length,
    }),
    [prospects],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prospects.filter((prospect) => {
      if (!matchesFilter(prospect, filter)) return false;
      if (!q) return true;
      return (
        prospect.name.toLowerCase().includes(q) ||
        (prospect.address?.toLowerCase().includes(q) ?? false) ||
        (prospect.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [prospects, filter, query]);

  const tabItems = [
    { id: "all" as const, label: t("map.filterAll"), count: counts.all },
    { id: "hot" as const, label: t("map.statHot"), count: counts.hot },
    { id: "nosite" as const, label: t("map.filterNoSite"), count: counts.nosite },
    { id: "unaudited" as const, label: t("map.filterNotAudited"), count: counts.unaudited },
    { id: "unreached" as const, label: t("map.filterToContact"), count: counts.unreached },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <FilterTabs active={filter} items={tabItems} onChange={setFilter} />
        <div className="lr-input-group ml-auto w-full sm:w-[280px]">
          <span className="lr-input-ico">
            <Search size={14} />
          </span>
          <input
            className="lr-input"
            style={{ padding: "7px 12px 7px 36px", fontSize: 13 }}
            placeholder={t("prospects.searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="lr-card overflow-hidden">
        <div className="lr-card-head">
          <div className="lr-card-title">
            {t("prospects.tableTitle", { count: filtered.length })}
          </div>
          <StatusBadge kind="new" label={t("prospects.sortedByPotential")} />
        </div>

        <div className="lr-table-wrap">
          <table className="lr-table">
            <thead>
              <tr>
                <th style={{ width: 280 }}>{t("table.business")}</th>
                <th style={{ width: 200 }}>{t("table.addressPhone")}</th>
                <th style={{ width: 180 }}>{t("common.email")}</th>
                <th style={{ width: 130 }}>{t("table.siteAudit")}</th>
                <th>{t("table.verdict")}</th>
                <th style={{ width: 320 }}>{t("common.status")}</th>
                <th style={{ width: 160, textAlign: "right" }}>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {errorMessage ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-[var(--red)]">
                    {errorMessage}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[var(--slate-500)]">
                    {prospects.length === 0 ? (
                      <>
                        {t("prospects.empty")}{" "}
                        <Link href="/map-search" className="font-semibold text-[var(--indigo)]">
                          {t("common.map")}
                        </Link>
                        .
                      </>
                    ) : (
                      t("prospects.noMatch")
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((prospect) => (
                  <ProspectTableRow key={prospect.id} prospect={prospect} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 ? (
          <div className="lr-table-foot">
            <span>{t("prospects.shownOf", { shown: filtered.length, total: prospects.length })}</span>
          </div>
        ) : null}
      </div>
    </>
  );
}
